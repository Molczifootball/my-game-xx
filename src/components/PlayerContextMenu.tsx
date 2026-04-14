import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { useTranslation } from '@/context/LanguageContext';

interface Props {
  playerName: string;
  x: number;
  y: number;
  onClose: () => void;
  onNavigate?: (x: number, y: number) => void;
  onAttack?: (playerName: string) => void;
}

export default function PlayerContextMenu({ playerName, x, y, onClose, onNavigate, onAttack }: Props) {
  const { t } = useTranslation();
  const { state } = useGame();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Gather player stats from world map
  const playerTiles = state.worldMap.filter(t => t.owner === playerName && (t.type === 'player' || t.type === 'village'));
  const totalPoints = playerTiles.reduce((acc, t) => acc + (t.points || 0), 0);
  const villageCount = playerTiles.length;
  const isYou = playerName === state.playerName;

  // Find their capital (first village or highest point village)
  const capital = playerTiles.sort((a, b) => (b.points || 0) - (a.points || 0))[0];

  return (
    <div
      ref={ref}
      className="absolute z-[300] glass-panel border border-outline-variant rounded-lg shadow-2xl overflow-hidden w-52 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: y, left: x }}
    >
      {/* Player header */}
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-highest/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isYou ? '👑' : '⚔️'}</span>
          <div>
            <p className={`text-xs font-bold ${isYou ? 'text-primary' : 'text-white'} truncate`}>{playerName}</p>
            {isYou && <p className="text-[8px] text-primary/60 uppercase tracking-widest">{t('ui.village')}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="text-center">
            <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('ui.village')}s</p>
            <p className="text-sm font-bold text-white font-mono">{villageCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('common.points')}</p>
            <p className="text-sm font-bold text-primary font-mono">{totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="py-1">
        {capital && onNavigate && (
          <button
            onClick={() => { onNavigate(capital.x, capital.y); onClose(); }}
            className="w-full text-left px-4 py-2.5 text-[10px] text-gray-300 hover:bg-white/[0.05] hover:text-white transition-colors flex items-center gap-2.5 font-bold uppercase tracking-widest"
          >
            <span>🗺️</span> {t('ui.findOnMap')}
          </button>
        )}

        {!isYou && onAttack && (
          <button
            onClick={() => { onAttack(playerName); onClose(); }}
            className="w-full text-left px-4 py-2.5 text-[10px] text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-2.5 font-bold uppercase tracking-widest"
          >
            <span>⚔️</span> {t('ui.attackCapital')}
          </button>
        )}

        {!isYou && (
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2.5 text-[10px] text-gray-500 hover:bg-white/[0.03] transition-colors flex items-center gap-2.5 font-bold uppercase tracking-wider"
          >
            <span>📋</span> {t('ui.viewVillages')}
          </button>
        )}

        <div className="mx-3 my-1 border-t border-outline-variant/50" />

        <button
          onClick={onClose}
          className="w-full text-left px-4 py-2 text-[9px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-2"
        >
          ✕ {t('ui.close')}
        </button>
      </div>
    </div>
  );
}
