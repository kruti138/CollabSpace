'use client';

import { useEffect, useState } from 'react';
import { X, Activity, User, Clock, FileEdit, UserPlus, ShieldAlert, RotateCcw, PlusCircle } from 'lucide-react';

export interface ActivityLogItem {
  _id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

interface ActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export default function ActivityLogDrawer({ isOpen, onClose, roomId }: ActivityLogDrawerProps) {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/documents/${roomId}/activity`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'RENAMED':
        return <FileEdit className="w-4 h-4 text-cyan-400" />;
      case 'COLLABORATOR_ADDED':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'ROLE_CHANGED':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'RESTORED_VERSION':
        return <RotateCcw className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Room Activity Log</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Logs Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading activity...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No activity logged for this room yet.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log._id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getActionIcon(log.action)}
                  <span className="text-xs font-bold text-slate-200">{log.actorName}</span>
                </div>
                <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-slate-300 pl-6">{log.details}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
