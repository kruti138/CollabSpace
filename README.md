# CollabSpace 📝⚡

**CollabSpace** is a real-time collaborative text editor built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Tiptap**, and **Yjs**. It enables multiple users to write, format, and edit rich text documents concurrently with conflict-free state synchronization and live collaborative cursor presence.

![CollabSpace Header](https://raw.githubusercontent.com/placeholder/collabspace/main/banner.png)

---

## ✨ Features

- 🔄 **Conflict-Free Real-Time Synchronization**: Instant, sub-millisecond document sync across all connected clients powered by Yjs CRDT.
- 🎯 **Live Presence & Cursors**: See active collaborator names, custom avatar badges, and real-time colored cursor positions as they type.
- 🔐 **JWT Authentication**: Secure user registration and login with httpOnly cookies and JWT token verification.
- 📂 **Room & Document Management**: Create new rooms, edit document titles, copy shareable room links, and view your personal document dashboard.
- 💾 **State Persistence**: Automatic debounced document state serialization to MongoDB so content survives page reloads.
- ↩️ **Undo/Redo History**: Granular undo/redo tracking powered by Yjs transaction history without state collision across clients.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Rich Text Editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`)
- **Real-Time Engine**: Yjs (`yjs`), `y-websocket`, `y-prosemirror`, Yjs Awareness API
- **Backend / WebSocket**: Node.js, `ws`, `y-websocket/bin/utils` standalone server
- **Database**: MongoDB Atlas with Mongoose
- **Auth**: JWT (JSON Web Tokens), `scrypt` password hashing, httpOnly cookies

---

## 🔬 How CRDT Sync Works

> **CRDT Architecture in CollabSpace:**  
> CollabSpace uses **Yjs**, a high-performance Conflict-free Replicated Data Type (CRDT) framework, to handle real-time collaboration. Instead of sending full document snapshots over the network, every edit made in the Tiptap editor is represented as an atomic, deterministic operations tree (Y.Doc updates). When clients make concurrent edits—such as typing in the same paragraph simultaneously—Yjs merges these operations deterministically using unique client identifiers and sequence vector clocks without requiring a central authority to arbitrate conflicts. The `y-websocket` server relays these compact binary update payloads between peers, while the Yjs Awareness protocol broadcasts client metadata (name, cursor offset, selection range, color) across WebSocket channels to render live collaborative cursors in real time.

---

## 📁 Repository Structure

```
CollabSpace/
├── server/                 # Standalone Node.js Yjs WebSocket Server
│   ├── server.js           # WebSocket server with JWT auth & MongoDB persistence
│   ├── package.json        # WebSocket server dependencies
│   └── .env                # Server environment variables
├── src/
│   ├── app/                # Next.js App Router routes & API endpoints
│   │   ├── api/            # Auth & Document REST API endpoints
│   │   ├── dashboard/      # My Documents workspace page
│   │   ├── doc/[roomId]/   # Collaborative Editor route
│   │   ├── login/          # User Login page
│   │   ├── signup/         # User Registration page
│   │   ├── globals.css     # Tailwind CSS & ProseMirror styling
│   │   └── page.tsx        # Quick demo landing page
│   ├── components/         # Reusable React components (Editor, Toolbar)
│   ├── lib/                # Database (Mongoose) and Auth utilities
│   └── models/             # Mongoose schemas (User, Document)
├── .env.example            # Environment template
└── package.json            # Main Next.js project package configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ installed
- MongoDB instance running locally (`mongodb://127.0.0.1:27017/collabspace`) or a MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/your-username/collabspace.git
cd collabspace
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` in the root folder:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/collabspace
JWT_SECRET=super_secret_jwt_key_collabspace_2026
NEXT_PUBLIC_WS_URL=ws://localhost:1234
PORT=1234
```

And create `server/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/collabspace
JWT_SECRET=super_secret_jwt_key_collabspace_2026
PORT=1234
```

### 3. Install Dependencies
```bash
# Install Next.js frontend dependencies
npm install --legacy-peer-deps

# Install WebSocket server dependencies
cd server && npm install && cd ..
```

### 4. Run Development Servers
Start the WebSocket server in one terminal:
```bash
cd server
npm start
# Listens on ws://localhost:1234
```

Start the Next.js frontend app in another terminal:
```bash
npm run dev
# Starts on http://localhost:3000
```

Open `http://localhost:3000` in two different browser windows to test live conflict-free text editing and cursor presence!

---

## 🌐 Deployment Instructions

### 1. Deploy WebSocket Server to Render (Web Service)
1. Push this repository to GitHub.
2. Log in to [Render](https://render.com) and create a **New Web Service**.
3. Connect your repository and configure:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables in Render:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your production JWT secret
   - `PORT`: `10000` (or Render default)
5. Copy your deployed WebSocket server URL (e.g. `wss://collabspace-ws.onrender.com`).

### 2. Deploy Next.js Frontend to Vercel
1. Log in to [Vercel](https://vercel.com) and import the root repository.
2. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_WS_URL`: `wss://collabspace-ws.onrender.com` (your Render WS URL)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Same production JWT secret as WS server
3. Click **Deploy**.

---

## 📸 Screenshots & Showcase

| Real-Time Collaboration | Document Dashboard |
| :---: | :---: |
| ![Live Sync & Cursors](https://raw.githubusercontent.com/placeholder/collabspace/main/demo-sync.gif) | ![Dashboard](https://raw.githubusercontent.com/placeholder/collabspace/main/demo-dashboard.png) |

---

## 📄 License
MIT License © 2026 CollabSpace
