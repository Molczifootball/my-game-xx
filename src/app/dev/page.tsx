"use client";

import { useGame } from '@/context/GameContext';
import Link from 'next/link';
import DevTools from './DevTools';

export default function DevDashboard() {
  return (
    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#0a0a0a] text-gray-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-12 border-b border-[#2e1f13] pb-6">
          <div>
            <h1 className="text-4xl text-[#ffb700] medieval-font mb-2 drop-shadow-lg">Developer Command Center</h1>
            <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Administrator Level Access Only</p>
          </div>
          <Link href="/" className="text-xs text-amber-600 hover:text-amber-400 font-bold uppercase tracking-widest transition-colors mb-2">
            Back to Village &rarr;
          </Link>
        </div>

        <DevTools />

      </div>
    </div>
  );
}
