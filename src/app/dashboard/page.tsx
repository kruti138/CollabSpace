'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, FileText, LogOut, Share2, Calendar, ArrowRight } from 'lucide-react';

interface DocumentItem {
  _id: string;
  title: string;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const docsRes = await fetch('/api/documents');
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData.documents || []);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleCreateDocument = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/doc/${data.document.roomId}`);
      }
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20">
            C
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">CollabSpace</h1>
            <p className="text-xs text-slate-400">My Workspace</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-200">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">My Documents</h2>
            <p className="text-sm text-slate-400 mt-1">
              Create, manage, and collaborate in real-time on your text documents
            </p>
          </div>

          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            <span>{creating ? 'Creating...' : 'New Document'}</span>
          </button>
        </div>

        {/* Document List Grid */}
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No documents yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1 mb-6">
              Get started by creating your first real-time collaborative document!
            </p>
            <button
              onClick={handleCreateDocument}
              disabled={creating}
              className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-lg transition-all duration-200 flex flex-col justify-between hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-800/40 rounded-xl flex items-center justify-center text-cyan-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/doc/${doc.roomId}`;
                        navigator.clipboard.writeText(link);
                        alert('Shareable link copied to clipboard!');
                      }}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition truncate">
                    {doc.title || 'Untitled Document'}
                  </h3>

                  <div className="flex items-center text-xs text-slate-400 mt-2 space-x-1">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">ID: {doc.roomId}</span>
                  <Link
                    href={`/doc/${doc.roomId}`}
                    className="flex items-center text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
