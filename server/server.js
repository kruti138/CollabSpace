const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const Y = require('yjs');
require('dotenv').config();

const port = process.env.PORT || 1234;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabspace';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_collabspace_2026';

// Minimal Document Schema for persistence on server
const DocumentSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled Document' },
    roomId: { type: String, required: true, unique: true, index: true },
    contentState: { type: String, default: '' },
  },
  { timestamps: true }
);

const MongoDocument = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log('[WS Server] Connected to MongoDB');
}).catch((err) => {
  console.error('[WS Server] MongoDB connection error:', err);
});

// Configure Yjs Persistence with MongoDB
setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      const doc = await MongoDocument.findOne({ roomId: docName });
      if (doc && doc.contentState) {
        const binaryState = Buffer.from(doc.contentState, 'base64');
        Y.applyUpdate(ydoc, binaryState);
        console.log(`[WS Server] Restored state for room: ${docName}`);
      }
    } catch (err) {
      console.error(`[WS Server] Error loading state for room ${docName}:`, err);
    }
  },
  writeState: async (docName, ydoc) => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64Str = Buffer.from(update).toString('base64');
      await MongoDocument.findOneAndUpdate(
        { roomId: docName },
        { contentState: base64Str },
        { upsert: true }
      );
      console.log(`[WS Server] Saved state for room: ${docName}`);
    } catch (err) {
      console.error(`[WS Server] Error saving state for room ${docName}:`, err);
    }
  },
});

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok', time: new Date() }));
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('CollabSpace Yjs WebSocket Server is Running\n');
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req);
});

// Handle WebSocket connection upgrade with JWT Auth check
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    // If token is provided, verify JWT secret
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.user = decoded;
      } catch (authErr) {
        console.warn('[WS Auth Failed] Invalid or expired JWT token provided');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch (err) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`[WS Server] Listening on port ${port}`);
});
