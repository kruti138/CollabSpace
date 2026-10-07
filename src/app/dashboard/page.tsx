'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Share2,
  Calendar,
  ArrowRight,
  Search,
  Users,
  UserCheck,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/components/ToastContext';

interface DocumentItem {
  _id: string;
  title: string;
  roomId: string;
  ownerId: string;
  collaborators: Array<{ email: string; role: string }>;
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
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'mine' | 'shared'>('all');

  const fetchDashboardData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const docsRes = await fetch(`/api/documents?q=${encodeURIComponent(searchQuery)}&filter=${filterCategory}`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router, filterCategory, searchQuery]);

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
        showToast('Created new document', 'success');
        router.push(`/doc/${data.document.roomId}`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed creating document', 'error');
      }
    } catch (err) {
      showToast('Error creating document', 'error');
    } finally {
      setCreating(false);
    }
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
      <Navbar user={user} />

      {/* Main Workspace Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col">
        {/* Welcome Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-cyan-400">{user?.name}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Create documents, draw on whiteboards, and collaborate with your team in real time.
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

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setFilterCategory('mine')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterCategory === 'mine'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Documents
            </button>
            <button
              onClick={() => setFilterCategory('shared')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filterCategory === 'shared'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Shared With Me
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/80 rounded-2xl p-12 text-center bg-slate-900/30">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No documents found</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1 mb-6">
              {searchQuery
                ? `No documents matching "${searchQuery}"`
                : 'Create your first collaborative document to get started!'}
            </p>
            <button
              onClick={handleCreateDocument}
              disabled={creating}
              className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              const isOwner = user && doc.ownerId === user.userId;
              const collabCount = doc.collaborators?.length || 1;

              return (
                <div
                  key={doc._id}
                  className="group bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 shadow-lg transition-all duration-200 flex flex-col justify-between hover:shadow-cyan-500/10"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-800/40 rounded-xl flex items-center justify-center text-cyan-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/doc/${doc.roomId}`;
                            navigator.clipboard.writeText(link);
                            showToast('Shareable link copied!', 'success');
                          }}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                          title="Copy share link"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition truncate">
                      {doc.title || 'Untitled Document'}
                    </h3>

                    <div className="flex items-center text-xs text-slate-400 mt-2 space-x-3">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center text-slate-500">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {collabCount} {collabCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      {isOwner ? 'Owner' : 'Shared'}
                    </span>
                    <Link
                      href={`/doc/${doc.roomId}`}
                      className="flex items-center text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
