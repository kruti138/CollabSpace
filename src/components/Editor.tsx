'use client';

import { useEffect, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  Wifi,
  WifiOff,
  UserCheck,
} from 'lucide-react';

interface EditorProps {
  roomId: string;
  user?: {
    name: string;
    color: string;
  };
  token?: string;
  onSaveState?: (stateBase64: string) => void;
  initialState?: string | null;
  readOnly?: boolean;
}

const USER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

export default function Editor({ roomId, user, token, onSaveState, initialState, readOnly = false }: EditorProps) {
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [onlineUsers, setOnlineUsers] = useState<Array<{ clientId: number; name: string; color: string }>>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  // Generate consistent or random user info if not provided
  const currentUser = useMemo(() => {
    if (user && user.name) return user;
    const randomId = Math.floor(Math.random() * 1000);
    return {
      name: `User ${randomId}`,
      color: getRandomColor(),
    };
  }, [user]);

  // Create Yjs Document
  const ydoc = useMemo(() => new Y.Doc(), [roomId]);

  // Clean up Yjs Document when roomId changes or component unmounts
  useEffect(() => {
    return () => {
      ydoc.destroy();
    };
  }, [ydoc]);

  // Initialize Yjs WebSocket Provider
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';

    if (initialState) {
      try {
        const binaryState = Uint8Array.from(atob(initialState), (c) => c.charCodeAt(0));
        Y.applyUpdate(ydoc, binaryState);
      } catch (err) {
        console.error('Failed to apply initial document update', err);
      }
    }

    const wsProvider = new WebsocketProvider(wsUrl, roomId, ydoc, {
      params: token ? { token } : {},
    });

    wsProvider.on('status', (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(event.status);
    });

    // Awareness API setup
    wsProvider.awareness.setLocalStateField('user', {
      name: currentUser.name,
      color: currentUser.color,
    });

    const updateAwarenessUsers = () => {
      const states = wsProvider.awareness.getStates();
      const users: Array<{ clientId: number; name: string; color: string }> = [];
      let activeTypingName: string | null = null;

      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#3b82f6',
          });
          if (state.isTyping && state.user.name !== currentUser.name) {
            activeTypingName = state.user.name;
          }
        }
      });

      setOnlineUsers(users);
      setTypingUser(activeTypingName);
    };

    wsProvider.awareness.on('change', updateAwarenessUsers);
    setProvider(wsProvider);

    return () => {
      wsProvider.awareness.off('change', updateAwarenessUsers);
      wsProvider.destroy();
      setProvider(null);
    };
  }, [roomId, ydoc, currentUser.name, currentUser.color, token, initialState]);

  // Tiptap Editor configuration
  const editor = useEditor(
    {
      editable: !readOnly,
      extensions: [
        StarterKit.configure({
          history: false, // Handled by Yjs / Collaboration
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: currentUser.name,
                  color: currentUser.color,
                },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-invert max-w-none focus:outline-none min-h-[450px]',
        },
      },
      onUpdate: () => {
        if (provider) {
          provider.awareness.setLocalStateField('isTyping', true);
          setTimeout(() => {
            provider.awareness.setLocalStateField('isTyping', false);
          }, 2000);
        }
      },
    },
    [roomId, ydoc, provider, readOnly]
  );

  // Persistence auto-save debounce on document updates
  useEffect(() => {
    if (!onSaveState || !ydoc || readOnly) return;

    let timeoutId: NodeJS.Timeout;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const update = Y.encodeStateAsUpdate(ydoc);
        const base64Str = btoa(String.fromCharCode(...update));
        onSaveState(base64Str);
      }, 1500);
    };

    ydoc.on('update', handleUpdate);

    return () => {
      clearTimeout(timeoutId);
      ydoc.off('update', handleUpdate);
    };
  }, [ydoc, onSaveState, readOnly]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Presence Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-medium">
            {status === 'connected' ? (
              <span className="flex items-center text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                <Wifi className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Connected
              </span>
            ) : status === 'connecting' ? (
              <span className="flex items-center text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-full">
                <Wifi className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Connecting...
              </span>
            ) : (
              <span className="flex items-center text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2.5 py-1 rounded-full">
                <WifiOff className="w-3.5 h-3.5 mr-1.5" /> Disconnected
              </span>
            )}
          </div>

          {/* Typing Indicator */}
          {typingUser && (
            <span className="text-xs text-cyan-400 animate-pulse font-medium flex items-center space-x-1">
              <span>✍️ {typingUser} is typing...</span>
            </span>
          )}
        </div>

        {/* Who's Online Presence List */}
        <div className="flex items-center space-x-2 my-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-400" /> Online ({onlineUsers.length}):
          </span>
          <div className="flex items-center -space-x-2 overflow-hidden">
            {onlineUsers.map((u) => (
              <div
                key={u.clientId}
                className="relative flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ring-2 ring-slate-900 transition-transform hover:scale-110"
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Formatting Toolbar */}
      {editor && !readOnly && (
        <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-slate-800/60 border-b border-slate-800">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('bold')
                ? 'bg-slate-700 text-cyan-400 font-bold'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('italic')
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-md transition-colors ${
              editor.isActive('codeBlock')
                ? 'bg-slate-700 text-cyan-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Content Container */}
      <div className="flex-1 bg-slate-950/60 p-4 overflow-y-auto min-h-[450px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
