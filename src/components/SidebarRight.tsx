"use client";

import { useState, useEffect } from 'react';
import { useGame, Units, BattleReport, UNIT_ATLAS, Buildings } from '@/context/GameContext';
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

  const renderReportModal = () => {
    if (!selectedReport) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#1a1a1b] border border-[#444] rounded-xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden relative">
          <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 w-6 h-6 bg-black/50 rounded flex justify-center items-center text-gray-500 hover:text-white hover:bg-red-500/80 transition-colors z-20">✕</button>
          
          <div className="p-6 text-center border-b border-[#333] shrink-0 bg-[#0f0f0f]">
            <div className="text-4xl mb-2">{selectedReport.type === 'attack' ? '⚔️' : '🕵️'}</div>
            <h2 className="text-lg font-bold text-gray-200 capitalize tracking-wider">Battle Report</h2>
            <div className="text-gray-500 text-xs font-mono mt-1">{new Date(selectedReport.timestamp).toLocaleString()}</div>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#222]">
               <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Target</span>
               <span className="text-amber-500 font-bold">{selectedReport.targetName} ({selectedReport.targetX}|{selectedReport.targetY})</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#222]">
               <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Result</span>
               <span className={`font-bold capitalize ${selectedReport.result === 'victory' ? 'text-green-500' : selectedReport.result === 'defeat' ? 'text-red-500' : 'text-blue-500'}`}>{selectedReport.result}</span>
            </div>

            {selectedReport.endorsementDrop && (
               <div className="bg-red-900/20 border border-red-900/40 p-3 rounded flex justify-between items-center">
                 <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">Endorsement Dropped</span>
                 <span className="text-red-500 font-bold text-lg">-{selectedReport.endorsementDrop}</span>
               </div>
            )}

            {selectedReport.targetResources && (
               <div className="bg-[#111] p-3 rounded border border-[#333] mb-3">
                  <h4 className="text-[#8c6239] text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                    <span>💎 Scanned Resources</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                     <div className="bg-[#1a1a1b] py-1.5 rounded text-[#a1662f] border border-[#2e1f13]">🪵 {Math.floor(selectedReport.targetResources.wood).toLocaleString()}</div>
                     <div className="bg-[#1a1a1b] py-1.5 rounded text-[#c55331] border border-[#2e1f13]">🧱 {Math.floor(selectedReport.targetResources.clay).toLocaleString()}</div>
                     <div className="bg-[#1a1a1b] py-1.5 rounded text-[#9ca3af] border border-[#2e1f13]">⛏️ {Math.floor(selectedReport.targetResources.iron).toLocaleString()}</div>
                  </div>
               </div>
            )}

            {selectedReport.targetUnits && (
               <div className="bg-[#111] p-3 rounded border border-[#333] mb-3">
                  <h4 className="text-[#8c6239] text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                    <span>🛡️ Garrison</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                     {Object.entries(selectedReport.targetUnits).map(([unit, count]) => (
                       <div key={unit} className="flex items-center gap-1.5 bg-[#1a1a1b] px-2 py-1 rounded border border-[#2e1f13] text-[10px] text-amber-100 font-mono">
                          <span>{UNIT_EMOJIS[unit as keyof typeof UNIT_EMOJIS] || '👤'}</span>
                          <span>{count as number}</span>
                       </div>
                     ))}
                     {Object.values(selectedReport.targetUnits).every(c => c === 0) && (
                       <span className="text-gray-500 text-[10px] uppercase italic">Clear of hostiles</span>
                     )}
                  </div>
               </div>
            )}

            {selectedReport.targetBuildings && (
               <div className="bg-[#111] p-3 rounded border border-[#333] mb-3 max-h-[120px] overflow-y-auto custom-scrollbar">
                  <h4 className="text-[#8c6239] text-[10px] uppercase tracking-widest font-bold mb-2">
                     🛠️ Infrastructure
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] uppercase tracking-wider font-bold">
                     {Object.entries(selectedReport.targetBuildings).map(([b, lvl]) => (
                       <div key={b} className="flex justify-between items-center bg-[#1a1a1b] px-2 py-1 rounded border border-[#2e1f13]">
                          <span className="text-[#a68c74]">{BUILDING_META[b as keyof Buildings].name}</span>
                          <span className="text-amber-500">Lv.{lvl as number}</span>
                       </div>
                     ))}
                  </div>
               </div>
            )}

             {selectedReport.type === 'attack' && (
               <>
                 <div className="bg-[#111] p-3 rounded border border-[#333] mb-3">
                   <h4 className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Casualties</h4>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1 text-[9px]">
                        <span className="text-blue-500 font-bold uppercase block border-b border-[#222] pb-1">Attacker</span>
                        {Object.entries(selectedReport.attackerLosses || {}).map(([u, c]) => (c as number) > 0 && <div key={u} className="flex justify-between font-mono"><span>{UNIT_EMOJIS[u as keyof typeof UNIT_EMOJIS]} {u}</span><span className="text-red-400">-{c as number}</span></div>)}
                     </div>
                     <div className="flex flex-col gap-1 text-[9px]">
                        <span className="text-red-500 font-bold uppercase block border-b border-[#222] pb-1">Defender</span>
                        {Object.entries(selectedReport.defenderLosses || {}).map(([u, c]) => (c as number) > 0 && <div key={u} className="flex justify-between font-mono"><span>{UNIT_EMOJIS[u as keyof typeof UNIT_EMOJIS]} {u}</span><span className="text-red-400">-{c as number}</span></div>)}
                     </div>
                   </div>
                 </div>
                 {Object.values(selectedReport.loot).some(v => v > 0) && (
                   <div className="bg-amber-900/10 border border-amber-900/30 p-3 rounded">
                      <h4 className="text-amber-600 text-[10px] font-bold uppercase mb-2">Loot Secured</h4>
                      <div className="flex justify-between font-mono text-[11px]">
                         <span className="text-[#a1662f]">🪵 {selectedReport.loot.wood}</span>
                         <span className="text-[#c55331]">🧱 {selectedReport.loot.clay}</span>
                         <span className="text-[#9ca3af]">⛏️ {selectedReport.loot.iron}</span>
                      </div>
                   </div>
                 )}
               </>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderReportModal()}
      <aside className="w-full md:w-80 bg-[#140e0b] border-l border-[#3e2c1e] flex flex-col overflow-y-auto custom-scrollbar z-20 shadow-xl shrink-0">
           
          {/* Military Base */}
          <div className="p-5 border-b border-[#2e1f13] bg-[linear-gradient(180deg,#1c140d_0%,#140e0b_100%)] shrink-0">
             <h3 className="text-[#8c6239] uppercase tracking-widest text-[10px] font-bold mb-3 flex justify-between items-center">
               <span>Military Base</span>
               <span className="text-[9px] text-[#5e4126] font-mono">{activeVillage.name}</span>
             </h3>

             {/* Total army stats */}
             {(() => {
               let totalUnits = 0, totalAtk = 0, totalDef = 0;
               Object.entries(vUnits).forEach(([k, v]) => {
                 const c = (v as number) || 0;
                 totalUnits += c;
                 totalAtk += c * UNIT_ATLAS[k as keyof Units].atk;
                 totalDef += c * UNIT_ATLAS[k as keyof Units].def;
               });
               return totalUnits > 0 ? (
                 <div className="flex gap-2 mb-3">
                   <div className="flex-1 bg-black/30 border border-[#3e2c1e] rounded px-2 py-1.5 text-center">
                     <span className="text-[8px] text-[#5e4126] uppercase tracking-widest block">Troops</span>
                     <span className="text-amber-100 font-mono text-xs font-bold">{totalUnits}</span>
                   </div>
                   <div className="flex-1 bg-black/30 border border-[#3e2c1e] rounded px-2 py-1.5 text-center">
                     <span className="text-[8px] text-[#5e4126] uppercase tracking-widest block">⚔️ Atk</span>
                     <span className="text-green-400 font-mono text-xs font-bold">{totalAtk.toLocaleString()}</span>
                   </div>
                   <div className="flex-1 bg-black/30 border border-[#3e2c1e] rounded px-2 py-1.5 text-center">
                     <span className="text-[8px] text-[#5e4126] uppercase tracking-widest block">🛡️ Def</span>
                     <span className="text-blue-400 font-mono text-xs font-bold">{totalDef.toLocaleString()}</span>
                   </div>
                 </div>
               ) : null;
             })()}

             {/* Unit roster - collapsible */}
             <button
               onClick={() => setRosterExpanded(!rosterExpanded)}
               className="w-full flex items-center justify-between text-[9px] text-[#5e4126] uppercase tracking-widest font-bold mb-1 hover:text-[#8c6239] transition-colors"
             >
               <span>Full Roster</span>
               <span className="text-xs">{rosterExpanded ? '▲' : '▼'}</span>
             </button>
             {rosterExpanded && (
               <div className="flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
                 {Object.entries(UNIT_ATLAS).map(([k, meta]) => {
                   const count = (vUnits[k as keyof Units] as number) || 0;
                   const inTraining = vRecruitment.filter(r => r.unit === k).length;
                   return (
                     <div key={k} className={`flex items-center gap-2 px-2 py-1.5 rounded transition-all ${count > 0 ? 'bg-black/30 border border-[#3e2c1e]' : 'opacity-40'}`}>
                       <span className="text-base w-6 text-center">{UNIT_EMOJIS[k as keyof typeof UNIT_EMOJIS]}</span>
                       <span className="text-[10px] text-[#a68c74] uppercase tracking-wider font-bold flex-1">{meta.name}</span>
                       <span className={`font-mono text-[11px] font-bold ${count > 0 ? 'text-amber-100' : 'text-gray-600'}`}>{count}</span>
                       {inTraining > 0 && (
                         <span className="text-[9px] text-blue-400 font-mono">+{inTraining}</span>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

          {/* Active Commands (Deployed Troops) */}
          <div className="p-5 border-b border-[#2e1f13] bg-black/20 shrink-0">
            <h3 className="text-[#8c6239] uppercase tracking-widest text-[10px] font-bold mb-4 flex justify-between items-center">
              <span>Deployed Battalions</span>
              <span className="text-[#a68c74]">{state.activeCommands.length} active</span>
            </h3>
            
            {state.activeCommands.length === 0 ? (
              <div className="text-[#5e4126] text-[10px] text-center border border-dashed border-[#5e4126] py-4 rounded uppercase tracking-widest font-bold">No deployments</div>
            ) : (
              <div className="flex flex-col gap-2">
                {state.activeCommands.map((cmd) => {
                  const isScout = cmd.type === 'scout';
                  const isMarching = cmd.status === 'marching';
                  const remaining = getTimeRemaining(isMarching ? cmd.arrivesAt : cmd.returnsAt);
                  
                  return (
                    <div key={cmd.id} className={`bg-[#1c140d] border border-[#3e2c1e] border-l-[3px] p-2 text-xs rounded shadow-md relative ${isMarching ? 'border-l-red-600' : 'border-l-blue-500'}`}>
                      <div className="flex justify-between items-center text-amber-50 mb-1">
                        <span className="font-bold truncate uppercase tracking-wider text-[10px]">{isMarching ? (isScout ? '🕵️ Marching (Scout)' : '⚔️ Marching (Attack)') : '🏕️ Returning Home'}</span>
                        <span className="text-[#8c6239] font-mono text-[10px] font-bold">{cmd.targetX}|{cmd.targetY}</span>
                      </div>
                      <div className="flex justify-between font-mono items-end">
                        <span className="text-[#ffb700] font-bold text-sm tracking-wider drop-shadow-[0_0_2px_rgba(255,183,0,0.5)]">{formatTime(remaining)}</span>
                        {!isMarching && cmd.loot && (
                          <span className="text-[9px] text-[#a68c74] flex gap-1 bg-black/50 px-1 py-0.5 rounded border border-[#2e1f13]">
                            Loot: <span className="text-[#d18e47]">{cmd.loot.wood}</span>|<span className="text-[#e87046]">{cmd.loot.clay}</span>|<span className="text-[#c2c9d6]">{cmd.loot.iron}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incoming Battle Reports */}
          <div className="p-5 border-b border-[#333] bg-[#111] flex-1">
             <h3 className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-4 flex justify-between items-center">
               <span>Battle Reports Inbox</span>
               <Link href="/reports" className="text-[9px] text-amber-600 hover:text-amber-400 tracking-wider font-bold">VIEW ALL</Link>
             </h3>
             {state.reports.length === 0 ? (
                <div className="text-gray-600 text-[10px] text-center py-8">Inbox is empty.</div>
             ) : (
                <div className="flex flex-col gap-2">
                   {state.reports.slice(0, 10).map((rep) => (
                    <div 
                      key={rep.id} 
                      onClick={() => {
                        setSelectedReport(rep);
                        if (!rep.isRead) markReportAsRead(rep.id);
                      }}
                      className="bg-[#1a1a1b] hover:bg-[#222] cursor-pointer border border-[#333] p-2 rounded text-xs transition-colors flex items-center justify-between group relative overflow-hidden"
                    >
                       {!rep.isRead && (
                         <div className="absolute top-0 left-0 w-1 h-full bg-amber-600 z-10" />
                       )}
                       <div className="flex items-center gap-2">
                         <span className="text-lg">{rep.type === 'attack' ? '⚔️' : '🕵️'}</span>
                         <div>
                            <span className={`block font-bold capitalize tracking-wide ${rep.result === 'victory' ? 'text-green-500' : rep.result === 'defeat' ? 'text-red-500' : 'text-blue-500'}`}>
                              {rep.result}
                              {!rep.isRead && <span className="ml-2 text-[8px] bg-amber-600 text-black px-1 rounded animate-pulse shadow-sm">NEW</span>}
                            </span>
                            <span className="text-gray-500 font-mono text-[9px] block">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                         </div>
                       </div>
                       <span className="text-gray-400 font-mono text-[10px] group-hover:text-amber-500">{rep.targetX}|{rep.targetY}</span>
                    </div>
                  ))}
                </div>
             )}
          </div>

          {/* Training Queue (Moved to bottom of Military) */}
          <div className="p-5 bg-black/20 shrink-0 border-t border-[#333]">
            <h3 className="text-gray-500 uppercase tracking-widest text-[10px] font-bold mb-3 flex justify-between items-center">
               <span>Training Block</span>
               <span className="text-gray-400">{vRecruitment.length} active</span>
             </h3>
            
            {vRecruitment.length === 0 ? (
              <p className="text-gray-600 text-[10px] text-center border border-dashed border-[#444] py-3 rounded uppercase font-bold tracking-widest">No recruits</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {vRecruitment.map((r, idx) => {
                  const remaining = getTimeRemaining(r.completesAt);
                  const atlas = UNIT_ATLAS[r.unit];
                  return (
                    <div key={r.id} className={`bg-[#1e1e1e] border border-[#444] border-l-2 p-2 text-xs rounded flex items-center gap-2 ${idx === 0 ? 'border-l-green-500' : 'border-l-blue-600'}`}>
                      <span className="text-base">{UNIT_EMOJIS[r.unit as keyof typeof UNIT_EMOJIS]}</span>
                      <span className="text-[10px] text-gray-300 uppercase tracking-wider font-bold flex-1">{atlas.name}</span>
                      <span className={`font-mono text-[11px] font-bold ${idx === 0 ? 'text-green-400' : 'text-white'}`}>{formatTime(remaining)}</span>
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
