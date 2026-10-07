'use client';

import { useState } from 'react';
import { X, UserPlus, Shield, Trash2, Check, Copy, User } from 'lucide-react';
import { useToast } from './ToastContext';

export interface Collaborator {
  userId?: string;
  email: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  documentTitle: string;
  userRole: 'OWNER' | 'EDITOR' | 'VIEWER';
  collaborators: Collaborator[];
  onUpdateCollaborators: () => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  roomId,
  documentTitle,
  userRole,
  collaborators,
  onUpdateCollaborators,
}: ShareModalProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const canManage = userRole === 'OWNER';

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/documents/${roomId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to add collaborator', 'error');
      } else {
        showToast(`Added ${email} as ${role.toLowerCase()}`, 'success');
        setEmail('');
        onUpdateCollaborators();
      }
    } catch (err) {
      showToast('An unexpected error occurred', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (targetEmail: string) => {
    try {
      const res = await fetch(`/api/documents/${roomId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      if (res.ok) {
        showToast(`Removed ${targetEmail}`, 'info');
        onUpdateCollaborators();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to remove collaborator', 'error');
      }
    } catch (err) {
      showToast('Error removing collaborator', 'error');
    }
  };

  const handleRoleChange = async (targetEmail: string, newRole: 'EDITOR' | 'VIEWER') => {
    try {
      const res = await fetch(`/api/documents/${roomId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, role: newRole }),
      });

      if (res.ok) {
        showToast(`Updated ${targetEmail} role to ${newRole.toLowerCase()}`, 'success');
        onUpdateCollaborators();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update role', 'error');
      }
    } catch (err) {
      showToast('Error updating role', 'error');
    }
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Shareable document link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" /> Share Document
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Copy Link Section */}
        <div className="my-5 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden mr-2">
            <Copy className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-mono text-slate-300 truncate">{window.location.href}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Add Collaborator Form (Owners only) */}
        {canManage && (
          <form onSubmit={handleAddCollaborator} className="mb-6 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Add Collaborators by Email
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
              >
                <option value="EDITOR">Can Edit</option>
                <option value="VIEWER">Can View</option>
              </select>
              <button
                type="submit"
                disabled={adding}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1 disabled:opacity-50 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{adding ? 'Adding...' : 'Invite'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Collaborators List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            People with access ({collaborators.length})
          </h4>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {collaborators.map((c) => (
              <div
                key={c.email}
                className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                    {c.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-medium text-slate-200 truncate">{c.email}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{c.role}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {c.role !== 'OWNER' && canManage ? (
                    <>
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c.email, e.target.value as 'EDITOR' | 'VIEWER')}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-[11px] px-2 py-1 rounded-lg focus:outline-none"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveCollaborator(c.email)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Remove user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 px-2 py-1 bg-slate-800/60 rounded-md">
                      {c.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
