"use client";

import { useRef, useEffect, useCallback } from 'react';
import { GameState, ActiveCommand } from '@/context/GameContext';
import { UNIT_ATLAS, Units } from '@/utils/shared';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);
  // Stable refs for latest props so the rAF loop always reads current values
  const stateRef = useRef(state);
  const viewRef = useRef({ minX, minY, tileSize, viewportW, viewportH, visualMode });

  stateRef.current = state;
  viewRef.current = { minX, minY, tileSize, viewportW, viewportH, visualMode };

  const toPixel = useCallback((coord: number, min: number, ts: number) =>
    (coord - min) * ts + ts / 2, []);

  // Precompute which commands are visible (changes only on state update, not every frame)
  const getVisibleCommands = useCallback(() => {
    const s = stateRef.current;
    const playerVillages = s.worldMap.filter(t => t.owner === s.playerName);
    return s.activeCommands.filter((cmd: ActiveCommand) => {
      const isPlayerOrigin = playerVillages.some(t => t.x === cmd.originX && t.y === cmd.originY);
      const isIncomingToPlayer = cmd.status === 'marching' && playerVillages.some(t => t.x === cmd.targetX && t.y === cmd.targetY);
      return isPlayerOrigin || isIncomingToPlayer;
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Create the static defs once
    svg.innerHTML = `
      <defs>
        <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="loot-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feFlood flood-color="#fbbf24" flood-opacity="0.4" result="color"/>
          <feComposite in="color" in2="blur" operator="in" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>
      <g id="arrows-group"></g>
    `;

    const group = svg.querySelector('#arrows-group')!;

    const animate = () => {
      const now = Date.now();
      const v = viewRef.current;
      const commands = getVisibleCommands();

      // Clear and rebuild (fast for small number of commands)
      group.innerHTML = '';

      for (const cmd of commands) {
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
        if (curX < v.minX - 1 || curX > v.minX + v.viewportW || curY < v.minY - 1 || curY > v.minY + v.viewportH) continue;

        const startPX = toPixel(x1, v.minX, v.tileSize);
        const startPY = toPixel(y1, v.minY, v.tileSize);
        const endPX = toPixel(x2, v.minX, v.tileSize);
        const endPY = toPixel(y2, v.minY, v.tileSize);
        const pxX = toPixel(curX, v.minX, v.tileSize);
        const pxY = toPixel(curY, v.minY, v.tileSize);

        const unitCount = Object.values(cmd.units).reduce((a: number, c) => a + ((c as number) || 0), 0);
        const isReturning = cmd.status === 'returning';
        const hasLoot = isReturning && Object.values(cmd.loot || {}).some(val => (val as number) > 0);
        const strokeColor = cmd.type === 'attack' ? '#00f2ff' : '#fbbf24';
        const strokeWidth = v.visualMode === 'tactical' ? 3 : 2;
        const icon = hasLoot ? '💰' : (cmd.type === 'attack' ? '⚔️' : '🕵️');
        const filterUrl = hasLoot ? 'url(#loot-glow)' : 'url(#arrow-glow)';

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('filter', filterUrl);

        // Path line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(startPX));
        line.setAttribute('y1', String(startPY));
        line.setAttribute('x2', String(endPX));
        line.setAttribute('y2', String(endPY));
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', String(strokeWidth));
        line.setAttribute('stroke-dasharray', isReturning ? '3 8' : '8 4');
        line.setAttribute('opacity', isReturning ? '0.35' : '0.65');
        line.setAttribute('stroke-linecap', 'round');
        g.appendChild(line);

        // Moving unit icon
        const iconG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        iconG.setAttribute('transform', `translate(${pxX}, ${pxY})`);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '22');
        text.setAttribute('style', 'filter: drop-shadow(0 4px 8px rgba(0,0,0,1)); user-select: none;');
        text.textContent = icon;
        iconG.appendChild(text);

        // Unit count badge
        if (unitCount > 0) {
          const badgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          badgeG.setAttribute('transform', 'translate(14, -12)');
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '-2');
          rect.setAttribute('y', '-8');
          rect.setAttribute('width', String(unitCount > 99 ? 28 : unitCount > 9 ? 22 : 16));
          rect.setAttribute('height', '14');
          rect.setAttribute('rx', '7');
          rect.setAttribute('fill', 'rgba(0,0,0,0.8)');
          rect.setAttribute('stroke', strokeColor);
          rect.setAttribute('stroke-width', '0.5');
          badgeG.appendChild(rect);
          const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          badgeText.setAttribute('x', String(unitCount > 99 ? 12 : unitCount > 9 ? 9 : 6));
          badgeText.setAttribute('y', '1');
          badgeText.setAttribute('text-anchor', 'middle');
          badgeText.setAttribute('dominant-baseline', 'middle');
          badgeText.setAttribute('fill', 'white');
          badgeText.setAttribute('font-size', '8');
          badgeText.setAttribute('font-family', 'monospace');
          badgeText.setAttribute('font-weight', 'bold');
          badgeText.textContent = String(unitCount);
          badgeG.appendChild(badgeText);
          iconG.appendChild(badgeG);
        }

        g.appendChild(iconG);

        // Loot trail particles
        if (hasLoot) {
          [0.15, 0.35, 0.55].forEach((offset, i) => {
            const tp = Math.max(0, progress - offset * 0.3);
            if (tp <= 0) return;
            const tx = x1 + (x2 - x1) * tp;
            const ty = y1 + (y2 - y1) * tp;
            const tpx = toPixel(tx, v.minX, v.tileSize);
            const tpy = toPixel(ty, v.minY, v.tileSize);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(tpx));
            circle.setAttribute('cy', String(tpy));
            circle.setAttribute('r', String(2 - i * 0.4));
            circle.setAttribute('fill', '#fbbf24');
            circle.setAttribute('opacity', String(0.4 - i * 0.1));
            g.appendChild(circle);
          });
        }

        group.appendChild(g);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getVisibleCommands, toPixel]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
    />
  );
}
