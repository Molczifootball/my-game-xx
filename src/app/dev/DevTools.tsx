"use client";

import { useGame } from '@/context/GameContext';
import Link from 'next/link';

export default function DevTools() {
  const {
    addResources,
    maxAllBuildings,
    resetVillage,
    addArmy,
    updateWorldTile,
    regenerateMap,
    MAX_LEVELS,
  } = useGame();

  const handleGodModeLocal = () => {
    updateWorldTile(26, 22, {
      buildings: { ...MAX_LEVELS },
      units: { pikeman: 100, swordman: 100 },
    });
  };

  const spawnPlayerVillage = (x: number, y: number, name: string) => {
    updateWorldTile(x, y, {
      type: 'village',
      name,
      owner: 'Barbarian',
      buildings: { ...MAX_LEVELS },
      units: { pikeman: 200, swordman: 200, axeman: 150, archer: 100, scout: 50, lightCavalry: 100, heavyCavalry: 50, horseArcher: 50, knight: 1, nobleman: 0 },
      resources: { wood: 50000, clay: 50000, iron: 50000 },
      endorsement: 100,
      upgrades: [],
      recruitment: [],
    });
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Resource Management */}
      <div className="sovereign-card glass-panel p-6 shadow-2xl relative overflow-hidden group border border-outline-variant rounded">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-6xl">📦</span>
        </div>
        <h3 className="text-primary uppercase tracking-[0.2em] text-xs font-bold mb-6 border-b border-outline-variant pb-2 medieval-font">Imperial Logistics</h3>
        <div className="flex flex-col gap-3">
          <button onClick={addResources} className="w-full py-4 gold-button rounded transition-all active:scale-95">
            Inject 100,000 Tributes
          </button>
          <p className="text-[10px] text-on-surface-variant italic opacity-60">Instantly replenishes timber, clay, and iron stockpiles.</p>
        </div>
      </div>

      {/* Military Operations */}
      <div className="sovereign-card glass-panel p-6 shadow-2xl relative overflow-hidden group border border-outline-variant rounded">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-6xl">⚔️</span>
        </div>
        <h3 className="text-tertiary uppercase tracking-[0.2em] text-xs font-bold mb-6 border-b border-outline-variant pb-2 medieval-font">War Council</h3>
        <div className="flex flex-col gap-3">
          <button onClick={() => addArmy({ lightCavalry: 250, swordman: 500, axeman: 500 })} className="w-full py-4 bg-tertiary/10 hover:bg-tertiary/20 border border-tertiary/30 text-tertiary text-xs font-bold uppercase tracking-widest rounded transition-all active:scale-95">
            Mobilize High-Tier Battalion
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addArmy({ scout: 50 })} className="py-2 bg-surface-highest hover:bg-surface-high border border-outline-variant text-on-surface-variant text-[10px] font-bold uppercase rounded">
              50 Recon Scouts
            </button>
            <button onClick={() => addArmy({ nobleman: 4 })} className="py-2 bg-surface-highest hover:bg-surface-high border border-outline-variant text-on-surface-variant text-[10px] font-bold uppercase rounded">
              4 Sovereigns (Noble)
            </button>
          </div>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="bg-[#111] border border-[#333] rounded-lg p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-6xl">🏰</span>
        </div>
        <h3 className="text-purple-500 uppercase tracking-widest text-xs font-bold mb-6 border-b border-white/5 pb-2">Infrastructure</h3>
        <div className="flex flex-col gap-3">
          <button onClick={maxAllBuildings} className="w-full py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-900/50 text-purple-400 text-xs font-bold uppercase tracking-widest rounded transition-all active:scale-95">
            Max Out All Buildings
          </button>
          <button onClick={resetVillage} className="w-full py-3 bg-red-900/10 hover:bg-red-900/30 border border-red-900/50 text-red-500 text-xs font-bold uppercase tracking-widest rounded transition-all">
            Factory Reset Village
          </button>
        </div>
      </div>

      {/* World Manipulation */}
      <div className="sovereign-panel p-8 shadow-2xl relative overflow-hidden group md:col-span-2 border border-outline-variant rounded">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <span className="text-6xl">🌍</span>
        </div>
        <h3 className="text-primary uppercase tracking-[0.3em] text-xs font-bold mb-8 border-b border-outline-variant pb-4 medieval-font">Cartographer's Workshop (God Mode)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <button onClick={handleGodModeLocal} className="w-full py-5 gold-button rounded transition-all mb-4">
              Ascend Village 26|22
            </button>
            <button onClick={() => { spawnPlayerVillage(26, 24, 'Player Fortress East'); spawnPlayerVillage(24, 23, 'Player Citadel North'); }} className="w-full py-3 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all active:scale-95 mb-4">
              Spawn Villages at 26|24 & 24|23
            </button>
            <button onClick={() => { if (confirm('Regenerate entire world map?')) regenerateMap(); }} className="w-full py-3 bg-surface-highest hover:bg-red-900/20 border border-outline-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded transition-all active:scale-95">
              🔄 Rewrite World Fabric
            </button>
          </div>
          <div className="bg-surface-dim rounded p-6 border border-outline-variant shadow-inner">
            <h4 className="text-[10px] text-on-surface-variant font-bold uppercase mb-4 tracking-[0.2em] opacity-40">Tactical Intelligence</h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[11px] font-mono">
              <div className="text-on-surface-variant/40">LOCUS:</div><div className="text-primary text-right font-black">26|22</div>
              <div className="text-on-surface-variant/40">DOMAIN:</div><div className="text-on-surface-variant text-right">Barbarian</div>
              <div className="text-on-surface-variant/40">POSTURE:</div><div className="text-tertiary text-right animate-pulse font-black uppercase">HOSTILE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
