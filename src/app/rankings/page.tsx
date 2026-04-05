"use client";

import { useGame } from '@/context/GameContext';
import { useState, useMemo } from 'react';

type SortKey = 'points' | 'villages' | 'name';

interface PlayerEntry {
  owner: string;
  totalPoints: number;
  villageCount: number;
  isYou: boolean;
}

export default function RankingsPage() {
  const { state, playerPoints } = useGame();
  const [sortBy, setSortBy] = useState<SortKey>('points');
  const [search, setSearch] = useState('');

  // Aggregate points per owner (preparing for multi-village future)
  const playerRankings: PlayerEntry[] = useMemo(() => {
    const map = new Map<string, PlayerEntry>();

    state.worldMap
      .filter(t => t.type === 'village' || t.type === 'player')
      .forEach(tile => {
        const owner = tile.owner ?? 'Unknown';
        const isYou = tile.type === 'player' || owner === state.playerName;
        const pts = tile.type === 'player' ? playerPoints : (tile.points ?? 0);

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
      if (sortBy === 'name') return a.owner.localeCompare(b.owner);
      return 0;
    });
  }, [state.worldMap, sortBy, playerPoints, state.playerName]);

  // Filter: exclude NPC barbarians from the player leaderboard
  const leaderboard = useMemo(() =>
    playerRankings.filter(p => p.owner !== 'Barbarian')
  , [playerRankings]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter(p => p.owner.toLowerCase().includes(q));
  }, [leaderboard, search]);

  const youEntry = leaderboard.find(p => p.isYou);
  const yourRank = leaderboard.findIndex(p => p.isYou) + 1;
  const totalPlayers = leaderboard.length;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#0d0a06]">
      {/* Page Header */}
      <div className="bg-gradient-to-b from-[#1c140d] to-[#0f0c07] border-b border-[#3e2c1e] px-8 py-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#ffb700] medieval-font tracking-widest drop-shadow mb-1">
                World Rankings
              </h1>
              <p className="text-[#8c6239] text-xs font-mono uppercase tracking-widest">
                {totalPlayers.toLocaleString()} players — your rank:{' '}
                <span className="text-amber-400 font-bold">#{yourRank || '—'}</span>
                {youEntry && (
                  <span className="ml-3 text-[#5e4126]">
                    ({youEntry.totalPoints.toLocaleString()} pts · {youEntry.villageCount} village{youEntry.villageCount !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['points', 'villages', 'name'] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-all
                    ${sortBy === key
                      ? 'bg-amber-900/60 border-amber-600/60 text-amber-300'
                      : 'bg-black/40 border-[#3e2c1e] text-[#8c6239] hover:text-[#ffb700] hover:border-amber-800/50'
                    }`}
                >
                  {key === 'points' ? '⚔️ Points' : key === 'villages' ? '🏘️ Villages' : '🔤 Name'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c6239] text-sm pointer-events-none">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by player name…"
              className="w-full bg-black/50 border border-[#3e2c1e] rounded px-4 py-2 pl-8 text-sm text-amber-100 font-mono placeholder-[#5e4126] outline-none focus:border-amber-700/60 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c6239] hover:text-red-400 text-xs"
              >✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-8 py-4">

          {/* Column Headers */}
          <div className="grid grid-cols-[48px_1fr_100px_120px_80px] gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5e4126] px-3 py-2 mb-1 border-b border-[#2e1f13]">
            <span>#</span>
            <span>Player</span>
            <span className="text-center">Villages</span>
            <span className="text-center">Total Points</span>
            <span className="text-center">Status</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#5e4126] font-mono text-sm uppercase tracking-widest">
              No players match your search.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filtered.map((entry) => {
                const rank = playerRankings.indexOf(entry) + 1;
                const isBarbarian = entry.owner === 'Barbarian';

                return (
                  <div
                    key={entry.owner}
                    className={`grid grid-cols-[48px_1fr_100px_120px_80px] gap-2 items-center px-3 py-3 rounded transition-colors
                      ${entry.isYou
                        ? 'bg-amber-900/20 border border-amber-700/30 shadow-[0_0_15px_rgba(255,183,0,0.05)]'
                        : isBarbarian
                          ? 'bg-black/10 border border-transparent'
                          : 'bg-black/20 border border-transparent hover:bg-black/40 hover:border-[#2e1f13]'
                      }`}
                  >
                    {/* Rank */}
                    <span className={`font-bold font-mono text-sm text-center
                      ${rank === 1 ? 'text-[#ffd700]' : rank === 2 ? 'text-[#c0c0c0]' : rank === 3 ? 'text-[#cd7f32]' : 'text-[#5e4126]'}`}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </span>

                    {/* Player name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">
                        {entry.isYou ? '🏰' : isBarbarian ? '⚔️' : '🧑‍🌾'}
                      </span>
                      <span className={`font-bold truncate text-sm
                        ${entry.isYou ? 'text-amber-400' : isBarbarian ? 'text-[#8c6239]' : 'text-gray-300'}`}>
                        {entry.owner}
                      </span>
                    </div>

                    {/* Village count */}
                    <div className="text-center">
                      <span className={`font-mono text-sm font-bold ${entry.isYou ? 'text-amber-400' : 'text-gray-500'}`}>
                        {entry.villageCount.toLocaleString()}
                      </span>
                    </div>

                    {/* Total Points */}
                    <div className="text-center">
                      <span className={`font-bold font-mono text-sm ${entry.isYou ? 'text-amber-400' : 'text-gray-400'}`}>
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="flex justify-center">
                      {entry.isYou && (
                        <span className="text-[8px] bg-amber-900/50 border border-amber-700/40 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          You
                        </span>
                      )}
                      {isBarbarian && (
                        <span className="text-[8px] bg-red-900/30 border border-red-900/30 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          NPC
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
