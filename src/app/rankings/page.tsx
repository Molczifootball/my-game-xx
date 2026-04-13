"use client";

import { useGame } from '@/context/GameContext';
import { useState, useMemo } from 'react';
import PlayerContextMenu from '@/components/PlayerContextMenu';
import { useRouter } from 'next/navigation';

type SortKey = 'points' | 'villages' | 'name';

interface PlayerEntry {
  owner: string;
  totalPoints: number;
  villageCount: number;
  isYou: boolean;
}

export default function RankingsPage() {
  const { state } = useGame();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortKey>('points');
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ playerName: string; x: number; y: number } | null>(null);

  const playerRankings: PlayerEntry[] = useMemo(() => {
    const map = new Map<string, PlayerEntry>();
    state.worldMap
      .filter(t => t.type === 'village' || t.type === 'player')
      .forEach(tile => {
        const owner = tile.owner ?? 'Unknown';
        const isYou = owner === state.playerName;
        const pts = tile.points ?? 0;
        if (map.has(owner)) {
          const entry = map.get(owner)!;
          entry.totalPoints += pts;
          entry.villageCount += 1;
        } else {
          map.set(owner, { owner, totalPoints: pts, villageCount: 1, isYou });
        }
      });
    return Array.from(map.values()).sort((a, b) => {
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      if (sortBy === 'villages') return b.villageCount - a.villageCount;
      return a.owner.localeCompare(b.owner);
    });
  }, [state.worldMap, sortBy, state.playerName]);

  const leaderboard = useMemo(() => playerRankings.filter(p => p.owner !== 'Barbarian'), [playerRankings]);
  const filtered = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter(p => p.owner.toLowerCase().includes(q));
  }, [leaderboard, search]);

  const yourRank = leaderboard.findIndex(p => p.isYou) + 1;
  const youEntry = leaderboard.find(p => p.isYou);

  const handlePlayerClick = (e: React.MouseEvent, playerName: string) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ playerName, x: rect.right + 8, y: rect.top });
  };

  const handleNavigate = (x: number, y: number) => {
    router.push('/map');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-surface-dim">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-outline-variant bg-surface-low">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg text-white font-bold medieval-font tracking-widest uppercase">World Rankings</h1>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-gray-500 font-mono">{leaderboard.length} players</span>
          </div>
        </div>

        {/* Your rank card */}
        {youEntry && (
          <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded px-4 py-2 mb-3">
            <span className="text-2xl">{yourRank === 1 ? '🥇' : yourRank === 2 ? '🥈' : yourRank === 3 ? '🥉' : '🏰'}</span>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Your Rank</span>
              <span className="text-primary font-mono font-bold text-lg">#{yourRank}</span>
            </div>
            <div className="w-px h-8 bg-outline-variant" />
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Points</span>
              <span className="text-white font-mono font-bold">{youEntry.totalPoints.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-outline-variant" />
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Villages</span>
              <span className="text-white font-mono font-bold">{youEntry.villageCount}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {(['points', 'villages', 'name'] as SortKey[]).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all
                  ${sortBy === key
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'border-outline-variant text-gray-500 hover:text-primary hover:border-primary/30'
                  }`}
              >
                {key === 'points' ? 'Points' : key === 'villages' ? 'Villages' : 'Name'}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player..."
              className="w-full bg-black/30 border border-outline-variant rounded px-3 py-1.5 text-[10px] text-gray-300 font-mono placeholder-gray-600 outline-none focus:border-primary/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 text-[10px]">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {/* Header row */}
        <div className="sticky top-0 bg-surface-base/95 backdrop-blur-sm grid grid-cols-[40px_1fr_80px_100px] gap-2 px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 border-b border-outline-variant z-10">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Villages</span>
          <span className="text-right">Points</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-600 text-[10px] uppercase tracking-widest">
            No players found.
          </div>
        ) : (
          <div className="px-6 py-1">
            {filtered.map((entry) => {
              const rank = playerRankings.indexOf(entry) + 1;
              return (
                <div
                  key={entry.owner}
                  className={`grid grid-cols-[40px_1fr_80px_100px] gap-2 items-center px-0 py-2.5 border-b border-outline-variant/30 transition-colors
                    ${entry.isYou ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}
                  `}
                >
                  <span className={`font-mono text-xs text-center font-bold
                    ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                    {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                  </span>

                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => handlePlayerClick(e, entry.owner)}
                      className={`text-xs font-bold truncate hover:underline transition-colors text-left ${entry.isYou ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
                    >
                      {entry.owner}
                    </button>
                    {entry.isYou && (
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase shrink-0">You</span>
                    )}
                  </div>

                  <span className="text-right text-xs font-mono text-gray-500">{entry.villageCount}</span>
                  <span className={`text-right text-xs font-mono font-bold ${entry.isYou ? 'text-primary' : 'text-gray-400'}`}>
                    {entry.totalPoints.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {contextMenu && (
        <PlayerContextMenu
          playerName={contextMenu.playerName}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
