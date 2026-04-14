"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { MapTile } from '@/context/GameContext';
import { getMinimapColor } from '@/utils/mapUtils';

interface MinimapProps {
  worldMap: MapTile[];
  playerName: string;
  centerX: number;
  centerY: number;
  viewportW: number;
  viewportH: number;
  onNavigate: (x: number, y: number) => void;
}

const MINIMAP_SIZE = 160;
const WORLD_SIZE = 100;
const TILE_PX = MINIMAP_SIZE / WORLD_SIZE; // 1.6px per tile for 100x100

export default function Minimap({ worldMap, playerName, centerX, centerY, viewportW, viewportH, onNavigate }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Build base terrain image data (memoized - only recalc when map changes)
  const terrainImageData = useMemo(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = MINIMAP_SIZE;
    offscreen.height = MINIMAP_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#111316';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    for (const tile of worldMap) {
      if (tile.x < 1 || tile.x > WORLD_SIZE || tile.y < 1 || tile.y > WORLD_SIZE) continue;
      
      const px = (tile.x - 1) * TILE_PX;
      const py = (tile.y - 1) * TILE_PX;
      ctx.fillStyle = getMinimapColor(tile.type, tile.owner, playerName);
      ctx.fillRect(px, py, Math.ceil(TILE_PX), Math.ceil(TILE_PX));

      // Larger dots for player villages
      if (tile.owner === playerName) {
        ctx.fillStyle = '#3388ff';
        ctx.fillRect(px - 0.5, py - 0.5, Math.ceil(TILE_PX) + 1, Math.ceil(TILE_PX) + 1);
      }
    }

    return offscreen;
  }, [worldMap, playerName]);

  // Draw minimap with viewport rect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !terrainImageData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw cached terrain
    ctx.drawImage(terrainImageData, 0, 0);

    // Draw viewport rectangle
    // Center is the focus tile, so we subtract half the viewport to get the top-left
    const vpX = (centerX - Math.floor(viewportW / 2) - 1) * TILE_PX;
    const vpY = (centerY - Math.floor(viewportH / 2) - 1) * TILE_PX;
    const vpW = viewportW * TILE_PX;
    const vpH = viewportH * TILE_PX;

    ctx.strokeStyle = '#ffc63e';
    ctx.lineWidth = 1;
    ctx.strokeRect(vpX, vpY, vpW, vpH);

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 198, 62, 0.05)';
    ctx.fillRect(vpX, vpY, vpW, vpH);
  }, [terrainImageData, centerX, centerY, viewportW, viewportH]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = MINIMAP_SIZE / rect.width;
    const scaleY = MINIMAP_SIZE / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_PX) + 1;
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_PX) + 1;
    onNavigate(
      Math.max(1, Math.min(WORLD_SIZE, x)),
      Math.max(1, Math.min(WORLD_SIZE, y))
    );
  }, [onNavigate]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 right-4 z-20 glass-panel px-3 py-1.5 rounded text-[9px] text-primary font-bold uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/20"
      >
        🗺️ Map
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 z-20 glass-panel rounded-lg overflow-hidden shadow-2xl border border-primary/15">
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/5">
        <span className="text-[8px] text-primary/70 font-bold uppercase tracking-[0.2em]">Minimap</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-[10px] text-gray-500 hover:text-white transition-colors px-1"
        >
          —
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        onClick={handleClick}
        className="cursor-crosshair block"
        style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
      />
    </div>
  );
}
