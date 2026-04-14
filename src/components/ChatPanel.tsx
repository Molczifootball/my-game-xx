"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface ChatMessage {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  user?: {
    premiumUntil: string | null;
  };
}

export default function ChatPanel() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        
        if (isFirstLoad.current) {
          lastCountRef.current = data.messages.length;
          isFirstLoad.current = false;
        } else {
          if (!open && data.messages.length > lastCountRef.current) {
            setUnread(prev => prev + (data.messages.length - lastCountRef.current));
          }
          lastCountRef.current = data.messages.length;
        }
      }
    } catch {}
  };

  // Poll every 5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when opened or new messages arrive
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages.length]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput('');
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const myId = session?.user?.id;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 text-xs">
      {/* Chat panel */}
      {open && (
        <div className="w-80 h-96 glass-panel rounded-lg shadow-2xl flex flex-col overflow-hidden border border-outline-variant animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm">💬</span>
              <span className="text-xs font-bold text-white uppercase tracking-widest">World Chat</span>
              <span className="text-[8px] text-gray-500 bg-surface-highest px-1.5 py-0.5 rounded font-mono">Global</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors text-xs">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 flex flex-col gap-1.5">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-[10px] uppercase tracking-widest">
                No messages yet. Say hello!
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.authorId === myId;
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isPremium = msg.user?.premiumUntil && new Date(msg.user.premiumUntil).getTime() > Date.now();
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1.5 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold ${isPremium ? 'text-amber-400' : isMe ? 'text-primary' : 'text-gray-400'}`}>
                          {msg.authorName}
                        </span>
                        {isPremium && <span className="text-[8px] animate-pulse">👑</span>}
                      </div>
                      <span className="text-[8px] text-gray-600 font-mono">{time}</span>
                    </div>
                    <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-[10px] leading-relaxed break-words shadow-sm transition-all
                      ${isMe
                        ? `border rounded-br-none ${isPremium ? 'bg-amber-500/10 border-amber-500/30 text-amber-50' : 'bg-primary/20 border-primary/30 text-white'}`
                        : `bg-surface-highest text-gray-200 border border-outline-variant rounded-bl-none ${isPremium ? 'border-amber-500/20' : ''}`
                      }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-outline-variant shrink-0">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                maxLength={280}
                placeholder="Message the world..."
                className="flex-1 bg-black/40 border border-outline-variant rounded px-3 py-1.5 text-[10px] text-gray-200 font-mono placeholder-gray-600 outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary rounded text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {sending ? '...' : '→'}
              </button>
            </div>
            <div className="text-right text-[8px] text-gray-600 mt-1 font-mono">{input.length}/280</div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative w-12 h-12 rounded-full bg-surface-low border border-outline-variant hover:border-primary/50 shadow-xl flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
      >
        💬
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
