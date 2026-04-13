"use client";

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useGame } from '@/context/GameContext';

interface Props {
  onClose: () => void;
}

export default function UserOptionsModal({ onClose }: Props) {
  const { data: session } = useSession();
  const { state, setMapSettings } = useGame();
  const [tab, setTab] = useState<'profile' | 'display' | 'account'>('profile');

  const mapSettings = state.mapSettings;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg glass-panel rounded-lg border border-outline-variant shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Player Options</h2>
              <p className="text-[9px] text-gray-500 mt-0.5">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-sm w-7 h-7 flex items-center justify-center rounded border border-outline-variant hover:border-gray-500">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant">
          {(['profile', 'display', 'account'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all
                ${tab === t ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {t === 'profile' ? '👤 Profile' : t === 'display' ? '🗺️ Map' : '🔒 Account'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <InfoRow label="Player Name" value={state.playerName} />
              <InfoRow label="Account" value={session?.user?.name || '—'} />
              <InfoRow label="Email" value={session?.user?.email || '—'} />
              <div className="bg-surface-highest border border-outline-variant rounded p-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Villages</p>
                    <p className="text-lg font-bold text-white font-mono">
                      {state.worldMap.filter(t => t.owner === state.playerName).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Total Points</p>
                    <p className="text-lg font-bold text-primary font-mono">
                      {state.worldMap.filter(t => t.owner === state.playerName).reduce((acc, t) => acc + (t.points || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display / Map Tab */}
          {tab === 'display' && (
            <div className="space-y-4">
              <ToggleRow
                label="Tactical View Mode"
                description="Isometric perspective on the world map"
                value={mapSettings.visualMode === 'tactical'}
                onChange={v => setMapSettings({ ...mapSettings, visualMode: v ? 'tactical' : 'classic' })}
              />
              <ToggleRow
                label="Show Coordinate Grid"
                description="Overlay grid coordinates on the map"
                value={mapSettings.showGrid ?? false}
                onChange={v => setMapSettings({ ...mapSettings, showGrid: v })}
              />
              <div className="border-t border-outline-variant pt-4">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-3">Default Zoom</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={0} max={6}
                    value={mapSettings.zoomIndex ?? 3}
                    onChange={e => setMapSettings({ ...mapSettings, zoomIndex: parseInt(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-[10px] text-primary font-mono font-bold w-8 text-right">
                    {[24, 32, 40, 48, 56, 64, 80][mapSettings.zoomIndex ?? 3]}px
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {tab === 'account' && (
            <div className="space-y-4">
              <div className="bg-surface-highest border border-outline-variant rounded p-4 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Logged in as</p>
                <p className="text-white font-bold">{session?.user?.name}</p>
                <p className="text-gray-500 text-[10px] font-mono">{session?.user?.email}</p>
              </div>
              <div className="border-t border-outline-variant pt-4">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-3">Danger Zone</p>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest bg-red-900/20 border border-red-500/30 text-red-400 rounded hover:bg-red-800/30 transition-all active:scale-95"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded transition-all active:scale-95">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{label}</span>
      <span className="text-[11px] text-gray-200 font-mono">{value}</span>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/50">
      <div>
        <p className="text-[10px] text-gray-200 font-bold">{label}</p>
        <p className="text-[9px] text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full border transition-all ${value ? 'bg-primary/30 border-primary/60' : 'bg-black/40 border-outline-variant'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${value ? 'left-5 bg-primary' : 'left-0.5 bg-gray-600'}`} />
      </button>
    </div>
  );
}
