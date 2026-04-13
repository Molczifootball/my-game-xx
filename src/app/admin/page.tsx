"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

interface AdminData {
  stats: {
    totalUsers: number;
    totalVillages: number;
    activeCommands: number;
    onlineNow: number;
  };
  onlineUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  }>;
  bugs: Array<{
    id: string;
    description: string;
    page: string | null;
    reporterName: string | null;
    createdAt: string;
    status: string;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = () => {
    fetch('/api/admin')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(resData => {
        if (resData.error) throw new Error(resData.error);
        setData(resData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchAdminData();
    }
  }, [status, router]);

  const handleBugAction = async (bugId: string, action: 'markDone' | 'delete') => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId, action })
      });
      if (res.ok) fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0E1111] flex items-center justify-center text-primary font-mono tracking-widest animate-pulse">AUTHORIZING...</div>;
  if (error) return <div className="min-h-screen bg-[#0E1111] flex flex-col items-center justify-center text-red-500 font-mono tracking-widest gap-4"><div>ACCESS DENIED</div><Link href="/" className="px-4 py-2 bg-surface text-gray-300 border border-outline-variant hover:border-primary">RETURN TO GAME</Link></div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#0E1111] text-gray-200">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-6">
          <div>
            <h1 className="text-2xl font-black uppercase text-white tracking-widest flex items-center gap-2">
              <span className="text-primary text-3xl">👑</span> Overseer Terminal
            </h1>
            <p className="text-sm font-mono text-gray-500 mt-1">Super Admin Authority Access</p>
          </div>
          <Link href="/map" className="px-4 py-2 glass-panel border border-outline-variant hover:border-primary/50 hover:bg-primary/10 rounded transition-all font-bold text-xs uppercase tracking-widest">
            Back to Realm
          </Link>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-outline-variant p-4 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Registered Lords</span>
            <span className="text-3xl font-black text-white">{data.stats.totalUsers}</span>
          </div>
          <div className="bg-surface border border-outline-variant p-4 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Active Sessions</span>
            <span className="text-3xl font-black text-green-400">{data.stats.onlineNow}</span>
          </div>
          <div className="bg-surface border border-outline-variant p-4 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Populated Villages</span>
            <span className="text-3xl font-black text-amber-500">{data.stats.totalVillages}</span>
          </div>
          <div className="bg-surface border border-outline-variant p-4 rounded-lg flex flex-col">
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">Armies in Motion</span>
            <span className="text-3xl font-black text-red-400">{data.stats.activeCommands}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* USER REGISTRY */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase border-b border-outline-variant pb-2">Active Users (Valid Sessions)</h2>
            <div className="bg-surface-low border border-outline-variant rounded-lg overflow-hidden">
              <ul className="divide-y divide-outline-variant">
                {data.onlineUsers.length === 0 ? (
                   <li className="p-4 text-xs text-gray-500 text-center uppercase tracking-widest">No active sessions</li>
                ) : data.onlineUsers.map(user => (
                  <li key={user.id} className="p-3 flex flex-col hover:bg-surface transition-colors cursor-default">
                    <span className="text-sm font-bold text-white">{user.name || 'Anonymous'}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{user.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BUG REPORTS */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold text-amber-500 tracking-widest uppercase border-b border-outline-variant pb-2">Recent Bug Reports</h2>
            <div className="space-y-3">
              {data.bugs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-mono text-sm border border-dashed border-outline-variant rounded-xl">
                  No bugs reported. The realm is flawless.
                </div>
              ) : data.bugs.map(bug => (
                <div key={bug.id} className={`border rounded-lg p-4 flex flex-col gap-2 transition-all ${
                  bug.status === 'done' ? 'bg-surface-highest/50 border-green-900/50 opacity-60' : 'bg-surface border-outline-variant'
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <p className={`text-sm whitespace-pre-wrap ${bug.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                      {bug.description}
                    </p>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {bug.page && (
                        <span className="px-2 py-1 bg-surface-highest text-primary border border-primary/20 rounded font-mono text-[9px] uppercase">
                          {bug.page.replace('/', ' / ')}
                        </span>
                      )}
                      {bug.status === 'done' && (
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">Resolved</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-2 border-t border-outline-variant/30">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <span className="font-bold text-amber-500/70">{bug.reporterName || 'Unknown'}</span>
                      <span className="opacity-50">• {new Date(bug.createdAt).toLocaleString()}</span>
                    </span>
                    <div className="flex gap-2 items-center">
                      {bug.status !== 'done' && (
                        <button onClick={() => handleBugAction(bug.id, 'markDone')} className="text-green-500 hover:text-green-400 hover:underline">
                          Mark Resolved
                        </button>
                      )}
                      <button onClick={() => handleBugAction(bug.id, 'delete')} className="text-red-500 hover:text-red-400 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
