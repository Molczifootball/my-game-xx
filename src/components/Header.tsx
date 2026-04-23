"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/context/LanguageContext';
import UserOptionsModal from '@/components/UserOptionsModal';
import BugReportModal from '@/components/BugReportModal';

export default function Header() {
  const { t } = useTranslation();
  const { state, activeVillage, setActiveVillageId } = useGame();
  const { data: session } = useSession();
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const pathname = usePathname();
  const [showOptions, setShowOptions] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

  const seenCountRef = useRef<number>(state.reports.length);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pathname === '/reports') {
      seenCountRef.current = state.reports.length;
      setUnseenCount(0);
    }
  }, [pathname, state.reports.length]);

  useEffect(() => {
    const newUnseen = Math.max(0, state.reports.length - seenCountRef.current);
    if (pathname !== '/reports') setUnseenCount(newUnseen);
  }, [state.reports.length, pathname]);

  const playerVillages = state.worldMap.filter(t => t.owner === state.playerName);

  const navLinks = [
    { href: '/dashboard', label: t('ui.home') || 'Home', icon: '🏠' },
    { href: '/village', label: t('ui.village'), icon: '🏰' },
    { href: '/map', label: t('ui.map'), icon: '🗺️' },
    { href: '/reports', label: t('ui.reports'), icon: '📜', badge: unseenCount },
    { href: '/rankings', label: t('ui.rankings'), icon: '🏆' },
  ];

  return (
    <header className="w-full">
      <div className="bg-surface-low/95 backdrop-blur-xl px-4 lg:px-6 py-0 flex items-center justify-between border-b border-outline-variant shadow-[0_4px_20px_rgba(0,0,0,0.4)]">

        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Logo */}
          <Link href="/dashboard" className="group flex items-center gap-3 hover:brightness-110 transition-all py-1">
            {/* The Banner: Lechitic Shield with Eagle */}
            <div className="relative w-9 h-10 flex items-center justify-center">
              {/* Shield Shape */}
              <div 
                className="absolute inset-0 bg-red-800 border-2 border-primary shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)' }}
              ></div>
              {/* Eagle Icon */}
              <span className="relative z-10 text-xl filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] select-none translate-y-[-2px]">
                🦅
              </span>
            </div>
            
            {/* The Wordmark */}
            <div className="flex flex-col leading-none">
              <span className="text-primary font-bold medieval-font text-lg tracking-[0.18em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Lechia
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[7px] text-primary/40 font-bold tracking-[0.4em] uppercase">
                  Online
                </span>
                <span className="w-10 h-px bg-primary/20"></span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center">
            {navLinks.map(({ href, label, icon, badge }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 text-[9px] lg:text-[10px] font-bold uppercase tracking-widest transition-all border-b-2
                    ${isActive
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-600 hover:bg-white/[0.02]'
                    }`}
                >
                  <span className="text-sm hidden lg:inline">{icon}</span>
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[8px] font-bold rounded-full shadow-lg">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bug Report button — after Rankings */}
          <button
            onClick={() => setShowBugReport(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 text-[9px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-400 hover:bg-red-900/10 transition-all border-b-2 border-transparent"
          >
            <span className="text-sm hidden lg:inline">🐛</span>
            Bug
          </button>
        </div>

        {/* Center: Village Switcher */}
        {playerVillages.length > 1 && (
          <div className="hidden lg:flex items-center gap-2 mx-4">
            {playerVillages.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVillageId(v.id)}
                className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all whitespace-nowrap
                  ${state.activeVillageId === v.id
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'text-gray-400 hover:text-gray-400 hover:bg-white/5'}`}
              >
                {v.name} <span className="opacity-40">{v.x}|{v.y}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right: Time + Player + Dev */}
        <div className="flex items-center gap-3 shrink-0">
          {session?.user?.email === 'molczanpat@gmail.com' && (
            <Link
              href="/admin"
              className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-all
                ${pathname === '/admin'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-amber-600 hover:text-amber-400'
                }`}
            >
              👑 ADMIN
            </Link>
          )}

          <Link
            href="/dev"
            className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-all
              ${pathname === '/dev'
                ? 'text-purple-400 bg-purple-500/10'
                : 'text-gray-400 hover:text-purple-400'
              }`}
          >
            DEV
          </Link>

          <div className="w-px h-4 bg-outline-variant" />

          <span className="text-[10px] text-gray-400 font-mono tabular-nums">
            {serverTime.toLocaleTimeString()}
          </span>

          <div className="w-px h-4 bg-outline-variant" />

          <div className="flex items-center gap-2 text-[10px]">
            {/* Avatar with Golden Ring for Premium */}
            <div className={`relative p-[1.5px] rounded-full transition-all ${state.premiumUntil && state.premiumUntil > Date.now() ? 'bg-gradient-to-tr from-yellow-600 via-yellow-200 to-yellow-600 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : ''}`}>
              <button
                onClick={() => setShowOptions(true)}
                className="w-6 h-6 rounded-full bg-surface-highest hover:brightness-125 flex items-center justify-center text-primary text-xs font-bold transition-all relative overflow-hidden"
                title="Player Options"
              >
                {(session?.user?.name || state.playerName).charAt(0).toUpperCase()}
              </button>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-gray-300 font-bold truncate max-w-[100px] lg:max-w-none">
                  {session?.user?.name || state.playerName}
                </span>
                {state.premiumUntil && state.premiumUntil > Date.now() && (
                  <span className="text-xs animate-pulse" title="Premium Account">👑</span>
                )}
              </div>
              <button 
                onClick={() => setShowOptions(true)} 
                className="text-[8px] text-gray-500 hover:text-primary transition-colors text-left font-bold uppercase tracking-tighter"
              >
                {t('ui.settings')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showOptions && <UserOptionsModal onClose={() => setShowOptions(false)} />}
      {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}

      {/* Mobile village switcher */}
      {playerVillages.length > 1 && (
        <div className="lg:hidden bg-surface-dim px-4 py-1.5 border-b border-outline-variant flex items-center gap-2 overflow-x-auto no-scrollbar">
          {playerVillages.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveVillageId(v.id)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap transition-all
                ${state.activeVillageId === v.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-gray-400 hover:text-gray-400'}`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
