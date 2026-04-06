"use client";

import React from 'react';
import { MapTile } from '@/context/GameContext';

interface TileVisualProps {
  tile: MapTile;
  visualMode: string;
  playerName: string;
  tileSize: number;
}

// Single consistent grass color — matches the background baked into generated village/forest PNGs
const GRASS_BASE = '#2b521b';

// Terrain color palettes
const WATER_COLORS = ['#1a3a6a', '#1e4272', '#163362', '#224a7a'];

function hashColor(x: number, y: number, palette: string[]): string {
  return palette[(x * 7 + y * 13) % palette.length];
}

function TileVisualInner({ tile, visualMode, playerName, tileSize }: TileVisualProps) {
  // --- GRASS ---
  if (tile.type === 'grass') {
    return <div className="absolute inset-0" style={{ background: GRASS_BASE }} />;
  }

  // --- FOREST ---
  if (tile.type === 'forest') {
    return (
      <div className="absolute inset-0" style={{ background: GRASS_BASE }}>
        <img
          src="/images/map/forest.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  // --- MOUNTAIN ---
  if (tile.type === 'mountain') {
    const variation = (tile.x * 7 + tile.y * 13) % 4;
    const rockColors = ['#5a5545', '#63604e', '#4e4a3c', '#6b6555'];
    return (
      <div className="absolute inset-0" style={{ background: GRASS_BASE }}>
        <div className="absolute inset-[15%] rounded-[30%]" style={{
          background: `radial-gradient(ellipse at ${40 + variation * 5}% ${35 + variation * 5}%, ${rockColors[variation]} 0%, #4a4535 60%, ${GRASS_BASE} 100%)`,
        }} />
        <div className="absolute inset-[25%] rounded-[25%] opacity-60" style={{
          background: `radial-gradient(ellipse at 55% 40%, #7a7565 0%, transparent 65%)`,
        }} />
      </div>
    );
  }

  // --- WATER ---
  if (tile.type === 'water') {
    return (
      <div className="absolute inset-0 water-shimmer" style={{ background: '#1a3a6a' }}>
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

    // Village icon based on points (max possible ~14,100)
    // Citadel = fully built, Stronghold = 50%, Settlement = 30%, Outpost = starter
    const VILLAGE_ICONS: { threshold: number; src: string }[] = [
      { threshold: 12000, src: '/images/map/citadel.png' },    // fully built
      { threshold: 7000,  src: '/images/map/stronghold.png' },  // ~50% built
      { threshold: 4200,  src: '/images/map/settlement.png' },  // ~30% built
      { threshold: 0,     src: '/images/map/outpost.png' },     // starter
    ];
    const tier = VILLAGE_ICONS.find(t => pts >= t.threshold) || VILLAGE_ICONS[VILLAGE_ICONS.length - 1];

    // Icon size scales with points (used for emoji fallback)
    const iconSize = Math.min(tileSize * 0.55, tileSize * 0.35 + Math.log2(pts + 1) * 1.2);

    // Strength bar width (0-100%)
    const strengthPct = Math.min(100, (pts / 1500) * 100);



    return (
      <div className={`absolute inset-0 flex items-center justify-center select-none ${visualMode === 'tactical' ? 'rotate-z-[45deg] rotate-x-[-45deg] scale-[1.2]' : ''}`}>
        {/* Grass background under village */}
        <div className="absolute inset-0" style={{ background: GRASS_BASE }} />

        {/* Player village: blue glow */}
        {isSelf && (
          <div className="absolute inset-0 bg-blue-500/25 ring-1 ring-blue-400/50 village-pulse z-[1]" />
        )}

        {/* Barbarian village: red tint */}
        {isBarbarian && !isSelf && (
          <div className={`absolute inset-0 bg-red-900/25 ring-1 ring-red-500/30 z-[1] ${isStaleIntel ? 'opacity-50' : ''}`} />
        )}

        {/* Village icon — full-tile image */}
        <img
          src={tier.src}
          alt="village"
          className={`absolute inset-0 w-full h-full object-cover z-[2] pointer-events-none
            ${visualMode === 'tactical' ? 'brightness-125 saturate-150' : ''}
            ${isSelf ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' : ''}
          `}
          loading="eager"
          decoding="async"
        />



        {/* Tactical mode shadow */}
        {visualMode === 'tactical' && (
          <div className="absolute -bottom-1 w-2/3 h-1 bg-black/40 blur-[2px] rounded-full z-0" />
        )}
      </div>
    );
  }

  return null;
}

// Memoize to prevent re-renders of 2500 tiles every game tick
const TileVisual = React.memo(TileVisualInner, (prev, next) => {
  return (
    prev.tile.id === next.tile.id &&
    prev.tile.type === next.tile.type &&
    prev.tile.points === next.tile.points &&
    prev.tile.owner === next.tile.owner &&
    prev.visualMode === next.visualMode &&
    prev.tileSize === next.tileSize &&
    prev.playerName === next.playerName
  );
});

export default TileVisual;
