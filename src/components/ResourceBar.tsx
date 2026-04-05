"use client";

import { useGame, getProductionRate, getGrainProduction, getMeatProduction, getFishProduction, getFoodUpkeep, getGranaryCapacity, getMaxPopulation, getCurrentPopulation } from '@/context/GameContext';
import { useEffect, useState } from 'react';

export default function ResourceBar() {
  const { state, activeVillage } = useGame();
  const [, setForceRender] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 200);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return null;

  const b = activeVillage.buildings!;
  const r = activeVillage.resources!;
  const cap = Math.floor(5000 * Math.pow(1.3, b.warehouse - 1));
  const granaryCap = getGranaryCapacity(b.granary || 0);
  const deltaSecs = Math.max(0, Date.now() - state.lastTick) / 1000;

  const wood = Math.min(cap, r.wood + (getProductionRate(b.timberCamp) / 3600) * deltaSecs);
  const clay = Math.min(cap, r.clay + (getProductionRate(b.clayPit) / 3600) * deltaSecs);
  const iron = Math.min(cap, r.iron + (getProductionRate(b.ironMine) / 3600) * deltaSecs);

  const upkeep = getFoodUpkeep(activeVillage.units || {});
  const grainProd = getGrainProduction(b.farm || 0);
  const fishProd = getFishProduction(b.fishery || 0);
  const meatProd = getMeatProduction(b.huntersLodge || 0);

  const grain = Math.min(granaryCap, Math.max(0, (r.grain || 0) + ((grainProd - upkeep.grain) / 3600) * deltaSecs));
  const fish = Math.min(granaryCap, Math.max(0, (r.fish || 0) + ((fishProd - upkeep.fish) / 3600) * deltaSecs));
  const meat = Math.min(granaryCap, Math.max(0, (r.meat || 0) + ((meatProd - upkeep.meat) / 3600) * deltaSecs));

  const currentPop = getCurrentPopulation(activeVillage.units!, activeVillage.recruitment);
  const maxPop = getMaxPopulation(b.residence || 0);

  const materials = [
    { icon: '🪵', value: wood, cap, color: '#a1662f' },
    { icon: '🧱', value: clay, cap, color: '#c55331' },
    { icon: '⛏️', value: iron, cap, color: '#7a8fa8' },
  ];

  const food = [
    { icon: '🌾', value: grain, cap: granaryCap, color: '#d4a843' },
    { icon: '🐟', value: fish, cap: granaryCap, color: '#5a9ec5' },
    { icon: '🥩', value: meat, cap: granaryCap, color: '#c55a5a' },
  ];

  return (
    <div className="w-full bg-surface-low/95 backdrop-blur-xl border-b border-outline-variant py-1 z-40 shrink-0">
      <div className="flex items-center justify-center gap-2 lg:gap-4 px-4 overflow-x-auto no-scrollbar">

        {/* Materials */}
        {materials.map(item => (
          <ResourceItem key={item.icon} {...item} />
        ))}

        <div className="w-px h-6 bg-gray-600/30 shrink-0" />

        {/* Food */}
        {food.map(item => (
          <ResourceItem key={item.icon} {...item} />
        ))}

        <div className="w-px h-6 bg-gray-600/30 shrink-0" />

        {/* Population */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/20 shrink-0">
          <span className="text-sm">👥</span>
          <span className={`text-sm font-mono font-bold tabular-nums ${currentPop >= maxPop ? 'text-red-400' : 'text-gray-100'}`}>
            {currentPop}<span className="text-gray-500 text-xs font-normal">/{maxPop}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ResourceItem({ icon, value, cap }: { icon: string; value: number; cap: number; color: string }) {
  const isFull = (value / cap) > 0.95;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/20 shrink-0">
      <span className="text-sm">{icon}</span>
      <span className={`text-sm font-mono font-bold tabular-nums ${isFull ? 'text-red-400' : 'text-gray-100'}`}>
        {Math.floor(value).toLocaleString()}
      </span>
    </div>
  );
}
