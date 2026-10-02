'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Initializing Real-time Editor...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [roomId, setRoomId] = useState('demo-room');
  const [activeRoom, setActiveRoom] = useState('demo-room');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-cyan-500/20">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-white">CollabSpace</span>
          <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-semibold">
            CRDT Sync
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
            className="bg-slate-800 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => setActiveRoom(roomId || 'demo-room')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm px-4 py-1.5 rounded-lg transition"
          >
            Join Room
          </button>
        </div>
      </header>

      {/* Editor Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">
            Room: <span className="text-cyan-400 font-mono">{activeRoom}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Open this page in two separate browser tabs to test live conflict-free sync.
          </p>
        </div>

        <div className="flex-1 flex flex-col">
          <Editor roomId={activeRoom} />
        </div>
      </div>
    </main>
  );
}
