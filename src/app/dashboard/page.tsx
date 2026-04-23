"use client";

import { useGame } from '@/context/GameContext';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/context/LanguageContext';
import Link from 'next/link';
import { calculatePoints, Buildings, getCurrentPopulation, getMaxPopulation } from '@/utils/shared';
import { Crown, Scroll, Sparkles, Shield, Map as MapIcon, Sword, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { state, activeVillage } = useGame();

  const playerName = session?.user?.name || state.playerName || 'Lord';
  const playerVillages = state.worldMap.filter(t => t.owner === state.playerName);
  const totalPoints = playerVillages.reduce((sum, v) => sum + calculatePoints(v.buildings as Buildings), 0);
  const unreadReports = state.reports.filter(r => !r.isRead).length;

  const isPremium = state.premiumUntil && state.premiumUntil > Date.now();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d0a06]">
      {/* Subtle background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Welcome Banner */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold medieval-font text-white tracking-wider">
              Welcome back, <span className="text-primary">{playerName}</span>
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-bold">
              {totalPoints.toLocaleString()} points · {playerVillages.length} village{playerVillages.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Premium Active</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Villages" value={playerVillages.length} icon="🏰" />
          <StatCard label="Total Points" value={totalPoints.toLocaleString()} icon="⭐" />
          <StatCard label="Active Commands" value={state.activeCommands.filter(c => playerVillages.some(v => `${v.x}|${v.y}` === `${c.originX}|${c.originY}`)).length} icon="⚔️" />
          <StatCard label="Unread Reports" value={unreadReports} icon="📜" highlight={unreadReports > 0} />
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-3">
          <QuickNav href="/village" icon={<Shield className="w-5 h-5 text-primary" />} label="Village" desc="Build & recruit" />
          <QuickNav href="/map" icon={<MapIcon className="w-5 h-5 text-primary" />} label="World Map" desc="Explore & attack" />
          <QuickNav href="/reports" icon={<Sword className="w-5 h-5 text-primary" />} label="Reports" desc={`${unreadReports} unread`} />
        </div>

        {/* Two-Column: News + Premium */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Latest Updates */}
          <div className="sovereign-panel border-outline-variant p-5 bg-surface-base/40 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-5">
              <Scroll className="text-primary w-5 h-5" />
              <h2 className="text-sm font-bold medieval-font uppercase tracking-widest text-white">Latest Updates</h2>
            </div>

            <div className="space-y-4">
              <NewsItem
                date="2026-04-23"
                title="v1.1.0 — SSL & Stability Update"
                desc="Fixed database connectivity issues, enabled Row Level Security across all tables, and improved deployment pipeline."
                isNew
              />
              <NewsItem
                date="2026-04-14"
                title="Database Migration Complete"
                desc="Successfully migrated to Supabase for infinite scaling and zero-lag experience."
              />
              <NewsItem
                date="2026-04-10"
                title="Welcome Page v1.1 Deployment"
                desc="New landing page for Lechia Online. Recruitment is now open for all frontier lords."
              />
              <NewsItem
                date="2026-04-05"
                title="The Brotherhood Rises"
                desc="Pre-registration gifts are being distributed. Check your barracks for veteran units."
              />
            </div>
          </div>

          {/* Premium Promo */}
          <div className="sovereign-panel border-primary/20 p-5 bg-black/60 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Limited Offer</span>
              </div>
              <h2 className="text-2xl font-bold medieval-font uppercase tracking-widest text-primary mb-2">
                Sovereign Pass
              </h2>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed italic">
                Unlock exclusive nobleman benefits and dominate the realm with superior intelligence.
              </p>

              <ul className="space-y-3 mb-6">
                <PremiumFeature text="Instant construction queue overview" />
                <PremiumFeature text="Global production statistics" />
                <PremiumFeature text="Exclusive 'Sovereign' name color" />
                <PremiumFeature text="Dynamic map filters and alerts" />
                <PremiumFeature text="Priority support & early access" />
              </ul>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-gray-500 line-through text-sm">9.99€/mo</span>
                <span className="text-primary text-2xl font-black">4.99€<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[9px] text-red-400 font-bold uppercase">-50%</span>
              </div>

              <button className="w-full py-3 bg-primary text-black font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:scale-[1.02] transition-all active:scale-[0.98]">
                Go Premium Now
              </button>
              <p className="text-[9px] text-gray-600 text-center mt-2">Cancel anytime · No commitment</p>
            </div>
          </div>
        </div>

        {/* Active Village Quick View */}
        {activeVillage && (
          <div className="sovereign-panel border-outline-variant p-5 bg-surface-base/40 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold medieval-font uppercase tracking-widest text-white">
                🏰 {activeVillage.name} <span className="text-gray-500 font-mono text-[10px]">({activeVillage.x}|{activeVillage.y})</span>
              </h2>
              <Link href="/village" className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase tracking-widest hover:underline">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <MiniStat label="Points" value={calculatePoints(activeVillage.buildings as Buildings).toLocaleString()} />
              <MiniStat label="Population" value={`${getCurrentPopulation(activeVillage.units || {}, activeVillage.recruitment)}/${getMaxPopulation((activeVillage.buildings as Buildings)?.residence || 0)}`} />
              <MiniStat label="Build Queue" value={`${(activeVillage.upgrades || []).length}/3`} />
              <MiniStat label="Wood/Clay/Iron" value={`${Math.floor(activeVillage.resources?.wood || 0)}/${Math.floor(activeVillage.resources?.clay || 0)}/${Math.floor(activeVillage.resources?.iron || 0)}`} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-surface-base/60 border border-outline-variant rounded-lg p-3 backdrop-blur-sm ${highlight ? 'border-primary/30' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{label}</span>
      </div>
      <span className={`text-xl font-bold font-mono ${highlight ? 'text-primary' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function QuickNav({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href} className="group bg-surface-base/40 border border-outline-variant rounded-lg p-4 hover:border-primary/30 hover:bg-primary/5 transition-all backdrop-blur-sm">
      <div className="mb-2 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{label}</h3>
      <p className="text-[10px] text-gray-500">{desc}</p>
    </Link>
  );
}

function NewsItem({ date, title, desc, isNew }: { date: string; title: string; desc: string; isNew?: boolean }) {
  return (
    <div className="border-l-2 border-primary/20 pl-4 group cursor-default">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black tracking-widest text-primary">{date}</span>
        {isNew && <span className="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[7px] text-green-400 font-bold uppercase">New</span>}
      </div>
      <h4 className="text-white text-sm font-bold mb-0.5 group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-[11px] text-on-surface-variant/60 leading-normal">{desc}</p>
    </div>
  );
}

function PremiumFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-on-surface-variant/90 font-medium">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      {text}
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded p-2">
      <div className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">{label}</div>
      <div className="text-xs text-gray-200 font-mono font-bold truncate">{value}</div>
    </div>
  );
}
