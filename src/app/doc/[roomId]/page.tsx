'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Share2, Check } from 'lucide-react';

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Connecting to CollabSpace Room...</p>
      </div>
    </div>
  ),
});

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  color: string;
}

export default function DocumentPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('Untitled Document');
  const [initialState, setInitialState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => {
    async function loadDocAndUser() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        const docRes = await fetch(`/api/documents/${roomId}`);
        if (docRes.ok) {
          const docData = await docRes.json();
          if (docData.document) {
            setTitle(docData.document.title || 'Untitled Document');
            if (docData.document.contentState) {
              setInitialState(docData.document.contentState);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching document data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDocAndUser();
  }, [roomId]);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    setSavingTitle(true);
    try {
      await fetch(`/api/documents/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setTimeout(() => setSavingTitle(false), 500);
    }
  };

  const handleSaveState = async (stateBase64: string) => {
    try {
      await fetch(`/api/documents/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentState: stateBase64 }),
      });
    } catch (err) {
      console.error('Failed auto-saving document state:', err);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Document Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="bg-transparent border-none text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 px-1 rounded hover:bg-slate-800/40 transition"
                placeholder="Untitled Document"
              />
              {savingTitle && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
            </div>
            <span className="text-xs font-mono text-slate-500 px-1">Room: {roomId}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm px-3.5 py-1.5 rounded-lg transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          {user && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Main Editor Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col">
        <Editor
          roomId={roomId}
          user={user ? { name: user.name, color: user.color } : undefined}
          token={token}
          onSaveState={handleSaveState}
          initialState={initialState}
        />
      </div>
    </main>
  );
}
