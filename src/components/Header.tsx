"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGame } from '@/context/GameContext';

export default function Header() {
  const { state, activeVillage, setActiveVillageId } = useGame();
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const pathname = usePathname();

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
    { href: '/', label: 'Village View' },
    { href: '/map', label: 'World Map' },
    { href: '/reports', label: 'Reports', badge: unseenCount },
    { href: '/rankings', label: 'Rankings' },
  ];

  return (
    <header className="w-full flex flex-col z-50 sticky top-0 shadow-2xl">
      <div className="glass-panel px-6 py-4 flex flex-col lg:flex-row gap-4 justify-between items-center text-sm border-b border-[#3e2c1e] drop-shadow-md">
        
        <div className="flex gap-8 items-center flex-1 w-full lg:w-auto">
          <div className="text-[#ffb700] font-bold medieval-font text-2xl lg:text-3xl mr-4 tracking-widest drop-shadow-[0_2px_10px_rgba(255,183,0,0.3)] filter contrast-125 shrink-0">
            Tribal Wars
          </div>
          
          <nav className="flex gap-2 lg:gap-4 uppercase tracking-widest font-bold text-[10px] lg:text-xs overflow-x-auto no-scrollbar py-1">
            {navLinks.map(({ href, label, badge }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative transition-all py-2 px-3 rounded flex items-center gap-2 whitespace-nowrap
                    ${isActive
                      ? 'text-amber-50 bg-[#3e2c1e] shadow-inner border border-[#523b28]'
                      : 'text-[#8c6239] hover:text-[#ffb700] hover:bg-black/20'
                    }`}
                >
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-red-600 text-white text-[9px] font-bold rounded-full shadow-lg animate-bounce">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* New Village Switcher Section */}
          <div className="hidden xl:flex items-center gap-2 border-l border-[#3e2c1e] pl-6 ml-2 overflow-hidden">
             <span className="text-[10px] text-[#8c6239] font-bold uppercase tracking-widest shrink-0">Your Villages:</span>
             <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[400px]">
                {playerVillages.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVillageId(v.id)}
                    className={`px-3 py-1.5 rounded border transition-all text-[10px] font-bold whitespace-nowrap
                      ${state.activeVillageId === v.id 
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                        : 'bg-black/20 border-[#3e2c1e] text-[#8c6239] hover:border-[#523b28] hover:text-amber-700'}`}
                  >
                    {v.name} <span className="opacity-50 ml-1">({v.x}|{v.y})</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="flex gap-4 lg:gap-6 items-center text-xs tracking-wider shrink-0">
          <Link 
            href="/dev" 
            className={`flex items-center gap-2 py-2 px-3 rounded transition-all font-bold uppercase tracking-widest text-[10px]
              ${pathname === '/dev' 
                ? 'text-purple-400 bg-purple-900/20 border border-purple-500/30' 
                : 'text-[#8c6239] hover:text-purple-400 hover:bg-purple-900/10'
              }`}
          >
            🛠️ DEV
          </Link>
          
          <div className="text-[#8c6239] font-mono font-bold tracking-widest">
            {serverTime.toLocaleTimeString()}
          </div>
          
          <div className="text-[#d18e47] font-bold flex items-center gap-2 bg-black/50 px-4 py-2 rounded border border-[#3e2c1e] shadow-inner">
            <span className="opacity-70">🧑‍🌾</span> <span className="text-amber-50">{state.playerName}</span>
          </div>
        </div>
      </div>

      {/* Sub-header for Mobile Village Switcher (When multiple owned) */}
      {playerVillages.length > 1 && (
        <div className="xl:hidden sovereign-panel px-6 py-2 border-b border-[#3e2c1e] flex items-center gap-3 overflow-x-auto no-scrollbar">
           <span className="text-[9px] text-[#8c6239] font-bold uppercase tracking-tighter shrink-0">Empire:</span>
           {playerVillages.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveVillageId(v.id)}
                className={`px-2 py-1 rounded border transition-all text-[9px] font-bold whitespace-nowrap
                  ${state.activeVillageId === v.id 
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400' 
                    : 'bg-black/20 border-[#3e2c1e] text-[#8c6239]'}`}
              >
                {v.name} ({v.x}|{v.y})
              </button>
            ))}
        </div>
      )}
    </header>
  );
}
