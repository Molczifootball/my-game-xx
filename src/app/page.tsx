"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { 
  Shield, 
  Map as MapIcon, 
  Sword, 
  Crown, 
  Scroll, 
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const { t } = useTranslation();
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-[#0a0806] text-amber-50 selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <Image 
          src="/slavic_medieval_background_1776102704338.png"
          alt="Medieval World"
          fill
          className="object-cover opacity-40 mix-blend-luminosity scale-110 animate-slow-zoom"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0806]/80 via-transparent to-[#0a0806]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]">
            <Crown className="text-primary w-6 h-6" />
          </div>
          <span className="text-2xl font-bold medieval-font tracking-widest uppercase text-white drop-shadow-lg">
            Lechia <span className="text-primary">Online</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="hidden md:block px-6 py-2 text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:text-white transition-all"
          >
            {t('landing.cta_login')}
          </Link>
          <Link 
            href="/register" 
            className="sovereign-panel-compact bg-primary/10 border-primary/40 hover:bg-primary/20 hover:scale-105 transition-all px-6 py-2 text-xs font-bold uppercase tracking-widest text-primary shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            {t('landing.cta_play')}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 flex flex-col items-center text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-8 animate-fade-in shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
          <Sparkles className="w-3 h-3" />
          <span>v1.1 Awakening – New Frontier Awaits</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black medieval-font uppercase tracking-tight text-white mb-6 leading-[0.9] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          {t('landing.hero_title')}
        </h1>
        
        <p className="text-lg md:text-xl text-on-surface-variant/80 max-w-2xl mb-12 font-medium tracking-wide">
          {t('landing.hero_subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
          <Link 
            href="/register" 
            className="group relative px-10 py-5 bg-primary text-black font-black uppercase tracking-[0.15em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {t('landing.cta_register')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Link>
          
          <Link 
            href="/login" 
            className="px-10 py-5 bg-surface-base border border-outline-variant hover:border-primary/50 text-white font-bold uppercase tracking-[0.15em] backdrop-blur-md transition-all flex items-center justify-center"
          >
            {t('landing.cta_login')}
          </Link>
        </div>
        
        {/* Statistics or Social Proof */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-white/5 pt-12 w-full">
          <div>
            <div className="text-3xl font-bold medieval-font text-white">4.2k+</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-black mt-1">Lords Online</div>
          </div>
          <div>
            <div className="text-3xl font-bold medieval-font text-white">128k+</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-black mt-1">Battles Fought</div>
          </div>
          <div>
            <div className="text-3xl font-bold medieval-font text-white">15.5k</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-black mt-1">Villages Sacked</div>
          </div>
          <div>
            <div className="text-3xl font-bold medieval-font text-white">v1.1</div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-black mt-1">Current Version</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-32 bg-[#0d0a08]/80 backdrop-blur-md border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold medieval-font uppercase tracking-widest text-white mb-4">
              {t('landing.features_title')}
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-primary" />}
              title={t('landing.feature_1_title')}
              desc={t('landing.feature_1_desc')}
            />
            <FeatureCard 
              icon={<MapIcon className="w-8 h-8 text-primary" />}
              title={t('landing.feature_2_title')}
              desc={t('landing.feature_2_desc')}
            />
            <FeatureCard 
              icon={<Sword className="w-8 h-8 text-primary" />}
              title={t('landing.feature_3_title')}
              desc={t('landing.feature_3_desc')}
            />
          </div>
        </div>
      </section>

      {/* News & Premium Section */}
      <section className="relative z-10 px-6 py-32 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        {/* News */}
        <div className="sovereign-panel border-outline-variant p-8 bg-surface-base/40 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8">
            <Scroll className="text-primary w-6 h-6" />
            <h3 className="text-xl font-bold medieval-font uppercase tracking-widest text-white">
              {t('landing.announcements_title')}
            </h3>
          </div>
          
          <div className="space-y-6">
            <NewsItem 
              date="2026-04-14" 
              title="Database Migration Complete" 
              desc="We've successfully moved to Supabase infrastructure to ensure infinite scaling and zero-lag experience." 
            />
            <NewsItem 
              date="2026-04-10" 
              title="Welcome Page v1.1 Deployment" 
              desc="Presenting the new face of Lechia Online to the world. Recruitment is now open for all frontier lords." 
            />
            <NewsItem 
              date="2026-04-05" 
              title="The Brotherhood Rises" 
              desc="Pre-registration gifts are being distributed. Check your barracks for the veteran units." 
            />
          </div>
        </div>

        {/* Premium Section */}
        <div className="sovereign-panel border-primary/20 p-8 bg-black/60 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold medieval-font uppercase tracking-widest text-primary mb-4">
              {t('landing.premium_title')}
            </h3>
            <p className="text-on-surface-variant mb-10 leading-relaxed italic">
              {t('landing.premium_desc')}
            </p>
            
            <ul className="space-y-4 mb-10">
              <PremiumFeature text="Instant construction queue overview" />
              <PremiumFeature text="Global production statistics" />
              <PremiumFeature text="Exclusive 'Sovereign' name color" />
              <PremiumFeature text="Dynamic map filters and alerts" />
            </ul>

            <button className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:scale-105 transition-all">
              Go Premium Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 text-center">
        <div className="flex justify-center gap-8 mb-8">
          <Link href="/terms" className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-white transition-colors">{t('ui.terms')}</Link>
          <Link href="/privacy" className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-white transition-colors">{t('ui.privacy')}</Link>
        </div>
        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest opacity-50">
          Property of <span className="text-primary/70">Malachite Software</span> © 2026
        </p>
      </footer>

      <style jsx global>{`
        @keyframes slow-zoom {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 30s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="sovereign-panel-compact p-8 border-outline-variant hover:border-primary/30 transition-all hover:-translate-y-2 bg-[#111] group">
      <div className="mb-6 bg-white/5 p-4 rounded-xl inline-block group-hover:bg-primary/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold medieval-font text-white mb-3 tracking-wider">{title}</h3>
      <p className="text-sm text-on-surface-variant/70 leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  );
}

function NewsItem({ date, title, desc }: { date: string, title: string, desc: string }) {
  return (
    <div className="border-l-2 border-primary/20 pl-6 group cursor-default">
      <div className="text-[9px] font-black tracking-widest text-primary mb-1">{date}</div>
      <h4 className="text-white font-bold mb-1 group-hover:text-primary transition-colors">{title}</h4>
      <p className="text-[11px] text-on-surface-variant/60 leading-normal">{desc}</p>
    </div>
  );
}

function PremiumFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-on-surface-variant/90 font-medium">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      {text}
    </li>
  );
}
