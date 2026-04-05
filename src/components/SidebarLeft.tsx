"use client";

import { useGame, getProductionRate, getGrainProduction, getMeatProduction, getFishProduction, getFoodUpkeep, getGranaryCapacity, getMaxPopulation, getCurrentPopulation, Units, UNIT_ATLAS, Buildings } from '@/context/GameContext';
import { formatTime, BUILDING_META, calculatePoints, UNIT_EMOJIS } from '@/utils/shared';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SidebarLeft() {
  const { state, activeVillage, getTimeRemaining, renameVillage, markReportAsRead } = useGame();

  const [, setForceRender] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showMaterials, setShowMaterials] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showQueue, setShowQueue] = useState(true);
  const [showArmy, setShowArmy] = useState(false);
  const [showDeployments, setShowDeployments] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [showTraining, setShowTraining] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 200);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return null;

  const totalPoints = calculatePoints(activeVillage.buildings!);
  const vUpgrades = activeVillage.upgrades || [];
  const vUnits = activeVillage.units || {};
  const vRecruitment = activeVillage.recruitment || [];

  // Resources
  const capacity = Math.floor(5000 * Math.pow(1.3, activeVillage.buildings!.warehouse - 1));
  const rateWood = getProductionRate(activeVillage.buildings!.timberCamp);
  const rateClay = getProductionRate(activeVillage.buildings!.clayPit);
  const rateIron = getProductionRate(activeVillage.buildings!.ironMine);
  const deltaSecs = Math.max(0, Date.now() - state.lastTick) / 1000;
  const currentWood = Math.min(capacity, activeVillage.resources!.wood + (rateWood / 3600) * deltaSecs);
  const currentClay = Math.min(capacity, activeVillage.resources!.clay + (rateClay / 3600) * deltaSecs);
  const currentIron = Math.min(capacity, activeVillage.resources!.iron + (rateIron / 3600) * deltaSecs);

  // Food
  const granaryCap = getGranaryCapacity(activeVillage.buildings!.granary || 0);
  const grainProd = getGrainProduction(activeVillage.buildings!.farm || 0);
  const meatProd = getMeatProduction(activeVillage.buildings!.huntersLodge || 0);
  const fishProd = getFishProduction(activeVillage.buildings!.fishery || 0);
  const upkeep = getFoodUpkeep(vUnits);
  const netGrain = grainProd - upkeep.grain;
  const netFish = fishProd - upkeep.fish;
  const netMeat = meatProd - upkeep.meat;
  const currentGrain = Math.min(granaryCap, Math.max(0, (activeVillage.resources!.grain || 0) + (netGrain / 3600) * deltaSecs));
  const currentFish = Math.min(granaryCap, Math.max(0, (activeVillage.resources!.fish || 0) + (netFish / 3600) * deltaSecs));
  const currentMeat = Math.min(granaryCap, Math.max(0, (activeVillage.resources!.meat || 0) + (netMeat / 3600) * deltaSecs));
  const isStarvingGrain = currentGrain <= 0 && upkeep.grain > grainProd;
  const isStarvingFish = currentFish <= 0 && upkeep.fish > fishProd;
  const isStarvingMeat = currentMeat <= 0 && upkeep.meat > meatProd;

  // Army
  const currentPop = getCurrentPopulation(vUnits, vRecruitment);
  const maxPop = getMaxPopulation(activeVillage.buildings!.residence || 0);
  let totalUnits = 0, totalAtk = 0, totalDef = 0;
  Object.entries(vUnits).forEach(([k, v]) => {
    const c = (v as number) || 0;
    totalUnits += c;
    totalAtk += c * UNIT_ATLAS[k as keyof Units].atk;
    totalDef += c * UNIT_ATLAS[k as keyof Units].def;
  });

  return (
    <aside className="w-full md:w-56 bg-surface-low/95 backdrop-blur-sm flex flex-col overflow-y-auto custom-scrollbar z-20 shrink-0 border-r border-outline-variant">

      {/* Village Header */}
      <div className="px-3 pt-3 pb-2 border-b border-outline-variant">
        {isEditingName ? (
          <input autoFocus value={nameInput} maxLength={24}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => { renameVillage(nameInput); setIsEditingName(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { renameVillage(nameInput); setIsEditingName(false); } if (e.key === 'Escape') setIsEditingName(false); }}
            className="w-full text-xs text-primary medieval-font bg-black/40 border border-primary/40 rounded px-2 py-1 outline-none focus:border-primary"
          />
        ) : (
          <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { setNameInput(activeVillage.name || ''); setIsEditingName(true); }}>
            <h2 className="text-xs text-primary medieval-font truncate tracking-wider">{activeVillage.name}</h2>
            <span className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">✏️</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-400 font-mono">
          <span>{activeVillage.x}|{activeVillage.y}</span>
          <span className="w-px h-3 bg-outline-variant" />
          <span className="text-primary font-bold">{totalPoints.toLocaleString()}</span>
          <span className="w-px h-3 bg-outline-variant" />
          <span className={currentPop >= maxPop ? 'text-red-400' : ''}>👥{currentPop}/{maxPop}</span>
        </div>
      </div>

      {/* ── MATERIALS ── */}
      <Section title="Materials" right={`📦 ${capacity.toLocaleString()}`} open={showMaterials} toggle={() => setShowMaterials(!showMaterials)}>
        <ResourceRow icon="🪵" label="Wood" value={currentWood} rate={rateWood} capacity={capacity} color="#c4813a" />
        <ResourceRow icon="🧱" label="Clay" value={currentClay} rate={rateClay} capacity={capacity} color="#e06840" />
        <ResourceRow icon="⛏️" label="Iron" value={currentIron} rate={rateIron} capacity={capacity} color="#b0bcc9" />
      </Section>

      {/* ── FOOD ── */}
      <Section title="Food Supply" right={`🏪 ${granaryCap.toLocaleString()}`} open={showFood} toggle={() => setShowFood(!showFood)}>
        <ResourceRow icon="🌾" label="Grain" value={currentGrain} rate={netGrain} capacity={granaryCap} color="#d4a843" isStarving={isStarvingGrain} />
        <ResourceRow icon="🐟" label="Fish" value={currentFish} rate={netFish} capacity={granaryCap} color="#5a9ec5" isStarving={isStarvingFish} />
        <ResourceRow icon="🥩" label="Meat" value={currentMeat} rate={netMeat} capacity={granaryCap} color="#c55a5a" isStarving={isStarvingMeat} />
      </Section>

      {/* ── BUILD QUEUE ── */}
      <Section title="Build Queue" right={`${vUpgrades.length}/3`} rightColor={vUpgrades.length >= 3 ? 'text-red-400' : undefined} open={showQueue} toggle={() => setShowQueue(!showQueue)}>
        {vUpgrades.length === 0 ? (
          <div className="text-gray-500 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">Empty</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {vUpgrades.map((u, idx) => {
              const remaining = getTimeRemaining(u.completesAt);
              const isFirst = idx === 0;
              return (
                <div key={u.id} className={`bg-black/20 border border-outline-variant rounded px-2 py-1.5 border-l-2 ${isFirst ? 'border-l-green-500' : 'border-l-gray-700'}`}>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-gray-300 font-bold truncate">{BUILDING_META[u.building].name}</span>
                    <span className="text-primary font-mono text-[8px]">Lv.{u.targetLevel}</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] mt-0.5">
                    <span className={isFirst ? 'text-green-400' : 'text-gray-500'}>{isFirst ? 'Building' : 'Queued'}</span>
                    <span className={`font-mono ${isFirst ? 'text-white' : 'text-gray-500'}`}>{formatTime(remaining)}</span>
                  </div>
                  {isFirst && (
                    <div className="mt-1 h-[2px] bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500/60 rounded-full animate-pulse" style={{ width: `${Math.max(5, Math.min(100, 100 - (remaining / 60) * 100))}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── ARMY ── */}
      <Section title="Army" right={`⚔️${totalAtk > 999 ? `${(totalAtk/1000).toFixed(1)}k` : totalAtk} 🛡️${totalDef > 999 ? `${(totalDef/1000).toFixed(1)}k` : totalDef}`} open={showArmy} toggle={() => setShowArmy(!showArmy)}>
        <div className="flex flex-col gap-0.5">
          {Object.entries(UNIT_ATLAS).map(([k, meta]) => {
            const count = (vUnits[k as keyof Units] as number) || 0;
            const inTraining = vRecruitment.filter(r => r.unit === k).length;
            return (
              <div key={k} className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] ${count > 0 ? 'bg-black/20' : 'opacity-30'}`}>
                <span className="text-sm w-5 text-center">{UNIT_EMOJIS[k as keyof typeof UNIT_EMOJIS]}</span>
                <span className="text-gray-400 flex-1 truncate">{meta.name}</span>
                <span className={`font-mono font-bold ${count > 0 ? 'text-gray-200' : 'text-gray-500'}`}>{count}</span>
                {inTraining > 0 && <span className="text-[8px] text-blue-400 font-mono">+{inTraining}</span>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── TRAINING ── */}
      <Section title="Training" right={`${vRecruitment.length}`} open={showTraining} toggle={() => setShowTraining(!showTraining)}>
        {vRecruitment.length === 0 ? (
          <div className="text-gray-500 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">Idle</div>
        ) : (
          <div className="flex flex-col gap-1">
            {vRecruitment.map((r, idx) => {
              const remaining = getTimeRemaining(r.completesAt);
              const isFirst = idx === 0;
              return (
                <div key={r.id} className={`flex items-center gap-1.5 px-2 py-1 rounded border-l-2 bg-black/20 ${isFirst ? 'border-l-green-500' : 'border-l-gray-700'}`}>
                  <span className="text-sm">{UNIT_EMOJIS[r.unit as keyof typeof UNIT_EMOJIS]}</span>
                  <span className="text-[9px] text-gray-400 flex-1 truncate">{UNIT_ATLAS[r.unit].name}</span>
                  <span className={`font-mono text-[9px] font-bold ${isFirst ? 'text-green-400' : 'text-gray-500'}`}>{formatTime(remaining)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── DEPLOYMENTS ── */}
      {(() => {
        const playerVillageIds = new Set(state.worldMap.filter(t => t.owner === state.playerName).map(t => `${t.x}|${t.y}`));
        const myCommands = state.activeCommands.filter(cmd => playerVillageIds.has(`${cmd.originX}|${cmd.originY}`));
        const incomingAttacks = state.activeCommands.filter(cmd => !playerVillageIds.has(`${cmd.originX}|${cmd.originY}`) && cmd.status === 'marching' && playerVillageIds.has(`${cmd.targetX}|${cmd.targetY}`));
        return (
        <>
        <Section title="Deployments" right={`${myCommands.length}`} open={showDeployments} toggle={() => setShowDeployments(!showDeployments)}>
        {myCommands.length === 0 ? (
          <div className="text-gray-500 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">None</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {myCommands.map((cmd) => {
              const isMarching = cmd.status === 'marching';
              const remaining = getTimeRemaining(isMarching ? cmd.arrivesAt : cmd.returnsAt);
              return (
                <div key={cmd.id} className={`bg-black/20 border border-outline-variant rounded px-2 py-1.5 border-l-2 ${isMarching ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-gray-300 font-bold">{isMarching ? (cmd.type === 'scout' ? '🕵️ Scout' : '⚔️ Attack') : '🏕️ Return'}</span>
                    <span className="text-gray-400 font-mono text-[8px]">{cmd.targetX}|{cmd.targetY}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-primary font-mono font-bold text-xs">{formatTime(remaining)}</span>
                    {!isMarching && (cmd.loot.wood + cmd.loot.clay + cmd.loot.iron) > 0 && (
                      <span className="text-[7px] text-gray-400 font-mono">💰{cmd.loot.wood + cmd.loot.clay + cmd.loot.iron}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── INCOMING ATTACKS ── */}
      {incomingAttacks.length > 0 && (
        <Section title="⚠️ Incoming" right={`${incomingAttacks.length}`} rightColor="text-red-400" open={true} toggle={() => {}}>
          <div className="flex flex-col gap-1.5">
            {incomingAttacks.map((cmd) => {
              const remaining = getTimeRemaining(cmd.arrivesAt);
              return (
                <div key={cmd.id} className="bg-red-900/15 border border-red-500/30 rounded px-2 py-1.5 border-l-2 border-l-red-500 animate-pulse">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-red-400 font-bold">⚔️ Attack incoming!</span>
                    <span className="text-gray-400 font-mono text-[8px]">→ {cmd.targetX}|{cmd.targetY}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-red-400 font-mono font-bold text-xs">{formatTime(remaining)}</span>
                    <span className="text-[8px] text-gray-400 font-mono">from {cmd.originX}|{cmd.originY}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
      </>
      );
      })()}

      {/* ── REPORTS ── */}
      <Section title="Reports" right={<Link href="/reports" className="text-[8px] text-primary font-bold hover:underline">All</Link>} open={showReports} toggle={() => setShowReports(!showReports)}>
        {state.reports.length === 0 ? (
          <div className="text-gray-500 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">Empty</div>
        ) : (
          <div className="flex flex-col gap-1">
            {state.reports.slice(0, 3).map((rep) => (
              <div
                key={rep.id}
                onClick={() => { if (!rep.isRead) markReportAsRead(rep.id); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all border-l-2 hover:bg-white/[0.03]
                  ${!rep.isRead ? 'bg-black/20 border-l-primary' : 'border-l-transparent'}
                `}
              >
                <span className="text-sm">{rep.direction === 'incoming' ? '🛡️' : rep.type === 'attack' ? '⚔️' : '🕵️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold ${rep.result === 'victory' ? 'text-green-400' : rep.result === 'defeat' ? 'text-red-400' : 'text-blue-400'}`}>{rep.result}</span>
                    {!rep.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[8px] text-gray-400 font-mono block truncate">{rep.targetName}</span>
                </div>
                <span className="text-[8px] text-gray-400 font-mono shrink-0">{rep.targetX}|{rep.targetY}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

    </aside>
  );
}

/* Reusable collapsible section */
function Section({ title, right, rightColor, open, toggle, children }: {
  title: string; right?: React.ReactNode; rightColor?: string; open: boolean; toggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-outline-variant">
      <button onClick={toggle} className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{title}</span>
        <div className="flex items-center gap-2">
          {typeof right === 'string' ? <span className={`text-[8px] font-mono font-bold ${rightColor || 'text-gray-400'}`}>{right}</span> : right}
          <span className="text-[9px] text-gray-500">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

function ResourceRow({ icon, label, value, rate, capacity, color, isStarving }: { icon: string; label: string; value: number; rate: number; capacity: number; color: string; isStarving?: boolean }) {
  const pct = Math.min(100, (value / capacity) * 100);
  const isFull = pct > 95;
  const isNeg = rate < 0;
  return (
    <div className="mb-1">
      <div className="flex justify-between items-center mb-0.5">
        <span className={`text-[9px] font-bold ${isStarving ? 'text-red-400 animate-pulse' : ''}`} style={isStarving ? {} : { color }}>
          {icon} {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-mono font-bold ${isStarving ? 'text-red-400' : isFull ? 'text-red-400' : 'text-gray-100'}`}>
            {Math.floor(value).toLocaleString()}
          </span>
          <span className={`text-[7px] font-mono ${isNeg ? 'text-red-400' : 'text-gray-500'}`}>{isNeg ? '' : '+'}{Math.floor(rate)}/h</span>
        </div>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden bg-black/40">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isStarving ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%`, backgroundColor: isStarving ? '#ef4444' : color, opacity: isFull ? 1 : 0.65 }}
        />
      </div>
    </div>
  );
}
