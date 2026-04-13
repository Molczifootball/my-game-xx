"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  onClose: () => void;
}

export default function BugReportModal({ onClose }: Props) {
  const pathname = usePathname();
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    if (!description.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), page: pathname }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md glass-panel rounded-lg border border-outline-variant shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐛</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Report a Bug</h2>
              <p className="text-[9px] text-gray-500 font-mono mt-0.5">Page: {pathname}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm w-7 h-7 flex items-center justify-center rounded border border-outline-variant hover:border-gray-500">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {status === 'done' ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-white font-bold text-sm mb-1">Report Submitted!</p>
              <p className="text-gray-500 text-[10px]">Thanks for helping improve Lechia Online.</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-primary/20 text-primary border border-primary/40 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-all">
                Close
              </button>
            </div>
          ) : (
            <>
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">
                What went wrong?
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the bug — what happened, what you expected, steps to reproduce..."
                rows={5}
                maxLength={1000}
                className="w-full bg-black/40 border border-outline-variant rounded px-3 py-2.5 text-[11px] text-gray-200 font-mono placeholder-gray-600 outline-none focus:border-primary/50 transition-colors resize-none"
              />
              <div className="flex justify-between items-center mt-1 mb-4">
                <span className="text-[8px] text-gray-600">Be as specific as possible</span>
                <span className="text-[8px] text-gray-600 font-mono">{description.length}/1000</span>
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-[10px] mb-3">Something went wrong. Please try again.</p>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-outline-variant text-gray-500 rounded hover:text-white hover:border-gray-500 transition-all">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!description.trim() || status === 'sending'}
                  className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-red-900/30 border border-red-500/40 text-red-300 rounded hover:bg-red-800/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  {status === 'sending' ? 'Submitting...' : '🐛 Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
