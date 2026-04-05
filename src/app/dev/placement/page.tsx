"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Buildings } from '@/context/GameContext';
import { BUILDING_META } from '@/utils/shared';
import Link from 'next/link';

const BUILDING_ORDER: (keyof Buildings)[] = [
  'headquarters', 'barracks', 'stable', 'castle', 'palace', 'cityWall',
  'timberCamp', 'ironMine', 'clayPit', 'warehouse',
  'farm', 'granary', 'huntersLodge', 'fishery', 'residence',
];

export default function PlacementTool() {
  const [positions, setPositions] = useState<Record<string, { x: string; y: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDone || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const yPct = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const building = BUILDING_ORDER[currentIndex];

    const newPositions = { ...positions, [building]: { x: `${xPct}%`, y: `${yPct}%` } };
    setPositions(newPositions);

    if (currentIndex < BUILDING_ORDER.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsDone(true);
      console.log('=== BUILDING POSITIONS — Copy this into page.tsx ===');
      console.log(JSON.stringify(newPositions, null, 2));
    }
  }, [currentIndex, positions, isDone]);

  const handleUndo = () => {
    if (currentIndex === 0 && !isDone) return;
    if (isDone) {
      setIsDone(false);
      const last = BUILDING_ORDER[BUILDING_ORDER.length - 1];
      const { [last]: _, ...rest } = positions;
      setPositions(rest);
      setCurrentIndex(BUILDING_ORDER.length - 1);
    } else {
      const prev = BUILDING_ORDER[currentIndex - 1];
      const { [prev]: _, ...rest } = positions;
      setPositions(rest);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    setPositions({});
    setCurrentIndex(0);
    setIsDone(false);
  };

  const currentBuilding = !isDone ? BUILDING_ORDER[currentIndex] : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="shrink-0 px-4 py-2 bg-surface-low border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dev" className="text-[9px] text-gray-400 hover:text-primary font-bold uppercase tracking-widest">← Dev Tools</Link>
          <h1 className="text-sm text-primary font-bold medieval-font tracking-widest">Building Placement Tool</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-gray-400 font-mono">{Object.keys(positions).length}/{BUILDING_ORDER.length} placed</span>
          <button onClick={handleUndo} className="text-[9px] text-gray-400 hover:text-white font-bold uppercase tracking-widest px-2 py-1 border border-outline-variant rounded">Undo</button>
          <button onClick={handleReset} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest px-2 py-1 border border-red-500/30 rounded">Reset</button>
        </div>
      </div>

      {/* Instruction bar */}
      <div className="shrink-0 px-4 py-2 bg-surface-base border-b border-outline-variant text-center">
        {isDone ? (
          <div>
            <span className="text-green-400 text-xs font-bold">✓ All buildings placed! Check browser console (F12) for JSON.</span>
          </div>
        ) : currentBuilding ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-gray-400 text-[10px]">Click to place:</span>
            <span className="text-lg">{BUILDING_META[currentBuilding].icon}</span>
            <span className="text-primary font-bold text-sm">{BUILDING_META[currentBuilding].name}</span>
            <span className="text-gray-500 text-[9px]">({currentIndex + 1}/{BUILDING_ORDER.length})</span>
          </div>
        ) : null}
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 min-h-0 relative overflow-hidden cursor-crosshair" onClick={handleClick}>
        <Image
          src="/images/village_map.png"
          alt="Village Map"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
        />

        {/* Placed markers */}
        {BUILDING_ORDER.map((id, idx) => {
          const pos = positions[id];
          if (!pos) return null;
          const isCurrent = !isDone && idx === currentIndex - 1;
          return (
            <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center" style={{ left: pos.x, top: pos.y }}>
              <div className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${isCurrent ? 'bg-yellow-400' : 'bg-green-500'}`} />
              <span className="text-[8px] text-white bg-black/80 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap font-bold shadow-lg">
                {BUILDING_META[id].icon} {BUILDING_META[id].name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Output panel */}
      {isDone && (
        <div className="shrink-0 px-4 py-3 bg-surface-low border-t border-outline-variant">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Output (also in console)</span>
            <button
              onClick={() => { navigator.clipboard.writeText(JSON.stringify(positions, null, 2)); }}
              className="text-[9px] text-primary font-bold uppercase tracking-widest px-2 py-1 border border-primary/30 rounded hover:bg-primary/10"
            >
              📋 Copy JSON
            </button>
          </div>
          <pre className="text-[9px] text-gray-300 font-mono bg-black/40 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar">
            {JSON.stringify(positions, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
