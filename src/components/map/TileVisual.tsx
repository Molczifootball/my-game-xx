"use client";

import { MapTile } from '@/context/GameContext';

interface TileVisualProps {
  tile: MapTile;
  visualMode: string;
  playerName: string;
  tileSize: number;
}

// Terrain color palettes - varied by coordinate hash for visual richness
const GRASS_COLORS = ['#2d5a1e', '#336b22', '#2a5219', '#3a7228'];
const FOREST_COLORS = ['#1a3a12', '#1f4215', '#173510', '#224a18'];
const MOUNTAIN_COLORS = ['#5a5545', '#63604e', '#4e4a3c', '#6b6555'];
const WATER_COLORS = ['#1a3a6a', '#1e4272', '#163362', '#224a7a'];

function hashColor(x: number, y: number, palette: string[]): string {
  return palette[(x * 7 + y * 13) % palette.length];
}

export default function TileVisual({ tile, visualMode, playerName, tileSize }: TileVisualProps) {
  // --- GRASS ---
  if (tile.type === 'grass') {
    return <div className="absolute inset-0" style={{ background: '#2d5a1e' }} />;
  }

  // --- FOREST ---
  if (tile.type === 'forest') {
    const bg = hashColor(tile.x, tile.y, FOREST_COLORS);
    const treeCount = (tile.x * 3 + tile.y * 7) % 3 + 2; // 2-4 trees
    return (
      <div className="absolute inset-0 forest-tile" style={{ background: bg }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-60 select-none" style={{ fontSize: `${Math.max(8, tileSize * 0.25)}px` }}>
          {'🌲'.repeat(treeCount)}
        </div>
      </div>
    );
  }

  // --- MOUNTAIN ---
  if (tile.type === 'mountain') {
    const bg = hashColor(tile.x, tile.y, MOUNTAIN_COLORS);
    return (
      <div className="absolute inset-0" style={{ background: bg }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-50 select-none" style={{ fontSize: `${Math.max(10, tileSize * 0.35)}px` }}>
          ⛰️
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 50%)' }} />
      </div>
    );
  }

  // --- WATER ---
  if (tile.type === 'water') {
    const bg = hashColor(tile.x, tile.y, WATER_COLORS);
    return (
      <div className="absolute inset-0 water-shimmer" style={{ background: bg }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(100,180,255,0.1) 0%, transparent 50%, rgba(60,140,220,0.08) 100%)'
        }} />
      </div>
    );
  }

  // --- VILLAGE / PLAYER TILES ---
  if (tile.type === 'village' || tile.type === 'player') {
    const pts = tile.points || 0;
    const isSelf = tile.owner === playerName;
    const isBarbarian = tile.owner === 'Barbarian';
    const isScouted = !!tile.scoutedAt;
    const isStaleIntel = tile.scoutedAt ? (Date.now() - tile.scoutedAt > 300000) : false;

    // Village icon based on points
    let icon = '⛺';
    if (pts > 200) icon = '🏠';
    if (pts > 500) icon = '🏯';
    if (pts > 1500) icon = '🏰';

    // Emoji size scales with points
    const emojiSize = Math.min(tileSize * 0.55, tileSize * 0.35 + Math.log2(pts + 1) * 1.2);

    // Strength bar width (0-100%)
    const strengthPct = Math.min(100, (pts / 1500) * 100);

    // Green grass base under village
    const grassBg = hashColor(tile.x, tile.y, GRASS_COLORS);

    return (
      <div className={`absolute inset-0 flex items-center justify-center select-none ${visualMode === 'tactical' ? 'rotate-z-[45deg] rotate-x-[-45deg] scale-[1.2]' : ''}`}>
        {/* Grass background under village */}
        <div className="absolute inset-0" style={{ background: grassBg }} />

        {/* Player village: blue glow */}
        {isSelf && (
          <div className="absolute inset-0 bg-blue-500/25 ring-1 ring-blue-400/50 village-pulse z-[1]" />
        )}

        {/* Barbarian village: red tint */}
        {isBarbarian && !isSelf && (
          <div className={`absolute inset-0 bg-red-900/25 ring-1 ring-red-500/30 z-[1] ${isStaleIntel ? 'opacity-50' : ''}`} />
        )}

        {/* Village icon */}
        <span
          className={`z-[2] drop-shadow-md group-hover:scale-125 transition-transform
            ${visualMode === 'tactical' ? 'brightness-125 saturate-150' : ''}
            ${isSelf ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' : ''}
          `}
          style={{ fontSize: `${emojiSize}px` }}
        >
          {icon}
        </span>

        {/* Unscouted badge */}
        {isBarbarian && !isScouted && (
          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-gray-800/90 rounded-full flex items-center justify-center z-[3] ring-1 ring-gray-600/50">
            <span className="text-[7px] text-gray-400 font-bold">?</span>
          </div>
        )}

        {/* Strength bar for scouted villages */}
        {(isBarbarian || (!isSelf && tile.owner)) && isScouted && (
          <div className="absolute bottom-0.5 left-0.5 right-0.5 h-[3px] bg-black/60 rounded-full z-[3] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${strengthPct}%`,
                background: strengthPct > 60 ? '#ef4444' : strengthPct > 30 ? '#f59e0b' : '#22c55e',
              }}
            />
          </div>
        )}

        {/* Points badge */}
        {pts > 0 && tileSize >= 40 && (
          <div className="absolute bottom-0 right-0 bg-black/70 px-0.5 rounded-tl z-[3]">
            <span className="text-[7px] text-gray-400 font-mono leading-none">{pts > 999 ? `${(pts / 1000).toFixed(1)}k` : pts}</span>
          </div>
        )}

        {/* Tactical mode shadow */}
        {visualMode === 'tactical' && (
          <div className="absolute -bottom-1 w-2/3 h-1 bg-black/40 blur-[2px] rounded-full z-0" />
        )}
      </div>
    );
  }

  return null;
}
