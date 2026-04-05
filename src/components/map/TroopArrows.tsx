"use client";

import { GameState, ActiveCommand, UNIT_ATLAS, Units } from '@/context/GameContext';

interface TroopArrowsProps {
  state: GameState;
  minX: number;
  minY: number;
  tileSize: number;
  viewportW: number;
  viewportH: number;
  visualMode: string;
}

export default function TroopArrows({ state, minX, minY, tileSize, viewportW, viewportH, visualMode }: TroopArrowsProps) {
  const gap = 2;
  const toPixel = (coord: number, min: number) => (coord - min) * (tileSize + gap) + (tileSize / 2) + gap;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="loot-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#fbbf24" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>
      {state.activeCommands.map((cmd: ActiveCommand) => {
        const now = Date.now();
        const duration = cmd.travelDurationMs;
        const elapsed = cmd.status === 'marching'
          ? now - (cmd.arrivesAt - duration)
          : now - (cmd.returnsAt - duration);
        const progress = Math.min(1, Math.max(0, elapsed / duration));

        let x1: number, y1: number, x2: number, y2: number;
        if (cmd.status === 'marching') {
          x1 = cmd.originX; y1 = cmd.originY; x2 = cmd.targetX; y2 = cmd.targetY;
        } else {
          x1 = cmd.targetX; y1 = cmd.targetY; x2 = cmd.originX; y2 = cmd.originY;
        }

        const curX = x1 + (x2 - x1) * progress;
        const curY = y1 + (y2 - y1) * progress;

        // Bounds check
        if (curX < minX - 1 || curX > minX + viewportW || curY < minY - 1 || curY > minY + viewportH) return null;

        const startPX = toPixel(x1, minX);
        const startPY = toPixel(y1, minY);
        const endPX = toPixel(x2, minX);
        const endPY = toPixel(y2, minY);
        const pxX = toPixel(curX, minX);
        const pxY = toPixel(curY, minY);

        // Bezier control point for curved path
        const midX = (startPX + endPX) / 2;
        const midY = (startPY + endPY) / 2;
        const dx = endPX - startPX;
        const dy = endPY - startPY;
        const offsetX = -dy * 0.15;
        const offsetY = dx * 0.15;
        const cpX = midX + offsetX;
        const cpY = midY + offsetY;

        // Unit count
        const unitCount = Object.values(cmd.units).reduce((a, c) => a + (c || 0), 0);

        const isReturning = cmd.status === 'returning';
        const hasLoot = isReturning && Object.values(cmd.loot).some(v => (v as number) > 0);
        const strokeColor = cmd.type === 'attack' ? '#00f2ff' : '#fbbf24';
        const strokeWidth = visualMode === 'tactical' ? 3 : 2;

        return (
          <g key={cmd.id} filter={hasLoot ? 'url(#loot-glow)' : 'url(#arrow-glow)'}>
            {/* Path line - bezier curve */}
            <path
              d={`M ${startPX} ${startPY} Q ${cpX} ${cpY} ${endPX} ${endPY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={isReturning ? '3 8' : '8 4'}
              opacity={isReturning ? 0.35 : 0.65}
              strokeLinecap="round"
            />

            {/* Moving unit icon */}
            <g transform={`translate(${pxX}, ${pxY})`}>
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                className={`select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,1)] ${visualMode === 'tactical' ? 'rotate-z-[45deg] rotate-x-[-45deg] scale-[1.5]' : ''}`}
                fontSize="22"
              >
                {hasLoot ? '💰' : (cmd.type === 'attack' ? '⚔️' : '🕵️')}
              </text>

              {/* Unit count badge */}
              {unitCount > 0 && (
                <g transform="translate(14, -12)">
                  <rect x="-2" y="-8" width={unitCount > 99 ? 28 : unitCount > 9 ? 22 : 16} height="14" rx="7" fill="rgba(0,0,0,0.8)" stroke={strokeColor} strokeWidth="0.5" />
                  <text x={unitCount > 99 ? 12 : unitCount > 9 ? 9 : 6} y="1" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {unitCount}
                  </text>
                </g>
              )}
            </g>

            {/* Gold particles trail for loot */}
            {hasLoot && [0.15, 0.35, 0.55].map((offset, i) => {
              const tp = Math.max(0, progress - offset * 0.3);
              if (tp <= 0) return null;
              const tx = x1 + (x2 - x1) * tp;
              const ty = y1 + (y2 - y1) * tp;
              const tpx = toPixel(tx, minX);
              const tpy = toPixel(ty, minY);
              return (
                <circle key={i} cx={tpx} cy={tpy} r={2 - i * 0.4} fill="#fbbf24" opacity={0.4 - i * 0.1}>
                  <animate attributeName="opacity" values={`${0.4 - i * 0.1};0;${0.4 - i * 0.1}`} dur="2s" repeatCount="indefinite" />
                </circle>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
