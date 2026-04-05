"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGame, Buildings, getProductionRate, UNIT_ATLAS, Units } from '@/context/GameContext';
import { BUILDING_META, formatTime } from '@/utils/shared';

export default function Home() {
  const { state, activeVillage, upgradeBuilding, recruitUnit, MAX_LEVELS } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState<keyof Buildings | null>(null);
  const [, setForceRender] = useState(0);

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
              {isMax ? (
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

  return (
    <>
      {renderBuildingModal()}
      <div className="flex-1 w-full h-full relative overflow-auto custom-scrollbar bg-[#0d0a06]">
        
        {/* Beautiful Medieval Background Rendering */}
        <Image 
          src="/images/village_bg.png" 
          alt="Village Background" 
          fill 
          priority
          quality={85}
          sizes="100vw"
          className="object-cover opacity-40 mix-blend-screen" 
        />

        {/* Faint Grid Overlay */}
        <div className="absolute inset-0 select-none opacity-20 pointer-events-none mix-blend-overlay" 
             style={{
               backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)', 
               backgroundSize: '100px 100px', backgroundPosition: 'center'
             }}></div>
        
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#121212]/90 pointer-events-none z-10"></div>
        
        <div className="relative w-full h-full min-h-[600px] max-w-[1200px] mx-auto hidden sm:block pointer-events-none"></div> 
        
        <div className="absolute inset-0 w-full h-full min-h-[500px] max-w-[1200px] mx-auto py-10 px-4">
          <MapNode id="headquarters" x="50%" y="30%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('headquarters')} onClick={() => setSelectedBuilding('headquarters')} />
          <MapNode id="timberCamp" x="25%" y="20%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('timberCamp')} onClick={() => setSelectedBuilding('timberCamp')} />
          <MapNode id="clayPit" x="80%" y="25%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('clayPit')} onClick={() => setSelectedBuilding('clayPit')} />
          <MapNode id="ironMine" x="15%" y="60%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('ironMine')} onClick={() => setSelectedBuilding('ironMine')} />
          <MapNode id="warehouse" x="65%" y="50%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('warehouse')} onClick={() => setSelectedBuilding('warehouse')} />
          <MapNode id="cityWall" x="50%" y="80%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('cityWall')} onClick={() => setSelectedBuilding('cityWall')} />
          <MapNode id="barracks" x="35%" y="45%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('barracks')} onClick={() => setSelectedBuilding('barracks')} />
          <MapNode id="stable" x="25%" y="70%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('stable')} onClick={() => setSelectedBuilding('stable')} />
          <MapNode id="castle" x="85%" y="70%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('castle')} onClick={() => setSelectedBuilding('castle')} />
          <MapNode id="palace" x="65%" y="20%" activeVillage={activeVillage} MAX_LEVELS={MAX_LEVELS} isQueued={isBuildingQueued('palace')} onClick={() => setSelectedBuilding('palace')} />
        </div>
      </div>
    </>
  );
}

// Sub-component for buildings on the map
function MapNode({ id, x, y, activeVillage, MAX_LEVELS, isQueued, onClick }: any) {
  const meta = BUILDING_META[id as keyof Buildings];
  const level = activeVillage.buildings[id];
  const maxLevel = MAX_LEVELS[id];
  const isZero = level === 0;

  return (
    <div 
      className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 group z-20 hover:z-30 cursor-pointer"
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      <div className={`
        relative overflow-hidden w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 mb-1 sm:mb-2 rounded-full border-[3px] border-solid shadow-[0_10px_30px_rgba(0,0,0,0.9)]
        transition-all duration-300
        ${level >= maxLevel ? 'border-[#ffb700] ring-4 ring-[#ffb700]/30' : isZero ? 'border-[#3e2c1e] opacity-60 grayscale scale-90' : 'border-[#8c6239] group-hover:border-[#ffb700] group-hover:scale-105 active:scale-95'}
      `}>
        {isQueued && (
          <div className="absolute inset-0 bg-emerald-500/30 animate-pulse z-20 mix-blend-overlay"></div>
        )}
        <Image src={meta.image} alt={meta.name} fill sizes="256px" quality={90} priority className="object-cover z-10 opacity-100" />
      </div>

      <div className="glass-panel px-3 py-1.5 rounded border border-outline-variant text-center min-w-[120px] shadow-2xl group-hover:bg-surface-highest transition-colors">
        <h3 className="text-primary font-bold text-[10px] uppercase tracking-[0.15em] mb-0.5 whitespace-nowrap medieval-font">{meta.name}</h3>
        {isZero ? (
          <div className="text-[9px] text-on-surface-variant/40 font-bold uppercase tracking-widest">Ruins</div>
        ) : (
          <div className="text-[10px] text-on-surface-variant font-mono">
            <span className={`${level >= maxLevel ? 'text-primary font-black animate-glow' : 'opacity-80'}`}>Lv.{level}</span> <span className="opacity-30">/ {maxLevel}</span>
          </div>
        )}
      </div>

      {isQueued && (
        <div className="absolute -top-3 -right-3 sm:-right-4 bg-emerald-600 text-white text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full border border-emerald-400 shadow-lg animate-bounce">
          Upgrading
        </div>
      )}
    </div>
  );
}
