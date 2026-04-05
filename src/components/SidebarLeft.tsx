"use client";

import { useGame, getProductionRate } from '@/context/GameContext';
import { formatTime, BUILDING_META, calculatePoints } from '@/utils/shared';
import { useEffect, useState } from 'react';

export default function SidebarLeft() {
  const { state, activeVillage, addResources, maxAllBuildings, resetVillage, getTimeRemaining, renameVillage, addArmy, updateWorldTile, MAX_LEVELS } = useGame();
  
  const [, setForceRender] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 100);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return null;

  const totalPoints = calculatePoints(activeVillage.buildings!);
  const vUpgrades = activeVillage.upgrades || [];
  const queuedCount = vUpgrades.length;

  const capacity = Math.floor(5000 * Math.pow(1.3, activeVillage.buildings!.warehouse - 1));
  const rateWood = getProductionRate(activeVillage.buildings!.timberCamp);
  const rateClay = getProductionRate(activeVillage.buildings!.clayPit);
  const rateIron = getProductionRate(activeVillage.buildings!.ironMine);

  const deltaSecs = Math.max(0, Date.now() - state.lastTick) / 1000;
  const currentWood = Math.min(capacity, activeVillage.resources!.wood + (rateWood / 3600) * deltaSecs);
  const currentClay = Math.min(capacity, activeVillage.resources!.clay + (rateClay / 3600) * deltaSecs);
  const currentIron = Math.min(capacity, activeVillage.resources!.iron + (rateIron / 3600) * deltaSecs);

  return (
    <aside className="w-full md:w-64 sovereign-panel border-r border-[#3e2c1e] flex flex-col overflow-y-auto custom-scrollbar z-20 shadow-xl shrink-0">
      {/* Village Context & Resources */}
      <div className="p-5 border-b border-[#2e1f13]">
        {isEditingName ? (
          <input
            autoFocus
            value={nameInput}
            maxLength={24}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => { renameVillage(nameInput); setIsEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { renameVillage(nameInput); setIsEditingName(false); }
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            className="w-full text-xl text-[#ffb700] medieval-font bg-black/60 border border-amber-600/60 rounded px-2 py-1 mb-2 outline-none focus:border-amber-400 shadow-inner"
          />
        ) : (
          <div
            className="flex items-center gap-2 group cursor-pointer mb-2"
            onClick={() => { setNameInput(activeVillage.name || ''); setIsEditingName(true); }}
            title="Click to rename village"
          >
            <h2 className="text-2xl text-[#ffb700] medieval-font truncate drop-shadow">{activeVillage.name}</h2>
            <span className="text-[#8c6239] opacity-0 group-hover:opacity-100 transition-opacity text-sm">✏️</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 text-sm text-[#a68c74] font-mono mb-4 bg-black/40 p-2 rounded border border-[#3e2c1e] shadow-inner">
          <div>Coords:</div><div className="text-amber-100 text-right">{activeVillage.x}|{activeVillage.y}</div>
          <div>Points:</div><div className="text-[#ffb700] text-right font-bold drop-shadow">{totalPoints.toLocaleString()}</div>
        </div>
        
        <h3 className="text-[#8c6239] uppercase tracking-widest text-[10px] font-bold mb-3 border-b border-[#3e2c1e] pb-1">Stockpiles</h3>
        <div className="flex flex-col gap-2">
          <ResourceBar icon="🪵" label="Wood" value={currentWood} rate={rateWood} capacity={capacity} fillColor="#a1662f" trackColor="#3b1f0a" />
          <ResourceBar icon="🧱" label="Clay" value={currentClay} rate={rateClay} capacity={capacity} fillColor="#c55331" trackColor="#3b1510" />
          <ResourceBar icon="⛏️" label="Iron" value={currentIron} rate={rateIron} capacity={capacity} fillColor="#7a8fa8" trackColor="#151c24" />
          <div className="flex justify-between items-center text-[#8c6239] bg-[#1c140d]/50 px-3 py-1.5 rounded border border-[#3e2c1e] shadow-md mt-0.5">
            <div className="flex gap-2 items-center"><span>📦</span><span className="font-bold uppercase tracking-wider text-[10px]">Capacity</span></div>
            <span className="text-amber-100/80 font-mono text-xs">{capacity.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Active Upgrades Queue */}
      <div className="p-5 flex-1 bg-black/20">
        <h3 className="text-[#8c6239] uppercase tracking-widest text-[10px] font-bold mb-4 flex justify-between items-center">
          <span>Construction Queue</span>
          <span className={`${queuedCount >= 3 ? 'text-red-500' : 'text-[#8c6239]'}`}>{queuedCount} / 3</span>
        </h3>
        
        {vUpgrades.length === 0 ? (
          <p className="text-[#5e4126] text-xs text-center border border-dashed border-[#5e4126] py-6 rounded uppercase tracking-widest font-bold">Queue Empty</p>
        ) : (
          <div className="flex flex-col gap-3">
            {vUpgrades.map((u, idx) => {
              const remaining = getTimeRemaining(u.completesAt);
              return (
                <div key={u.id} className="bg-[#1e1e1e] border border-[#444] border-l-2 border-l-amber-600 p-3 text-xs rounded relative">
                  <div className="flex justify-between items-center text-gray-200 mb-1">
                    <span className="font-bold truncate">{BUILDING_META[u.building].name}</span>
                    <span className="text-amber-500 font-bold">Lv.{u.targetLevel}</span>
                  </div>
                  <div className="flex justify-between font-mono text-gray-500">
                    <span className={idx === 0 ? "text-emerald-500/80" : ""}>{idx === 0 ? "Upgrading..." : "Queued"}</span>
                    <span className="text-white">{formatTime(remaining)}</span>
                  </div>
                  <div className="mt-2 h-1 bg-black/40 rounded-full overflow-hidden">
                    <div 
                       className={`h-full bg-amber-600 transition-all ${idx === 0 ? 'animate-pulse' : ''}`} 
                       style={{ width: `${Math.max(0, Math.min(100, 100 - (remaining / 60) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </aside>
  );
}

function ResourceBar({ icon, label, value, rate, capacity, fillColor, trackColor }: any) {
  const percentage = Math.min(100, (value / capacity) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-end text-[10px]">
        <span className="text-[#8c6239] font-bold uppercase tracking-widest flex items-center gap-1">
          <span className="text-xs">{icon}</span> {label}
        </span>
        <span className="font-mono text-amber-100/90 font-bold">{Math.floor(value).toLocaleString()}</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden border border-black/50 shadow-inner" style={{ backgroundColor: trackColor }}>
        <div 
          className="h-full transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
          style={{ width: `${percentage}%`, backgroundColor: fillColor }}
        ></div>
      </div>
      <div className="text-[9px] text-[#5e4126] font-mono text-right italic">
        +{Math.floor(rate)}/hr
      </div>
    </div>
  );
}
