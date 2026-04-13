"use client";

import { useGame, BattleReport } from '@/context/GameContext';
import { useState, useMemo } from 'react';
import { UNIT_EMOJIS, BUILDING_META, Units, Buildings, UNIT_ATLAS } from '@/utils/shared';

const UNIT_KEYS: (keyof Units)[] = [
  'pikeman', 'swordman', 'axeman', 'archer', 'scout',
  'lightCavalry', 'heavyCavalry', 'horseArcher', 'knight', 'nobleman'
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ReportsPage() {
  const { state, markReportAsRead } = useGame();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'attack' | 'scout' | 'incoming'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'target'>('newest');
  const [mobileDetail, setMobileDetail] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const reports = state.reports;
    let attacks = 0, scouts = 0, victories = 0, incoming = 0;
    let lootW = 0, lootC = 0, lootI = 0, totalLosses = 0;
    for (const r of reports) {
      if (r.direction === 'incoming') { incoming++; }
      else if (r.type === 'attack') { attacks++; if (r.result === 'victory') victories++; }
      else scouts++;
      lootW += r.loot.wood; lootC += r.loot.clay; lootI += r.loot.iron;
      if (r.attackerLosses) {
        Object.values(r.attackerLosses).forEach(v => { totalLosses += (v as number) || 0; });
      }
    }
    return { total: reports.length, attacks, scouts, victories, incoming, victoryRate: attacks > 0 ? Math.round((victories / attacks) * 100) : 0, lootW, lootC, lootI, totalLosses };
  }, [state.reports]);

  // Filtered + sorted
  const filteredReports = useMemo(() => {
    let list = state.reports;
    if (filter === 'incoming') list = list.filter(r => r.direction === 'incoming');
    else if (filter === 'attack') list = list.filter(r => r.type === 'attack' && r.direction !== 'incoming');
    else if (filter === 'scout') list = list.filter(r => r.type === 'scout');
    if (sort === 'oldest') list = [...list].reverse();
    if (sort === 'target') list = [...list].sort((a, b) => a.targetName.localeCompare(b.targetName));
    return list;
  }, [state.reports, filter, sort]);

  const selectedReport = state.reports.find(r => r.id === selectedReportId);

  const selectReport = (id: string, isRead: boolean) => {
    setSelectedReportId(id);
    setMobileDetail(true);
    if (!isRead) markReportAsRead(id);
  };

  const markAllRead = () => {
    state.reports.forEach(r => { if (!r.isRead) markReportAsRead(r.id); });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-surface-dim">

      {/* ── 1. STATS DASHBOARD ── */}
      <div className="shrink-0 px-6 py-4 border-b border-outline-variant bg-surface-low">
        <div className="flex items-center justify-between">
          <h1 className="text-lg text-white font-bold medieval-font tracking-widest uppercase">Military Archives</h1>
          <span className="text-[9px] text-gray-500 font-mono">{stats.total} operations</span>
        </div>
      </div>

      {/* ── 2. FILTER BAR ── */}
      {stats.total > 0 && (
        <div className="shrink-0 px-6 py-2.5 border-b border-outline-variant bg-surface-base flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['all', 'attack', 'scout', 'incoming'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-all border ${filter === f ? 'bg-primary/20 text-primary border-primary/40' : 'text-gray-500 border-outline-variant hover:text-primary hover:border-primary/30'}`}>
                {f === 'all' ? `All (${stats.total})` : f === 'attack' ? `⚔️ Attacks (${stats.attacks})` : f === 'scout' ? `🕵️ Scouts (${stats.scouts})` : `🛡️ Incoming (${stats.incoming})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="text-[9px] bg-surface-highest text-gray-400 border border-outline-variant rounded px-2 py-1 outline-none font-bold uppercase tracking-wider cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="target">By Target</option>
            </select>
            <button onClick={markAllRead} className="text-[9px] text-gray-500 hover:text-primary font-bold uppercase tracking-widest transition-colors">Mark all read</button>
          </div>
        </div>
      )}

      {/* ── 3. SPLIT PANEL ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Report List */}
        <div className={`${selectedReport && mobileDetail ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[40%] border-r border-outline-variant overflow-y-auto custom-scrollbar`}>
          {filteredReports.length === 0 ? (
            <EmptyState hasReports={stats.total > 0} />
          ) : (
            filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => selectReport(report.id, report.isRead)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b border-outline-variant/50 border-l-[3px] hover:bg-surface-high group
                  ${selectedReportId === report.id ? 'bg-surface-high border-l-primary' : report.direction === 'incoming' ? 'border-l-orange-500/40' : report.type === 'attack' ? 'border-l-red-500/40' : 'border-l-blue-500/40'}
                  ${!report.isRead ? 'bg-surface-base' : ''}
                `}
              >
                {/* Unread dot */}
                <div className="w-2 shrink-0">
                  {!report.isRead && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>

                {/* Icon */}
                <span className={`text-xl shrink-0 ${report.isRead ? 'opacity-40' : ''}`}>
                  {report.direction === 'incoming' ? '🛡️' : report.type === 'attack' ? '⚔️' : '🕵️'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${report.result === 'victory' ? 'text-emerald-400' : report.result === 'defeat' ? 'text-red-400' : 'text-blue-400'}`}>
                      {report.result}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">{timeAgo(report.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-bold truncate">{report.targetName}</span>
                    <span className="text-[9px] text-gray-600 font-mono shrink-0">{report.targetX}|{report.targetY}</span>
                  </div>
                  {/* Loot preview for attacks */}
                  {report.type === 'attack' && (report.loot.wood + report.loot.clay + report.loot.iron) > 0 && (
                    <div className="flex gap-2 mt-1 text-[8px] font-mono text-gray-600">
                      <span className="text-wood">{report.loot.wood}</span>
                      <span className="text-clay">{report.loot.clay}</span>
                      <span className="text-iron">{report.loot.iron}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Report Detail */}
        <div className={`${selectedReport && mobileDetail ? 'flex' : 'hidden md:flex'} flex-col flex-1 overflow-y-auto custom-scrollbar`}>
          {selectedReport ? (
            <div className="p-4">
              {/* Mobile back button */}
              <button onClick={() => setMobileDetail(false)} className="md:hidden text-[10px] text-primary font-bold uppercase tracking-widest mb-4">← Back to list</button>
              <ReportDetail report={selectedReport} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl opacity-20 block mb-3">📜</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Select a report to view details</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-black/30 border border-outline-variant rounded px-3 py-2 text-center">
      <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">{label}</span>
      <span className={`text-sm font-mono font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
      {sub && <span className="text-[8px] text-gray-600 block">{sub}</span>}
    </div>
  );
}

/* ── EMPTY STATE ── */
function EmptyState({ hasReports }: { hasReports: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <span className="text-5xl opacity-20 block mb-4">⚔️</span>
        <h2 className="text-sm font-bold medieval-font text-[#8c6239] tracking-widest mb-2 uppercase">
          {hasReports ? 'No matching reports' : 'The War Scrolls Are Empty'}
        </h2>
        <p className="text-gray-600 text-[10px] font-mono max-w-xs">
          {hasReports ? 'Try changing your filter settings.' : 'Dispatch armies from the World Map to start writing history.'}
        </p>
      </div>
    </div>
  );
}

/* ── REPORT DETAIL ── */
function ReportDetail({ report }: { report: BattleReport }) {
  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-outline-variant">
        <span className="text-2xl">{report.direction === 'incoming' ? '🛡️' : report.type === 'attack' ? '⚔️' : '🕵️'}</span>
        <div>
          <h2 className="text-sm text-white font-bold medieval-font tracking-widest uppercase">
            {report.direction === 'incoming'
              ? (report.result === 'victory' ? 'Village Defended' : 'Village Raided')
              : (report.type === 'attack' ? 'Assault Report' : 'Intelligence Summary')
            }
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            {report.direction === 'incoming' && (
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">Incoming</span>
            )}
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${report.result === 'victory' ? 'bg-emerald-500/15 text-emerald-400' : report.result === 'defeat' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
              {report.direction === 'incoming' ? (report.result === 'victory' ? 'Defended' : 'Pillaged') : report.result}
            </span>
            <span className="text-[8px] text-gray-500 font-mono">{new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Origin + Target info */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/30 border border-outline-variant px-2 py-1.5 rounded">
          <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">
            {report.direction === 'incoming' ? 'Attacker' : 'From'}
          </span>
          <span className={`text-[10px] font-bold ${report.direction === 'incoming' ? 'text-red-400' : 'text-blue-400'}`}>
            {report.direction === 'incoming' ? (report.attackerName || 'Barbarian') : (report.originName || '—')}
          </span>
          {report.originX && <span className="text-[8px] text-gray-500 font-mono block">{report.originX}|{report.originY}</span>}
        </div>
        <div className="bg-black/30 border border-outline-variant px-2 py-1.5 rounded">
          <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">
            {report.direction === 'incoming' ? 'Your Village' : 'Target'}
          </span>
          <span className={`text-[10px] font-bold ${report.direction === 'incoming' ? 'text-blue-400' : 'text-red-400'}`}>{report.targetName}</span>
        </div>
        <div className="bg-black/30 border border-outline-variant px-2 py-1.5 rounded">
          <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold block">Coordinates</span>
          <span className="text-[10px] text-primary font-mono font-bold">{report.targetX}|{report.targetY}</span>
        </div>
      </div>

      {/* ── SCOUT REPORT ── */}
      {report.type === 'scout' && report.targetResources && (
        <>
          {/* Resources with bars */}
          <div className="bg-black/20 border border-outline-variant rounded p-2.5">
            <h3 className="text-[9px] text-primary/70 font-bold uppercase tracking-[0.2em] mb-1.5">Resources</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { label: '🪵 Wood', value: Math.floor(report.targetResources.wood), color: 'bg-wood', textColor: 'text-wood' },
                { label: '🧱 Clay', value: Math.floor(report.targetResources.clay), color: 'bg-clay', textColor: 'text-clay' },
                { label: '⛏️ Iron', value: Math.floor(report.targetResources.iron), color: 'bg-iron', textColor: 'text-iron' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className={`text-[10px] ${r.textColor} font-bold w-20`}>{r.label}</span>
                  <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${Math.min(100, (r.value / 10000) * 100)}%` }} />
                  </div>
                  <span className={`text-[10px] ${r.textColor} font-mono font-bold w-16 text-right`}>{r.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Garrison */}
          <div className="bg-black/20 border border-outline-variant rounded p-2.5">
            <h3 className="text-[9px] text-primary/70 font-bold uppercase tracking-[0.2em] mb-1.5">Garrison</h3>
            {report.targetUnits && Object.entries(report.targetUnits).some(([, v]) => (v as number) > 0) ? (
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(report.targetUnits).filter(([, v]) => (v as number) > 0).map(([u, v]) => (
                  <div key={u} className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded border border-outline-variant">
                    <span className="text-sm">{UNIT_EMOJIS[u]}</span>
                    <span className="text-[10px] text-gray-400 flex-1">{UNIT_ATLAS[u as keyof Units].name}</span>
                    <span className="text-[10px] text-amber-100 font-mono font-bold">{v as number}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-gray-600 italic">No garrison detected</span>
            )}
          </div>

          {/* Buildings */}
          {report.targetBuildings && (
            <div className="bg-black/20 border border-outline-variant rounded p-2.5">
              <h3 className="text-[9px] text-primary/70 font-bold uppercase tracking-[0.2em] mb-1.5">Buildings</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(report.targetBuildings).map(([b, l]) => (
                  <div key={b} className="flex items-center justify-between bg-black/30 px-2.5 py-1.5 rounded border border-outline-variant">
                    <span className="text-[10px] text-gray-400">{BUILDING_META[b as keyof Buildings].name}</span>
                    <span className="text-[10px] text-primary font-mono font-bold">Lv.{l as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ATTACK REPORT ── */}
      {report.type === 'attack' && (
        <>
          {/* Forces comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Attacker */}
            <div className="bg-black/20 border border-outline-variant rounded p-2.5">
              <h3 className="text-[9px] text-blue-400/70 font-bold uppercase tracking-[0.2em] mb-1.5">
                {report.direction === 'incoming' ? `⚔️ ${report.attackerName || 'Barbarian'} Forces` : '🛡️ Your Forces'}
              </h3>
              <div className="flex flex-col gap-1">
                {UNIT_KEYS.filter(u => (report.attackerUnits?.[u] || 0) > 0).map(u => {
                  const sent = report.attackerUnits?.[u] || 0;
                  const lost = report.attackerLosses?.[u] || 0;
                  const survived = sent - lost;
                  return (
                    <div key={u} className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-sm w-5">{UNIT_EMOJIS[u]}</span>
                      <span className="text-gray-500 flex-1">{UNIT_ATLAS[u].name}</span>
                      <span className="text-green-400 font-mono font-bold w-6 text-right">{survived}</span>
                      {lost > 0 && <span className="text-red-400 font-mono text-[9px] w-8 text-right">-{lost}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Defender */}
            <div className="bg-black/20 border border-outline-variant rounded p-2.5">
              <h3 className="text-[9px] text-red-400/70 font-bold uppercase tracking-[0.2em] mb-1.5">
                {report.direction === 'incoming' ? '🛡️ Your Defense' : '🏯 Defender'}
              </h3>
              {report.defenderUnits && Object.entries(report.defenderUnits).some(([, v]) => (v as number) > 0) ? (
                <div className="flex flex-col gap-1">
                  {UNIT_KEYS.filter(u => (report.defenderUnits?.[u] || 0) > 0).map(u => {
                    const had = report.defenderUnits?.[u] || 0;
                    const lost = report.defenderLosses?.[u] || 0;
                    const survived = Math.max(0, had - lost);
                    return (
                      <div key={u} className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-sm w-5">{UNIT_EMOJIS[u]}</span>
                        <span className="text-gray-500 flex-1">{UNIT_ATLAS[u].name}</span>
                        <span className={`font-mono font-bold w-6 text-right ${survived > 0 ? 'text-green-400' : 'text-red-400'}`}>{survived}</span>
                        {lost > 0 && <span className="text-red-400 font-mono text-[9px] w-8 text-right">-{lost}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[10px] text-gray-600 italic">No resistance</span>
              )}
            </div>
          </div>

          {/* Loot */}
          {(report.loot.wood + report.loot.clay + report.loot.iron) > 0 && (
            <div className="bg-amber-900/10 border border-amber-900/30 rounded px-2.5 py-1.5">
              <h3 className="text-[8px] text-amber-400/70 font-bold uppercase tracking-widest mb-1">Loot</h3>
              <div className="flex gap-3 text-[10px] font-mono font-bold justify-center">
                <span className="text-wood">🪵 {report.loot.wood.toLocaleString()}</span>
                <span className="text-clay">🧱 {report.loot.clay.toLocaleString()}</span>
                <span className="text-iron">⛏️ {report.loot.iron.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Endorsement drop */}
          {report.endorsementDrop && report.endorsementDrop > 0 && (
            <div className="bg-purple-900/10 border border-purple-500/30 rounded px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[9px] text-purple-400/70 font-bold uppercase">👑 Endorsement</span>
              <span className="text-sm text-purple-400 font-mono font-bold">-{report.endorsementDrop}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
