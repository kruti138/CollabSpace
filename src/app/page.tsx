'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Zap,
  Shield,
  Users,
  PenTool,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[450px] bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Initializing Real-time CRDT Engine...</p>
      </div>
    </div>
  ),
});

export default function LandingPage() {
  const [demoRoomId] = useState('demo-global-room');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar user={null} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-400 mb-6 shadow-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Powered by Yjs CRDT & WebSockets</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Real-Time Collaboration Without Conflicts or Overwrites
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Write rich text documents, sketch on interactive whiteboards, and collaborate with your team concurrently in real time with sub-millisecond CRDT state synchronization.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Start Collaborating Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-6 py-3.5 rounded-xl border border-slate-800 transition"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Live Editor Demo */}
      <section className="py-12 px-6 max-w-6xl w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-white">Interactive Sandbox Room</h2>
          <p className="text-sm text-slate-400 mt-1">
            Open this page in two separate browser tabs to experience real-time sync in action!
          </p>
        </div>

        <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-2xl shadow-2xl">
          <Editor roomId={demoRoomId} />
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-6 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white">Built for High-Performance Teams</h2>
            <p className="text-slate-400 mt-2">Everything you need for seamless multi-user collaboration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/40 transition">
              <div className="w-12 h-12 bg-cyan-950/80 border border-cyan-800/40 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sub-ms CRDT Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Atomic vector clock operational tree updates ensure zero conflicts and zero data loss, even under high network latency.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/40 transition">
              <div className="w-12 h-12 bg-cyan-950/80 border border-cyan-800/40 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Interactive Whiteboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Switch seamlessly between rich text formatting and collaborative freehand diagramming powered by tldraw.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/40 transition">
              <div className="w-12 h-12 bg-cyan-950/80 border border-cyan-800/40 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Role Permissions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enforce document permissions on both REST API and WebSocket connection layers (Owner, Editor, Viewer).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <p>CollabSpace © 2026. Built with Next.js, Yjs, Tiptap, tldraw, and MongoDB Atlas.</p>
      </footer>
    </div>
  );
}
