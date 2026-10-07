'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, FileText, User, CheckCircle2, Shield } from 'lucide-react';
import { useToast } from './ToastContext';

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  color: string;
}

interface NotificationItem {
  _id: string;
  senderName: string;
  documentTitle: string;
  roomId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Navbar({ user }: { user: UserProfile | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('Notifications marked as read', 'info');
    } catch (err) {
      console.error('Failed marking notifications read:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast('Logged out successfully', 'info');
    router.push('/login');
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            C
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition">
              CollabSpace
            </span>
            <span className="text-[10px] text-slate-400 tracking-wide uppercase font-semibold">
              Real-time Workspace
            </span>
          </div>
        </Link>
      </div>

      {user ? (
        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl relative transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n._id}
                        href={`/doc/${n.roomId}`}
                        onClick={() => setShowNotifications(false)}
                        className={`block p-2.5 rounded-xl border text-xs transition ${
                          n.read
                            ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                            : 'bg-slate-800/60 border-cyan-500/40 text-slate-100 font-medium'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <Shield className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate">{n.message}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-200">{user.name}</span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white font-medium text-sm px-4 py-2 rounded-xl transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
