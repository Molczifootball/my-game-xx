"use client";

import { useGame, getProductionRate, getFoodProduction, getFoodUpkeep } from '@/context/GameContext';
import { formatTime, BUILDING_META, calculatePoints } from '@/utils/shared';
import { useEffect, useState } from 'react';

export default function SidebarLeft() {
  const { state, activeVillage, getTimeRemaining, renameVillage } = useGame();

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

  const foodProd = getFoodProduction(activeVillage.buildings!.farm || 0);
  const foodUpkeep = getFoodUpkeep(activeVillage.units || {});
  const netFood = foodProd - foodUpkeep;
  const currentFood = Math.min(capacity, Math.max(0, (activeVillage.resources!.food || 0) + (netFood / 3600) * deltaSecs));
  const isStarving = currentFood <= 0 && foodUpkeep > foodProd;

  return (
    <aside className="w-full md:w-60 bg-surface-low flex flex-col overflow-y-auto custom-scrollbar z-20 shrink-0 border-r border-outline-variant">

      {/* Village Info */}
      <div className="px-4 pt-4 pb-3">
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
            className="w-full text-sm text-primary medieval-font bg-black/40 border border-primary/40 rounded px-2 py-1 outline-none focus:border-primary"
          />
        ) : (
          <div
            className="flex items-center gap-1.5 group cursor-pointer"
            onClick={() => { setNameInput(activeVillage.name || ''); setIsEditingName(true); }}
            title="Click to rename"
          >
            <h2 className="text-sm text-primary medieval-font truncate tracking-wider">{activeVillage.name}</h2>
            <span className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">✏️</span>
          </div>
        )}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-mono">
          <span>{activeVillage.x}|{activeVillage.y}</span>
          <span className="text-primary font-bold">{totalPoints.toLocaleString()} pts</span>
        </div>
      </div>

      {/* Resources */}
      <div className="px-4 pb-4 border-b border-outline-variant">
        <div className="flex flex-col gap-3">
          <ResourceBar label="Wood" value={currentWood} rate={rateWood} capacity={capacity} color="#a1662f" />
          <ResourceBar label="Clay" value={currentClay} rate={rateClay} capacity={capacity} color="#c55331" />
          <ResourceBar label="Iron" value={currentIron} rate={rateIron} capacity={capacity} color="#7a8fa8" />
          <ResourceBar label="Food" value={currentFood} rate={netFood} capacity={capacity} color="#4ade80" isStarving={isStarving} />
        </div>
        <div className="flex justify-between items-center mt-2 text-[9px] text-gray-600 font-mono">
          <span>Warehouse</span>
          <span>{capacity.toLocaleString()} max</span>
        </div>
      </div>

      {/* Construction Queue */}
      <div className="px-4 py-4 flex-1">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Build Queue</span>
          <span className={`text-[9px] font-mono font-bold ${queuedCount >= 3 ? 'text-red-400' : 'text-gray-600'}`}>{queuedCount}/3</span>
        </div>

        {vUpgrades.length === 0 ? (
          <div className="text-gray-700 text-[10px] text-center py-6 border border-dashed border-outline-variant rounded uppercase tracking-widest font-bold">
            Empty
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {vUpgrades.map((u, idx) => {
              const remaining = getTimeRemaining(u.completesAt);
              const isFirst = idx === 0;
              return (
                <div key={u.id} className={`bg-black/20 border border-outline-variant rounded p-2.5 border-l-2 ${isFirst ? 'border-l-green-500' : 'border-l-gray-600'}`}>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <span className="text-gray-300 font-bold truncate">{BUILDING_META[u.building].name}</span>
                    <span className="text-primary font-mono font-bold">Lv.{u.targetLevel}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className={isFirst ? 'text-green-400' : 'text-gray-600'}>{isFirst ? 'Building...' : 'Queued'}</span>
                    <span className={`font-mono font-bold ${isFirst ? 'text-white' : 'text-gray-500'}`}>{formatTime(remaining)}</span>
                  </div>
                  {isFirst && (
                    <div className="mt-1.5 h-1 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500/70 rounded-full animate-pulse" style={{ width: `${Math.max(5, Math.min(100, 100 - (remaining / 60) * 100))}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

function ResourceBar({ label, value, rate, capacity, color, isStarving }: { label: string; value: number; rate: number; capacity: number; color: string; isStarving?: boolean }) {
  const pct = Math.min(100, (value / capacity) * 100);
  const isFull = pct > 95;
  const isNegRate = rate < 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-0.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isStarving ? 'text-red-400 animate-pulse' : ''}`} style={isStarving ? {} : { color }}>{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[11px] font-mono font-bold ${isStarving ? 'text-red-400' : isFull ? 'text-red-400' : 'text-gray-200'}`}>
            {Math.floor(value).toLocaleString()}
          </span>
          <span className={`text-[8px] font-mono ${isNegRate ? 'text-red-400' : 'text-gray-600'}`}>{isNegRate ? '' : '+'}{Math.floor(rate)}/h</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden bg-black/40">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isStarving ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: isStarving ? '#ef4444' : color, opacity: isFull ? 1 : 0.7 }}
        />
      </div>
    </div>
  );
}
