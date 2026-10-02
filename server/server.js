const http = require('http');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
require('dotenv').config();

const port = process.env.PORT || 1234;

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

server.on('upgrade', (request, socket, head) => {
  const handleAuth = (ws) => {
    wss.emit('connection', ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port, () => {
  console.log(`y-websocket server running on port ${port}`);
});
