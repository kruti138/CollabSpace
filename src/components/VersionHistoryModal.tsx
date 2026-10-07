'use client';

import { useState } from 'react';
import { X, History, RotateCcw, Clock, Plus, User } from 'lucide-react';
import { useToast } from './ToastContext';

export interface DocumentVersionItem {
  versionId: string;
  title: string;
  contentState: string;
  createdBy: string;
  createdAt: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  versions: DocumentVersionItem[];
  onRestoreVersion: (contentState: string) => void;
  onRefreshVersions: () => void;
  canEdit: boolean;
}

export default function VersionHistoryModal({
  isOpen,
  onClose,
  roomId,
  versions,
  onRestoreVersion,
  onRefreshVersions,
  canEdit,
}: VersionHistoryModalProps) {
  const { showToast } = useToast();
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/documents/${roomId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: snapshotTitle || 'Manual Snapshot' }),
      });

      if (res.ok) {
        showToast('Snapshot saved to version history!', 'success');
        setSnapshotTitle('');
        onRefreshVersions();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save snapshot', 'error');
      }
    } catch (err) {
      showToast('Error saving snapshot', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = (ver: DocumentVersionItem) => {
    if (confirm(`Are you sure you want to restore snapshot "${ver.title}"?`)) {
      onRestoreVersion(ver.contentState);
      showToast(`Restored snapshot: ${ver.title}`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Version History Snapshots</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Manual Version Snapshot */}
        {canEdit && (
          <form onSubmit={handleCreateSnapshot} className="my-4 flex items-center space-x-2">
            <input
              type="text"
              value={snapshotTitle}
              onChange={(e) => setSnapshotTitle(e.target.value)}
              placeholder="Snapshot label (e.g., Draft V1.0)"
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 disabled:opacity-50 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Saving...' : 'Save Version'}</span>
            </button>
          </form>
        )}

        {/* Versions List */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Available Snapshots ({versions.length})
          </h4>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No version snapshots saved yet. Click "Save Version" to record a snapshot.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {versions.map((ver) => (
                <div
                  key={ver.versionId}
                  className="flex items-center justify-between p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                >
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">{ver.title}</h5>
                    <div className="flex items-center text-xs text-slate-400 space-x-3 mt-1">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                        {new Date(ver.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center text-slate-500">
                        <User className="w-3.5 h-3.5 mr-1" />
                        {ver.createdBy}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => handleRestore(ver)}
                      className="flex items-center space-x-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 text-slate-300 font-medium text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-800 transition shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
