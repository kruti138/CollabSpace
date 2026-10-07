'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Check,
  FileText,
  PenTool,
  History,
  Activity,
  Shield,
  Trash2,
  Lock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ShareModal, { Collaborator } from '@/components/ShareModal';
import VersionHistoryModal, { DocumentVersionItem } from '@/components/VersionHistoryModal';
import ActivityLogDrawer from '@/components/ActivityLogDrawer';
import { useToast } from '@/components/ToastContext';

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

const Whiteboard = dynamic(() => import('@/components/Whiteboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-xl border border-slate-800 text-slate-400">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading Collaborative Whiteboard...</p>
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
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('Untitled Document');
  const [initialState, setInitialState] = useState<string | null>(null);
  const [whiteboardState, setWhiteboardState] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [versions, setVersions] = useState<DocumentVersionItem[]>([]);
  const [userRole, setUserRole] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'editor' | 'whiteboard'>('editor');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);

  const fetchDocDetails = async () => {
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
          setInitialState(docData.document.contentState || null);
          setWhiteboardState(docData.document.whiteboardState || null);
          setCollaborators(docData.document.collaborators || []);
          setVersions(docData.document.versions || []);
        }
        if (docData.userRole) {
          setUserRole(docData.userRole);
        }
      }
    } catch (err) {
      console.error('Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocDetails();
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
      setTimeout(() => setSavingTitle(false), 600);
    }
  };

  const handleSaveState = async (stateBase64: string) => {
    if (userRole === 'VIEWER') return;
    try {
      await fetch(`/api/documents/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentState: stateBase64 }),
      });
    } catch (err) {
      console.error('Failed auto-saving text state:', err);
    }
  };

  const handleSaveWhiteboardState = async (stateJson: string) => {
    if (userRole === 'VIEWER') return;
    try {
      await fetch(`/api/documents/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whiteboardState: stateJson }),
      });
    } catch (err) {
      console.error('Failed auto-saving whiteboard state:', err);
    }
  };

  const handleDeleteDocument = async () => {
    if (confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      try {
        const res = await fetch(`/api/documents/${roomId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Document deleted', 'info');
          router.push('/dashboard');
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to delete document', 'error');
        }
      } catch (err) {
        showToast('Error deleting document', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading document workspace...</p>
        </div>
      </div>
    );
  }

  const isReadOnly = userRole === 'VIEWER';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      {/* Sub-Header Toolbar */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Document Title & Status */}
        <div className="flex items-center space-x-3 flex-1 min-w-[250px]">
          <Link
            href="/dashboard"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex flex-col flex-1">
            <div className="flex items-center space-x-2">
              {isReadOnly ? (
                <span className="text-lg font-bold text-slate-200">{title}</span>
              ) : (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent border-none text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 px-1.5 py-0.5 rounded hover:bg-slate-800/40 transition"
                  placeholder="Untitled Document"
                />
              )}
              {savingTitle && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
              {isReadOnly && (
                <span className="flex items-center text-xs bg-amber-950/80 border border-amber-800/60 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                  <Lock className="w-3 h-3 mr-1" /> View Only
                </span>
              )}
            </div>
            <span className="text-xs font-mono text-slate-500 px-1.5">Room ID: {roomId}</span>
          </div>
        </div>

        {/* Tab Selector: Rich Text Editor vs Whiteboard */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document</span>
          </button>
          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'whiteboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Whiteboard</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVersionModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs px-3 py-2 rounded-xl border border-slate-700/80 transition"
            title="Version Snapshots"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Versions</span>
          </button>

          <button
            onClick={() => setShowActivityDrawer(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs px-3 py-2 rounded-xl border border-slate-700/80 transition"
            title="Activity Timeline"
          >
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Activity</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {userRole === 'OWNER' && (
            <button
              onClick={handleDeleteDocument}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col">
        {activeTab === 'editor' ? (
          <Editor
            roomId={roomId}
            user={user ? { name: user.name, color: user.color } : undefined}
            token={token}
            onSaveState={handleSaveState}
            initialState={initialState}
            readOnly={isReadOnly}
          />
        ) : (
          <Whiteboard
            roomId={roomId}
            initialState={whiteboardState}
            onSaveState={handleSaveWhiteboardState}
            readOnly={isReadOnly}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        roomId={roomId}
        documentTitle={title}
        userRole={userRole}
        collaborators={collaborators}
        onUpdateCollaborators={fetchDocDetails}
      />

      <VersionHistoryModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        roomId={roomId}
        versions={versions}
        onRestoreVersion={(contentState) => setInitialState(contentState)}
        onRefreshVersions={fetchDocDetails}
        canEdit={!isReadOnly}
      />

      <ActivityLogDrawer
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        roomId={roomId}
      />
    </main>
  );
}
