"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useGame, Buildings, getProductionRate, UNIT_ATLAS, Units, BUILDING_REQUIREMENTS } from '@/context/GameContext';
import { BUILDING_META, formatTime } from '@/utils/shared';

const BUILDING_ORDER: (keyof Buildings)[] = ['headquarters', 'barracks', 'stable', 'castle', 'palace', 'cityWall', 'timberCamp', 'ironMine', 'clayPit', 'warehouse', 'farm'];

export default function Home() {
  const { state, activeVillage, upgradeBuilding, recruitUnit, MAX_LEVELS } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState<keyof Buildings | null>(null);
  const [, setForceRender] = useState(0);

  // Placement tool state
  const [placementMode, setPlacementMode] = useState(false);
  const [placementIndex, setPlacementIndex] = useState(0);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: string; y: string }>>({});
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 100);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return (
    <div className="flex-1 flex items-center justify-center bg-[#0d0a06] text-amber-900 font-bold uppercase tracking-widest animate-pulse">
      Loading Village Data...
    </div>
  );

  const vBuildings = activeVillage.buildings!;
  const vResources = activeVillage.resources!;
  const vUnits = activeVillage.units!;
  const vUpgrades = activeVillage.upgrades || [];

  const capacity = Math.floor(5000 * Math.pow(1.3, vBuildings.warehouse - 1));
  const rateWood = getProductionRate(vBuildings.timberCamp);
  const rateClay = getProductionRate(vBuildings.clayPit);
  const rateIron = getProductionRate(vBuildings.ironMine);

  const deltaSecs = Math.max(0, Date.now() - state.lastTick) / 1000;
  const currentWood = Math.min(capacity, vResources.wood + (rateWood / 3600) * deltaSecs);
  const currentClay = Math.min(capacity, vResources.clay + (rateClay / 3600) * deltaSecs);
  const currentIron = Math.min(capacity, vResources.iron + (rateIron / 3600) * deltaSecs);

  const renderBuildingModal = () => {
    if (!selectedBuilding) return null;
    const meta = BUILDING_META[selectedBuilding];
    const level = vBuildings[selectedBuilding];
    const maxLevel = MAX_LEVELS[selectedBuilding];
    
    const queuedForBuilding = vUpgrades.filter(u => u.building === selectedBuilding).length;
    const targetLevel = level + queuedForBuilding + 1;
    const isSpecial = ['castle','barracks','cityWall','palace','stable'].includes(selectedBuilding);
    const costMultiplier = Math.pow(1.2, targetLevel - 1);
    
    const costWood = Math.floor((isSpecial ? 200 : 100) * costMultiplier);
    const costClay = Math.floor((isSpecial ? 200 : 100) * costMultiplier);
    const costIron = Math.floor((isSpecial ? 200 : 100) * costMultiplier);
    const timeSecs = Math.floor((isSpecial ? 20 : 10) * Math.pow(1.15, targetLevel - 1));

    const reqs = BUILDING_REQUIREMENTS[selectedBuilding];
    const unmetReqs = reqs.filter(r => (vBuildings[r.requires] || 0) < r.level);
    const reqsMet = unmetReqs.length === 0;

    const canAfford = currentWood >= costWood && currentClay >= costClay && currentIron >= costIron;
    const queueFull = vUpgrades.length >= 3;
    const isMax = targetLevel > maxLevel;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="sovereign-panel border-outline-variant shadow-2xl max-w-lg w-full flex flex-col overflow-hidden relative max-h-[90vh]">
          <button onClick={() => setSelectedBuilding(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full text-gray-300 hover:text-white hover:bg-red-500/80 transition-colors z-20">✕</button>
          
          <div className="h-48 w-full bg-[#111] relative border-b border-[#333] shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-black"></div>
            <Image src={meta.image} alt={meta.name} fill sizes="600px" quality={100} className="object-cover opacity-90 mix-blend-screen" priority />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#1a1a1b] to-transparent h-24"></div>
            <h2 className="absolute bottom-4 left-6 text-3xl font-bold text-white medieval-font drop-shadow-md">{meta.name}</h2>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <p className="text-gray-400 text-sm mb-6 leading-relaxed bg-[#111] p-3 rounded">{meta.desc}</p>
            
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl">
                <span className="text-on-surface-variant font-bold medieval-font tracking-widest text-[#ffc63e]">Level {level}</span>
                {queuedForBuilding > 0 && <span className="text-emerald-500 ml-2 animate-pulse text-xs font-bold uppercase tracking-widest">+{queuedForBuilding} in construction</span>}
              </div>
              <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em]">Max Mastery {maxLevel}</div>
            </div>

            <div className="bg-[#242426] p-4 rounded-lg border border-[#333]">
              {/* Building requirements */}
              {reqs.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Requirements</span>
                  <div className="flex flex-col gap-1">
                    {reqs.map(r => {
                      const met = (vBuildings[r.requires] || 0) >= r.level;
                      return (
                        <div key={`${r.requires}-${r.level}`} className="flex items-center gap-2 text-[11px]">
                          <span className={met ? 'text-green-400' : 'text-red-400'}>{met ? '✓' : '✗'}</span>
                          <span className={met ? 'text-gray-400' : 'text-red-400'}>{BUILDING_META[r.requires].name} Lv.{r.level}</span>
                          {!met && <span className="text-[9px] text-gray-600 font-mono">(current: {vBuildings[r.requires] || 0})</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!reqsMet ? (
                <div className="text-red-400/70 font-bold text-center py-3 text-xs uppercase tracking-widest border border-red-500/20 rounded bg-red-500/5">
                  Requirements Not Met
                </div>
              ) : isMax ? (
                <div className="text-amber-500 font-bold text-center py-2">Maximum Level Reached</div>
              ) : (
                <>
                  <div className="flex flex-col gap-1 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-amber-500 font-bold">Upgrade to Level {targetLevel}:</span>
                      <span className="text-sm font-mono text-gray-400">⏱️ {formatTime(timeSecs)}</span>
                    </div>
                    <div className="text-gray-400 text-xs italic">
                      {(selectedBuilding === 'timberCamp' || selectedBuilding === 'clayPit' || selectedBuilding === 'ironMine') && (
                        `Production: ${Math.floor(getProductionRate(level))}/h ➔ ${Math.floor(getProductionRate(targetLevel))}/h`
                      )}
                      {selectedBuilding === 'warehouse' && (
                        `Capacity: ${Math.floor(5000 * Math.pow(1.3, level === 0 ? 0 : level - 1)).toLocaleString()} ➔ ${Math.floor(5000 * Math.pow(1.3, targetLevel - 1)).toLocaleString()}`
                      )}
                      {(selectedBuilding === 'barracks' || selectedBuilding === 'headquarters') && (
                        `Speed Bonus: ${(Math.pow(1.15, level === 0 ? 0 : level - 1)).toFixed(2)}x ➔ ${(Math.pow(1.15, targetLevel - 1)).toFixed(2)}x`
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mb-6 font-mono text-xs font-bold border-y border-outline-variant py-4 bg-surface-dim">
                    <span className={currentWood >= costWood ? 'text-wood' : 'text-red-500'}>🪵 {costWood}</span>
                    <span className={currentClay >= costClay ? 'text-clay' : 'text-red-500'}>🧱 {costClay}</span>
                    <span className={currentIron >= costIron ? 'text-iron' : 'text-red-500'}>⛏️ {costIron}</span>
                  </div>
                  <button
                    disabled={queueFull || !canAfford}
                    onClick={() => { upgradeBuilding(selectedBuilding); setSelectedBuilding(null); }}
                    className={`w-full py-4 gold-button rounded transition-all active:scale-95
                      ${(queueFull || !canAfford) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                  >
                    {queueFull ? "Queue At Capacity" : !canAfford ? "Insufficient Tributes" : "Expand Infrastructure"}
                  </button>
                </>
              )}
            </div>

            {['barracks','stable','castle','palace'].includes(selectedBuilding) && level > 0 && (
              <div className="mt-4 bg-[#242426] p-4 rounded-lg border border-[#333]">
                <h3 className="text-gray-300 mb-3 text-sm font-bold uppercase tracking-widest">Train Military</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(UNIT_ATLAS)
                    .filter(([, data]) => data.reqB === selectedBuilding)
                    .map(([unitKey, data]) => {
                       const canRecruit = level >= data.reqLvl;
                       return (
                        <button key={unitKey} onClick={() => recruitUnit(unitKey as keyof Units)} disabled={!canRecruit} className="bg-[#1e1e1e] border border-[#555] hover:border-amber-500 disabled:opacity-30 disabled:hover:border-[#555] text-xs py-3 rounded text-left px-3 flex flex-col sm:flex-row justify-between sm:items-center group">
                          <span className="text-gray-300 font-bold group-hover:text-amber-400 text-sm mb-2 sm:mb-0">
                            {data.name} {!canRecruit && <span className="text-red-500 text-[10px] uppercase ml-2">(Requires Lv.{data.reqLvl})</span>}
                          </span>
                          <span className="bg-gray-800 text-gray-400 font-mono px-2 py-1 flex items-center gap-2 rounded text-[10px]">
                            <span className="text-[#a1662f]">{data.w}</span>|
                            <span className="text-[#c55331]">{data.c}</span>|
                            <span className="text-[#9ca3af]">{data.i}</span>
                            <span className="ml-2 text-gray-500 text-right">⏱️{formatTime(data.time)}</span>
                          </span>
                        </button>
                       );
                    })
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isBuildingQueued = (id: keyof Buildings) => vUpgrades.some(u => u.building === id);
  const isBuildingLocked = (id: keyof Buildings) => BUILDING_REQUIREMENTS[id].some(r => (vBuildings[r.requires] || 0) < r.level);

  // Building positions — default or custom from placement tool
  const DEFAULT_POSITIONS: Record<keyof Buildings, { x: string; y: string }> = {
    headquarters: { x: '49.9%', y: '44.2%' },
    barracks:     { x: '42.1%', y: '59.2%' },
    stable:       { x: '58.6%', y: '59.2%' },
    castle:       { x: '59.5%', y: '43.6%' },
    palace:       { x: '57.2%', y: '29.1%' },
    cityWall:     { x: '50.1%', y: '74.0%' },
    timberCamp:   { x: '32.4%', y: '18.6%' },
    ironMine:     { x: '72.4%', y: '19.4%' },
    clayPit:      { x: '29.2%', y: '82.0%' },
    warehouse:    { x: '49.8%', y: '87.2%' },
    farm:         { x: '38.0%', y: '75.0%' },
  };

  const BUILDING_POSITIONS = { ...DEFAULT_POSITIONS, ...customPositions } as Record<keyof Buildings, { x: string; y: string }>;

  // Placement tool click handler
  const handlePlacementClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const yPct = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const building = BUILDING_ORDER[placementIndex];

    setCustomPositions(prev => ({ ...prev, [building]: { x: `${xPct}%`, y: `${yPct}%` } }));

    if (placementIndex < BUILDING_ORDER.length - 1) {
      setPlacementIndex(prev => prev + 1);
    } else {
      // Done — log all positions for copy-paste
      const allPos = { ...DEFAULT_POSITIONS, ...customPositions, [building]: { x: `${xPct}%`, y: `${yPct}%` } };
      console.log('=== BUILDING POSITIONS — Copy this into your code ===');
      console.log(JSON.stringify(allPos, null, 2));
      setPlacementMode(false);
    }
  }, [placementMode, placementIndex, customPositions]);

  return (
    <>
      {renderBuildingModal()}
      <div ref={mapRef} className="flex-1 min-h-0 w-full relative overflow-hidden bg-[#0d0a06]" onClick={placementMode ? handlePlacementClick : undefined}>

        {/* Village Map Background */}
        <Image
          src="/images/village_map.png"
          alt="Village Map"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover"
        />

        {/* Building nodes overlay */}
        {!placementMode && (
          <div className="absolute inset-0">
            {BUILDING_ORDER.map(id => {
              const pos = BUILDING_POSITIONS[id];
              return (
                <MapNode key={id} id={id} x={pos.x} y={pos.y} activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued(id)} isLocked={isBuildingLocked(id)} onClick={() => setSelectedBuilding(id)} />
              );
            })}
          </div>
        )}

        {/* Placement mode: show already-placed markers */}
        {placementMode && (
          <div className="absolute inset-0">
            {BUILDING_ORDER.slice(0, placementIndex).map(id => {
              const pos = customPositions[id] || DEFAULT_POSITIONS[id];
              return (
                <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2 z-30" style={{ left: pos.x, top: pos.y }}>
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                  <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[8px] text-green-300 bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap font-bold">
                    {BUILDING_META[id].name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Placement tool UI */}
        {placementMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 rounded-lg border border-primary/30 shadow-2xl text-center">
            <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Click to place building {placementIndex + 1}/{BUILDING_ORDER.length}</div>
            <div className="text-lg text-primary font-bold medieval-font tracking-widest">
              {BUILDING_META[BUILDING_ORDER[placementIndex]].icon} {BUILDING_META[BUILDING_ORDER[placementIndex]].name}
            </div>
            <button onClick={(e) => { e.stopPropagation(); setPlacementMode(false); }} className="mt-2 text-[9px] text-gray-500 hover:text-red-400 uppercase tracking-widest">Cancel</button>
          </div>
        )}

        {/* Placement mode toggle button */}
        {!placementMode && (
          <button
            onClick={() => { setPlacementMode(true); setPlacementIndex(0); setCustomPositions({}); }}
            className="absolute bottom-4 left-4 z-40 text-[9px] bg-purple-900/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded font-bold uppercase tracking-widest transition-all"
          >
            🎯 Place Buildings
          </button>
        )}

        {/* Crosshair cursor in placement mode */}
        {placementMode && (
          <style>{`div[class*="flex-1 min-h-0 w-full"] { cursor: crosshair !important; }`}</style>
        )}
      </div>
    </>
  );
}

// Sub-component for buildings on the map
function MapNode({ id, x, y, activeVillage, MAX_LEVELS, isQueued, isLocked, onClick }: any) {
  const meta = BUILDING_META[id as keyof Buildings];
  const level = activeVillage.buildings[id];
  const maxLevel = MAX_LEVELS[id];
  const isZero = level === 0;

  return (
    <div
      className={`absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 group z-20 hover:z-30 ${isLocked && isZero ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      {/* Pulsing ring indicator for active buildings */}
      {!isZero && !isLocked && (
        <div className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 pointer-events-none
          ${level >= maxLevel ? 'border-primary/60 shadow-[0_0_12px_rgba(255,198,62,0.3)]' : 'border-white/20 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(255,198,62,0.2)]'}
          ${isQueued ? 'border-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.3)] animate-pulse' : ''}
        `} />
      )}

      {/* Locked overlay dot */}
      {isLocked && isZero && (
        <div className="w-8 h-8 rounded-full bg-black/70 border border-red-900/40 flex items-center justify-center mb-0.5">
          <span className="text-xs opacity-50">🔒</span>
        </div>
      )}

      {/* Label */}
      <div className={`px-2 py-0.5 rounded text-center shadow-lg transition-all backdrop-blur-sm
        ${isLocked && isZero
          ? 'bg-black/70 border border-red-900/30'
          : isQueued
            ? 'bg-emerald-900/80 border border-emerald-500/40'
            : 'bg-black/75 border border-white/10 group-hover:border-primary/40 group-hover:bg-black/90'}
      `}>
        <h3 className={`font-bold text-[8px] sm:text-[9px] uppercase tracking-wider whitespace-nowrap
          ${isLocked && isZero ? 'text-red-400/50' : isQueued ? 'text-emerald-300' : 'text-white/90 group-hover:text-primary'}
        `}>{meta.name}</h3>
        {isLocked && isZero ? (
          <div className="text-[7px] text-red-400/40 font-bold">LOCKED</div>
        ) : isZero ? (
          <div className="text-[7px] text-gray-500 font-bold">RUINS</div>
        ) : (
          <div className="text-[8px] font-mono">
            <span className={level >= maxLevel ? 'text-primary font-bold' : 'text-gray-300'}>{level}</span>
            <span className="text-gray-600">/{maxLevel}</span>
          </div>
        )}
      </div>

      {/* Upgrading badge */}
      {isQueued && (
        <div className="absolute -top-2 -right-4 bg-emerald-600 text-white text-[7px] px-1.5 py-0.5 rounded-full border border-emerald-400 shadow-lg animate-bounce font-bold">
          ⚒️
        </div>
      )}
    </div>
  );
}
