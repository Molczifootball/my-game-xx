"use client";

import { useState, useEffect } from 'react';
import { useGame, Units, BattleReport, UNIT_ATLAS, Buildings, getMaxPopulation, getCurrentPopulation } from '@/context/GameContext';
import { formatTime, UNIT_EMOJIS, BUILDING_META } from '@/utils/shared';
import Link from 'next/link';

export default function SidebarRight() {
  const { state, activeVillage, getTimeRemaining, markReportAsRead } = useGame();
  const [selectedReport, setSelectedReport] = useState<BattleReport | null>(null);
  const [rosterExpanded, setRosterExpanded] = useState(false);
  const [, setForceRender] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setForceRender(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!activeVillage) return null;

  const vUnits = activeVillage.units || {};
  const vRecruitment = activeVillage.recruitment || [];

  let totalUnits = 0, totalAtk = 0, totalDef = 0;
  Object.entries(vUnits).forEach(([k, v]) => {
    const c = (v as number) || 0;
    totalUnits += c;
    totalAtk += c * UNIT_ATLAS[k as keyof Units].atk;
    totalDef += c * UNIT_ATLAS[k as keyof Units].def;
  });

  const currentPop = getCurrentPopulation(vUnits, vRecruitment);
  const maxPop = getMaxPopulation(activeVillage.buildings!.residence || 0);

  return (
    <>
      {/* Report quick-view modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-surface-low border border-outline-variant rounded-lg shadow-2xl max-w-sm w-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedReport.direction === 'incoming' ? '🛡️' : selectedReport.type === 'attack' ? '⚔️' : '🕵️'}</span>
                <div>
                  <span className="text-xs font-bold text-white block">{selectedReport.targetName}</span>
                  <span className={`text-[9px] font-bold uppercase ${selectedReport.result === 'victory' ? 'text-green-400' : selectedReport.result === 'defeat' ? 'text-red-400' : 'text-blue-400'}`}>{selectedReport.result}</span>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="w-6 h-6 rounded bg-surface-highest flex items-center justify-center text-gray-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {selectedReport.targetResources && (
                <div>
                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Resources</span>
                  <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
                    <span className="bg-black/30 rounded py-1 text-wood">🪵 {Math.floor(selectedReport.targetResources.wood).toLocaleString()}</span>
                    <span className="bg-black/30 rounded py-1 text-clay">🧱 {Math.floor(selectedReport.targetResources.clay).toLocaleString()}</span>
                    <span className="bg-black/30 rounded py-1 text-iron">⛏️ {Math.floor(selectedReport.targetResources.iron).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {selectedReport.type === 'attack' && (
                <>
                  <div>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Casualties</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-[9px]">
                        <span className="text-blue-400 font-bold block mb-0.5">Attacker</span>
                        {Object.entries(selectedReport.attackerLosses || {}).filter(([, c]) => (c as number) > 0).map(([u, c]) => (
                          <div key={u} className="flex justify-between font-mono"><span>{UNIT_EMOJIS[u as keyof typeof UNIT_EMOJIS]}</span><span className="text-red-400">-{c as number}</span></div>
                        ))}
                      </div>
                      <div className="text-[9px]">
                        <span className="text-red-400 font-bold block mb-0.5">Defender</span>
                        {Object.entries(selectedReport.defenderLosses || {}).filter(([, c]) => (c as number) > 0).map(([u, c]) => (
                          <div key={u} className="flex justify-between font-mono"><span>{UNIT_EMOJIS[u as keyof typeof UNIT_EMOJIS]}</span><span className="text-red-400">-{c as number}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {Object.values(selectedReport.loot).some(v => v > 0) && (
                    <div>
                      <span className="text-[8px] text-amber-500 font-bold uppercase tracking-widest block mb-1">Loot</span>
                      <div className="flex gap-2 text-[9px] font-mono">
                        <span className="text-wood">🪵{selectedReport.loot.wood}</span>
                        <span className="text-clay">🧱{selectedReport.loot.clay}</span>
                        <span className="text-iron">⛏️{selectedReport.loot.iron}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedReport.endorsementDrop && selectedReport.endorsementDrop > 0 && (
                <div className="bg-purple-900/15 border border-purple-500/20 rounded px-3 py-2 flex justify-between items-center">
                  <span className="text-[9px] text-gray-400">Endorsement</span>
                  <span className="text-purple-400 font-mono font-bold">-{selectedReport.endorsementDrop}</span>
                </div>
              )}

              <Link href="/reports" className="text-[9px] text-primary font-bold uppercase tracking-widest text-center hover:underline mt-1">Full Report →</Link>
            </div>
          </div>
        </div>
      )}

      <aside className="w-full md:w-80 bg-surface-low/95 backdrop-blur-sm flex flex-col overflow-y-auto custom-scrollbar z-20 shrink-0 border-l border-outline-variant">

        {/* Army Summary */}
        <div className="px-3 py-2 border-b border-outline-variant">
          <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mb-1.5">Army</span>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="bg-black/20 rounded px-1.5 py-1 text-center">
              <span className="text-[7px] text-gray-400 block">Units</span>
              <span className="text-[10px] text-gray-200 font-mono font-bold">{totalUnits}</span>
            </div>
            <div className="bg-black/20 rounded px-1.5 py-1 text-center">
              <span className="text-[7px] text-gray-400 block">⚔️ Atk</span>
              <span className="text-[10px] text-green-400 font-mono font-bold">{totalAtk > 999 ? `${(totalAtk/1000).toFixed(1)}k` : totalAtk}</span>
            </div>
            <div className="bg-black/20 rounded px-1.5 py-1 text-center">
              <span className="text-[7px] text-gray-400 block">🛡️ Def</span>
              <span className="text-[10px] text-blue-400 font-mono font-bold">{totalDef > 999 ? `${(totalDef/1000).toFixed(1)}k` : totalDef}</span>
            </div>
            <div className="bg-black/20 rounded px-1.5 py-1 text-center">
              <span className="text-[7px] text-gray-400 block">👥 Pop</span>
              <span className={`text-[10px] font-mono font-bold ${currentPop >= maxPop ? 'text-red-400' : 'text-gray-200'}`}>{currentPop}/{maxPop}</span>
            </div>
          </div>

          {/* Collapsible roster */}
          <button
            onClick={() => setRosterExpanded(!rosterExpanded)}
            className="w-full flex items-center justify-between text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-2 hover:text-gray-400 transition-colors"
          >
            <span>Roster</span>
            <span className="text-[10px]">{rosterExpanded ? '▲' : '▼'}</span>
          </button>
          {rosterExpanded && (
            <div className="flex flex-col gap-0.5 mt-1">
              {Object.entries(UNIT_ATLAS).map(([k, meta]) => {
                const count = (vUnits[k as keyof Units] as number) || 0;
                const inTraining = vRecruitment.filter(r => r.unit === k).length;
                return (
                  <div key={k} className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[9px] ${count > 0 ? 'bg-black/20' : 'opacity-30'}`}>
                    <span className="text-sm w-5 text-center">{UNIT_EMOJIS[k as keyof typeof UNIT_EMOJIS]}</span>
                    <span className="text-gray-400 flex-1 truncate">{meta.name}</span>
                    <span className={`font-mono font-bold ${count > 0 ? 'text-gray-200' : 'text-gray-400'}`}>{count}</span>
                    {inTraining > 0 && <span className="text-[8px] text-blue-400 font-mono">+{inTraining}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Deployments */}
        <div className="px-3 py-2 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Deployments</span>
            <span className="text-[8px] text-gray-500 font-mono">{state.activeCommands.length}</span>
          </div>

          {state.activeCommands.length === 0 ? (
            <div className="text-gray-700 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">None</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {state.activeCommands.map((cmd) => {
                const isMarching = cmd.status === 'marching';
                const remaining = getTimeRemaining(isMarching ? cmd.arrivesAt : cmd.returnsAt);
                return (
                  <div key={cmd.id} className={`bg-black/20 border border-outline-variant rounded px-2 py-1.5 border-l-2 ${isMarching ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-gray-300 font-bold">
                        {isMarching ? (cmd.type === 'scout' ? '🕵️ Scout' : '⚔️ Attack') : '🏕️ Return'}
                      </span>
                      <span className="text-gray-500 font-mono text-[8px]">{cmd.targetX}|{cmd.targetY}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-primary font-mono font-bold text-xs">{formatTime(remaining)}</span>
                      {!isMarching && (cmd.loot.wood + cmd.loot.clay + cmd.loot.iron) > 0 && (
                        <span className="text-[7px] text-gray-500 font-mono">💰 {cmd.loot.wood + cmd.loot.clay + cmd.loot.iron}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reports Inbox */}
        <div className="px-3 py-2 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Reports</span>
            <Link href="/reports" className="text-[8px] text-primary font-bold uppercase tracking-widest hover:underline">All</Link>
          </div>
          {state.reports.length === 0 ? (
            <div className="text-gray-700 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">Empty</div>
          ) : (
            <div className="flex flex-col gap-1">
              {state.reports.slice(0, 3).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => { setSelectedReport(rep); if (!rep.isRead) markReportAsRead(rep.id); }}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all border-l-2 hover:bg-white/[0.03]
                    ${!rep.isRead ? 'bg-black/20 border-l-primary' : 'border-l-transparent'}
                    ${rep.direction === 'incoming' ? 'border-l-orange-500/60' : rep.type === 'attack' ? 'border-l-red-500/40' : 'border-l-blue-500/40'}
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
        </div>

        {/* Training Queue */}
        <div className="px-3 py-2 flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Training</span>
            <span className="text-[8px] text-gray-500 font-mono">{vRecruitment.length}</span>
          </div>

          {vRecruitment.length === 0 ? (
            <div className="text-gray-700 text-[9px] text-center py-3 border border-dashed border-outline-variant rounded font-bold">Idle</div>
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
        </div>
      </aside>
    </>
  );
}
