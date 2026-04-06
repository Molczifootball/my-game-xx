"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGame, Buildings, getProductionRate, UNIT_ATLAS, Units, BUILDING_REQUIREMENTS, getMaxPopulation, getCurrentPopulation } from '@/context/GameContext';
import { BUILDING_META, formatTime } from '@/utils/shared';

const BUILDING_ORDER: (keyof Buildings)[] = ['headquarters', 'barracks', 'stable', 'castle', 'palace', 'cityWall', 'timberCamp', 'ironMine', 'clayPit', 'warehouse', 'farm', 'granary', 'huntersLodge', 'fishery', 'residence'];

export default function Home() {
  const { state, activeVillage, upgradeBuilding, recruitUnit, MAX_LEVELS } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState<keyof Buildings | null>(null);
  const [, setForceRender] = useState(0);
  const [recruitCounts, setRecruitCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 100);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return (
    <div className="flex-1 flex items-center justify-center bg-[#0d0a06] text-amber-900 font-bold uppercase tracking-widest animate-pulse">
      Loading Village Data...
    </div>
  );

  const rawB = activeVillage.buildings!;
  const vBuildings: Buildings = {
    headquarters: rawB.headquarters ?? 0, timberCamp: rawB.timberCamp ?? 0, clayPit: rawB.clayPit ?? 0,
    ironMine: rawB.ironMine ?? 0, warehouse: rawB.warehouse ?? 0, granary: rawB.granary ?? 0,
    cityWall: rawB.cityWall ?? 0, barracks: rawB.barracks ?? 0, stable: rawB.stable ?? 0,
    castle: rawB.castle ?? 0, palace: rawB.palace ?? 0, farm: rawB.farm ?? 0,
    huntersLodge: rawB.huntersLodge ?? 0, fishery: rawB.fishery ?? 0, residence: rawB.residence ?? 0,
  };
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
          
          <div className="h-32 w-full bg-[#111] relative border-b border-[#333] shrink-0">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-black"></div>
            <Image src={meta.image} alt={meta.name} fill sizes="600px" quality={100} className="object-cover opacity-90 mix-blend-screen" priority />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#1a1a1b] to-transparent h-16"></div>
            <h2 className="absolute bottom-3 left-5 text-xl font-bold text-white medieval-font drop-shadow-md">{meta.name}</h2>
          </div>

          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            <p className="text-gray-400 text-xs mb-3 leading-relaxed bg-[#111] p-2 rounded">{meta.desc}</p>

            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-on-surface-variant font-bold medieval-font tracking-widest text-[#ffc63e] text-sm">Level {level}</span>
                {queuedForBuilding > 0 && <span className="text-emerald-500 ml-2 animate-pulse text-[9px] font-bold uppercase tracking-widest">+{queuedForBuilding}</span>}
              </div>
              <div className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-wider">Max {maxLevel}</div>
            </div>

            <div className="bg-[#242426] p-3 rounded-lg border border-[#333]">
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
                      {selectedBuilding === 'farm' && (
                        `Grain: ${Math.floor(level === 0 ? 0 : 50 * Math.pow(1.15, level - 1))}/h ➔ ${Math.floor(50 * Math.pow(1.15, targetLevel - 1))}/h`
                      )}
                      {selectedBuilding === 'huntersLodge' && (
                        `Meat: ${Math.floor(level === 0 ? 0 : 30 * Math.pow(1.15, level - 1))}/h ➔ ${Math.floor(30 * Math.pow(1.15, targetLevel - 1))}/h`
                      )}
                      {selectedBuilding === 'fishery' && (
                        `Fish: ${Math.floor(level === 0 ? 0 : 40 * Math.pow(1.15, level - 1))}/h ➔ ${Math.floor(40 * Math.pow(1.15, targetLevel - 1))}/h`
                      )}
                      {selectedBuilding === 'granary' && (
                        `Food Storage: ${(level === 0 ? 500 : Math.floor(3000 * Math.pow(1.3, level - 1))).toLocaleString()} ➔ ${Math.floor(3000 * Math.pow(1.3, targetLevel - 1)).toLocaleString()}`
                      )}
                      {selectedBuilding === 'residence' && (
                        `Max Pop: ${(level === 0 ? 10 : Math.floor(20 * Math.pow(1.25, level - 1))).toLocaleString()} ➔ ${Math.floor(20 * Math.pow(1.25, targetLevel - 1)).toLocaleString()}`
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mb-3 font-mono text-xs font-bold border-y border-outline-variant py-2 bg-surface-dim">
                    <span className={currentWood >= costWood ? 'text-wood' : 'text-red-500'}>🪵 {costWood}</span>
                    <span className={currentClay >= costClay ? 'text-clay' : 'text-red-500'}>🧱 {costClay}</span>
                    <span className={currentIron >= costIron ? 'text-iron' : 'text-red-500'}>⛏️ {costIron}</span>
                  </div>
                  <button
                    disabled={queueFull || !canAfford}
                    onClick={() => { upgradeBuilding(selectedBuilding); setSelectedBuilding(null); }}
                    className={`w-full py-2.5 gold-button rounded transition-all active:scale-95 text-sm
                      ${(queueFull || !canAfford) ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                  >
                    {queueFull ? "Queue At Capacity" : !canAfford ? "Insufficient Tributes" : "Expand Infrastructure"}
                  </button>
                </>
              )}
            </div>

            {['barracks','stable','castle','palace'].includes(selectedBuilding) && level > 0 && (() => {
              const currentPop = getCurrentPopulation(vUnits, activeVillage.recruitment);
              const maxPop = getMaxPopulation(vBuildings.residence || 0);
              return (
              <div className="mt-4 bg-[#242426] p-4 rounded-lg border border-[#333]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-gray-300 text-sm font-bold uppercase tracking-widest">Train Military</h3>
                  <span className={`text-[10px] font-mono font-bold ${currentPop >= maxPop ? 'text-red-400' : 'text-gray-500'}`}>
                    👥 {currentPop}/{maxPop} pop
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(UNIT_ATLAS)
                    .filter(([, data]) => data.reqB === selectedBuilding)
                    .map(([unitKey, data]) => {
                       const canRecruit = level >= data.reqLvl;
                       const popLeft = maxPop - currentPop;
                       const maxByPop = Math.floor(popLeft / data.pop);
                       const count = recruitCounts[unitKey] || 1;
                       return (
                        <div key={unitKey} className={`bg-[#1e1e1e] border border-[#555] rounded px-3 py-2 ${!canRecruit ? 'opacity-30' : ''}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-300 font-bold text-sm">
                              {data.name}
                              {!canRecruit && <span className="text-red-500 text-[10px] uppercase ml-2">(Req Lv.{data.reqLvl})</span>}
                            </span>
                            <span className="text-[9px] text-gray-600 font-mono">
                              {data.pop} pop | {data.grain > 0 ? `🌾${data.grain}` : data.fish > 0 ? `🐟${data.fish}` : `🥩${data.meat}`}/h
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mb-2">
                            <span className="text-wood">🪵{data.w * count}</span>
                            <span className="text-clay">🧱{data.c * count}</span>
                            <span className="text-iron">⛏️{data.i * count}</span>
                            <span className="text-gray-600 ml-auto">⏱️{formatTime(data.time * count)}</span>
                          </div>
                          {canRecruit && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number" min={1} max={Math.max(1, maxByPop)}
                                value={count}
                                onChange={e => setRecruitCounts({ ...recruitCounts, [unitKey]: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-16 bg-black/50 border border-outline-variant rounded text-white px-2 py-1 text-[10px] outline-none focus:border-primary/50 font-mono text-center"
                              />
                              <button
                                onClick={() => { recruitUnit(unitKey as keyof Units, count); setRecruitCounts({ ...recruitCounts, [unitKey]: 1 }); }}
                                disabled={maxByPop <= 0}
                                className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Train {count > 1 ? `×${count}` : ''}
                              </button>
                            </div>
                          )}
                        </div>
                       );
                    })
                  }
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const isBuildingQueued = (id: keyof Buildings) => vUpgrades.some(u => u.building === id);
  const isBuildingLocked = (id: keyof Buildings) => BUILDING_REQUIREMENTS[id].some(r => (vBuildings[r.requires] || 0) < r.level);

  const BUILDING_POSITIONS: Record<keyof Buildings, { x: string; y: string }> = {
    headquarters: { x: '49.5%', y: '41.7%' },
    barracks:     { x: '43.6%', y: '61.4%' },
    stable:       { x: '57.4%', y: '62.7%' },
    castle:       { x: '58.0%', y: '40.2%' },
    palace:       { x: '55.9%', y: '18.2%' },
    cityWall:     { x: '49.7%', y: '87.4%' },
    timberCamp:   { x: '34.2%', y: '4.7%' },
    ironMine:     { x: '67.0%', y: '12.1%' },
    clayPit:      { x: '32.6%', y: '96.3%' },
    warehouse:    { x: '49.1%', y: '98.4%' },
    farm:         { x: '14.8%', y: '79.5%' },
    granary:      { x: '42.1%', y: '41.5%' },
    huntersLodge: { x: '12.9%', y: '5.7%' },
    fishery:      { x: '65.8%', y: '88.7%' },
    residence:    { x: '46.1%', y: '25.6%' },
  };

  return (
    <>
      {renderBuildingModal()}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-[#0d0a06]">

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
        <div className="absolute inset-0">
          {BUILDING_ORDER.map(id => {
            const pos = BUILDING_POSITIONS[id];
            return (
              <MapNode key={id} id={id} x={pos.x} y={pos.y} activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued(id)} isLocked={isBuildingLocked(id)} onClick={() => setSelectedBuilding(id)} />
            );
          })}
        </div>
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
