"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGame, MapTile } from '@/context/GameContext';
import { 
  calculatePoints, calculateDistance, calculateTravelDuration, 
  UNIT_EMOJIS, BUILDING_META, UNIT_ATLAS, Units, Resources 
} from '@/utils/shared';
import { buildTileIndex } from '@/utils/mapUtils';
import TileVisual from '@/components/map/TileVisual';
import TroopArrows from '@/components/map/TroopArrows';
import { MapNavArrows, ZoomControls } from '@/components/map/MapControls';
import Minimap from '@/components/map/Minimap';
import CoordinateGrid from '@/components/map/CoordinateGrid';

const ZOOM_LEVELS = [24, 32, 40, 48, 56, 64, 80];
const DEFAULT_ZOOM = 3; // 48px

export default function WorldMap() {
  const { state, activeVillage: currentActive, setActiveVillageId, dispatchArmy, setMapSettings } = useGame();
  const searchParams = useSearchParams();
  const visualMode = state.mapSettings?.visualMode || 'classic';
  const showGrid = state.mapSettings?.showGrid ?? false;

  const [centerX, setCenterX] = useState(50);
  const [centerY, setCenterY] = useState(50);
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeVillage, setTargetVillage] = useState<MapTile | null>(null);
  const [sentUnits, setSentUnits] = useState<Partial<Units>>({});
  const [dispatchMode, setDispatchMode] = useState<'attack' | 'scout' | null>(null);
  const [zoomIndex, setZoomIndex] = useState(state.mapSettings?.zoomIndex ?? DEFAULT_ZOOM);

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
  const hasDragged = useRef(false);

  // Container size for dynamic viewport
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 });

  const tileSize = ZOOM_LEVELS[zoomIndex];
  const gap = 0;
  const viewportW = Math.min(50, Math.ceil(containerSize.w / (tileSize + gap)) + 2);
  const viewportH = Math.min(50, Math.ceil(containerSize.h / (tileSize + gap)) + 2);

  // Sync center with URL params or current active village on first load
  useEffect(() => {
    const qx = searchParams.get('x');
    const qy = searchParams.get('y');
    if (qx && qy) {
      setCenterX(Math.max(1, Math.min(100, parseInt(qx, 10))));
      setCenterY(Math.max(1, Math.min(100, parseInt(qy, 10))));
    } else if (currentActive) {
      setCenterX(currentActive.x);
      setCenterY(currentActive.y);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentActive?.id, searchParams]);

  // ResizeObserver for dynamic viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const panMap = useCallback((dx: number, dy: number) => {
    setCenterX(prev => Math.max(1, Math.min(100, prev + dx)));
    setCenterY(prev => Math.max(1, Math.min(100, prev + dy)));
  }, []);

  // Keyboard + mouse events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': panMap(0, -1); break;
        case 's': case 'arrowdown': panMap(0, 1); break;
        case 'a': case 'arrowleft': panMap(-1, 0); break;
        case 'd': case 'arrowright': panMap(1, 0); break;
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [panMap]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoomIndex(prev => {
      const next = e.deltaY > 0 ? Math.max(0, prev - 1) : Math.min(ZOOM_LEVELS.length - 1, prev + 1);
      return next;
    });
  }, []);

  // Persist zoom to settings
  useEffect(() => {
    if (zoomIndex !== (state.mapSettings?.zoomIndex ?? DEFAULT_ZOOM)) {
      setMapSettings({ ...state.mapSettings, zoomIndex });
    }
  }, [zoomIndex]);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // left click only
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, cx: centerX, cy: centerY };
  }, [centerX, centerY]);

  const handleMouseMoveDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
      const tileOffsetX = Math.round(-dx / (tileSize + gap));
      const tileOffsetY = Math.round(-dy / (tileSize + gap));
      setCenterX(Math.max(1, Math.min(100, dragStart.current.cx + tileOffsetX)));
      setCenterY(Math.max(1, Math.min(100, dragStart.current.cy + tileOffsetY)));
    }
  }, [tileSize]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const minX = centerX - Math.floor(viewportW / 2);
  const minY = centerY - Math.floor(viewportH / 2);

  // O(1) tile lookup
  const tileIndex = useMemo(() => buildTileIndex(state.worldMap), [state.worldMap]);

  const travelStats = useMemo(() => {
    if (!activeVillage || !currentActive) return null;
    const dist = calculateDistance(currentActive.x, currentActive.y, activeVillage.x, activeVillage.y);
    let slowestSpeed = 0;
    let slowestUnit = '';
    let hasUnits = false;
    Object.entries(sentUnits).forEach(([k, v]) => {
      if (v && v > 0) {
        hasUnits = true;
        const speed = UNIT_ATLAS[k as keyof Units].speed;
        if (speed > slowestSpeed) { slowestSpeed = speed; slowestUnit = k.charAt(0).toUpperCase() + k.slice(1); }
      }
    });
    const duration = hasUnits ? calculateTravelDuration(dist, slowestSpeed) : 0;
    return { dist, duration, slowestUnit };
  }, [activeVillage, currentActive, sentUnits]);

  // Battle forecast
  const battleForecast = useMemo(() => {
    if (!activeVillage) return null;
    let atkPower = 0;
    let lootCapacity = 0;
    let unitCount = 0;
    let hasNobleman = false;
    Object.entries(sentUnits).forEach(([k, v]) => {
      const count = v || 0;
      if (count > 0 && k !== 'scout') {
        atkPower += count * UNIT_ATLAS[k as keyof Units].atk;
        lootCapacity += count * UNIT_ATLAS[k as keyof Units].carry;
        unitCount += count;
        if (k === 'nobleman') hasNobleman = true;
      }
    });

    // If scouted, calculate defense
    const isScouted = !!activeVillage.scoutedAt;
    let defPower = 0;
    let wallLevel = 0;
    let wallBonus = 0;
    let availableLoot = 0;
    if (isScouted && activeVillage.units && activeVillage.buildings) {
      Object.entries(activeVillage.units).forEach(([k, v]) => {
        if (k !== 'scout') defPower += ((v as number) || 0) * UNIT_ATLAS[k as keyof Units].def;
      });
      wallLevel = activeVillage.buildings.cityWall || 0;
      wallBonus = (wallLevel * 20) * (1 + wallLevel * 0.04);
      defPower += wallBonus;
      const res = activeVillage.resources;
      if (res) availableLoot = Math.floor(res.wood + res.clay + res.iron);
    }

    const ratio = atkPower > 0 && defPower > 0 ? atkPower / defPower : atkPower > 0 ? 99 : 0;
    const estimatedLossPct = atkPower > 0 && defPower > 0 ? Math.min(100, Math.round(Math.pow(defPower / atkPower, 1.5) * 100)) : 0;
    const endorsement = activeVillage.endorsement ?? 100;

    return { atkPower, defPower, lootCapacity, availableLoot, ratio, estimatedLossPct, isScouted, wallLevel, wallBonus, unitCount, hasNobleman, endorsement };
  }, [activeVillage, sentUnits]);

  const applyPreset = (preset: 'all' | 'infantry' | 'cavalry' | 'clear') => {
    if (!currentActive?.units) return;
    if (preset === 'clear') { setSentUnits({}); return; }
    const infantry: (keyof Units)[] = ['pikeman', 'swordman', 'axeman', 'archer'];
    const cavalry: (keyof Units)[] = ['lightCavalry', 'heavyCavalry', 'horseArcher', 'knight'];
    const all: Partial<Units> = {};
    Object.entries(currentActive.units).forEach(([k, v]) => {
      const count = v as number || 0;
      if (count <= 0) return;
      if (dispatchMode === 'scout' && k !== 'scout') return;
      if (preset === 'infantry' && !infantry.includes(k as keyof Units)) return;
      if (preset === 'cavalry' && !cavalry.includes(k as keyof Units)) return;
      if (preset === 'all' && (k === 'scout' || k === 'nobleman')) return;
      all[k as keyof Units] = count;
    });
    setSentUnits(all);
  };

  const handleDispatch = () => {
    if (!activeVillage || !dispatchMode) return;
    dispatchArmy(activeVillage.x, activeVillage.y, sentUnits, dispatchMode);
    setDispatchMode(null);
    setTargetVillage(null);
    setSentUnits({});
  };

  const navigateToTile = useCallback((x: number, y: number) => {
    setCenterX(x);
    setCenterY(y);
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-surface-dim overflow-hidden relative">
      {/* Header Bar */}
      <div className="glass-panel px-6 py-3 flex justify-between items-center z-10 relative shrink-0 border-b border-outline-variant">
        <h1 className="text-xl text-white font-bold medieval-font tracking-widest uppercase">
          Tactical Map
          <span className="text-[10px] text-primary/60 font-mono ml-4 uppercase tracking-[0.2em] bg-surface-low px-2 py-0.5 rounded border border-outline-variant">
            Sector {centerX}|{centerY}
          </span>
        </h1>

        <div className="flex gap-3 items-center">
          <ZoomControls
            zoomIndex={zoomIndex}
            zoomLevels={ZOOM_LEVELS}
            onZoomIn={() => setZoomIndex(prev => Math.min(ZOOM_LEVELS.length - 1, prev + 1))}
            onZoomOut={() => setZoomIndex(prev => Math.max(0, prev - 1))}
          />

          <div className="w-px h-6 bg-outline-variant" />

          <button
            onClick={() => setMapSettings({ ...state.mapSettings, showGrid: !showGrid })}
            className={`text-[10px] px-3 py-1.5 rounded transition-all font-bold uppercase tracking-widest border flex items-center gap-1.5 active:scale-95
              ${showGrid
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-surface-highest text-gray-500 border-outline-variant hover:text-primary hover:border-primary/30'}
            `}
          >
            # Grid
          </button>

          <button
            onClick={() => { if (currentActive) { setCenterX(currentActive.x); setCenterY(currentActive.y); } }}
            className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded transition-all font-bold uppercase tracking-widest active:scale-95 shadow-lg"
          >
            🎯 Recenter
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveDrag}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      >
        <div className={`absolute inset-0 transition-all duration-700 ${visualMode === 'tactical' ? 'perspective-[1200px]' : ''}`}>
          <div className={`w-full h-full flex items-center justify-center transition-all duration-700 ${visualMode === 'tactical' ? 'rotate-x-[45deg] rotate-z-[-45deg] scale-[0.65]' : ''}`}>
            <MapNavArrows panMap={panMap} />
            <div
              className={`grid relative
                ${visualMode === 'tactical' ? 'ring-1 ring-primary/20' : ''}
              `}
              style={{
                gridTemplateColumns: `repeat(${viewportW}, ${tileSize}px)`,
                gridTemplateRows: `repeat(${viewportH}, ${tileSize}px)`,
              }}
            >
              {/* Troop arrows overlay */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                <TroopArrows
                  state={state}
                  minX={minX}
                  minY={minY}
                  tileSize={tileSize}
                  viewportW={viewportW}
                  viewportH={viewportH}
                  visualMode={visualMode}
                />
              </div>

              {/* Coordinate grid overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-25 overflow-visible">
                  <CoordinateGrid
                    viewportW={viewportW}
                    viewportH={viewportH}
                    minX={minX}
                    minY={minY}
                    tileSize={tileSize}
                  />
                </div>
              )}

              {/* Tiles */}
              {Array.from({ length: viewportH }).map((_, rIdx) => {
                const y = minY + rIdx;
                return Array.from({ length: viewportW }).map((_, cIdx) => {
                  const x = minX + cIdx;
                  const tile = tileIndex.get(`${x}|${y}`) || { id: `out-${x}-${y}`, x, y, type: 'empty' as const };

                  return (
                    <div
                      key={tile.id}
                      onMouseEnter={() => { if (tile.type !== 'empty') { setHoveredTile(tile); setMousePos(mousePosRef.current); } }}
                      onMouseLeave={() => setHoveredTile(null)}
                      onClick={() => {
                        if (hasDragged.current) return;
                        if (tile.type === 'village' || tile.type === 'player') {
                          setTargetVillage(tile);
                          setDispatchMode(null);
                        }
                      }}
                      className={`relative cursor-pointer group overflow-hidden
                        ${tile.type === 'empty' ? 'bg-surface-dim opacity-10' : 'hover:z-10 hover:ring-1 hover:ring-white/20'}
                        ${activeVillage?.id === tile.id ? 'ring-2 ring-primary shadow-[0_0_30px_rgba(255,198,62,0.2)] z-10' : ''}
                      `}
                    >
                      <TileVisual
                        tile={tile}
                        visualMode={visualMode}
                        playerName={state.playerName}
                        tileSize={tileSize}
                      />
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>

        {/* Minimap - positioned inside viewport container */}
        <Minimap
          worldMap={state.worldMap}
          playerName={state.playerName}
          centerX={centerX}
          centerY={centerY}
          viewportW={viewportW}
          viewportH={viewportH}
          onNavigate={navigateToTile}
        />
      </div>

      {/* Floating Mouse Tooltip */}
      {hoveredTile && (
        <div
          className="fixed pointer-events-none z-[100] px-4 py-3 glass-panel rounded shadow-[0_32px_64px_rgba(0,0,0,0.6)] transition-opacity animate-in fade-in"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <div className="flex flex-col gap-2 min-w-[140px]">
            <div className="flex items-center gap-3 border-b border-white/5 pb-2">
              <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: getTileColor(hoveredTile, state.playerName) }}></div>
              <div className="text-xs font-bold text-white tracking-widest uppercase">
                {hoveredTile.name || hoveredTile.type.replace('_', ' ')}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[10px] uppercase tracking-wider font-bold">
              <div className="flex justify-between border-b border-outline-variant pb-1">
                <span className="text-on-surface-variant/60">Coordinates</span>
                <span className="text-primary font-mono">{hoveredTile.x}|{hoveredTile.y}</span>
              </div>
              {hoveredTile.owner && (
                <div className="flex justify-between border-b border-outline-variant pb-1">
                  <span className="text-on-surface-variant/60">Sovereign</span>
                  <span className={`font-black ${hoveredTile.owner === state.playerName ? 'text-primary' : 'text-tertiary'}`}>{hoveredTile.owner}</span>
                </div>
              )}
              {hoveredTile.points != null && hoveredTile.points > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant/60">Prestige</span>
                  <span className="text-primary font-black">{hoveredTile.points.toLocaleString()}</span>
                </div>
              )}
              {hoveredTile.scoutedAt && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant/60">Intel</span>
                  <span className="text-green-400 text-[9px]">
                    {Date.now() - hoveredTile.scoutedAt < 300000 ? 'Fresh' : 'Stale'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* War Room Modal */}
      {activeVillage && (() => {
        const pts = activeVillage.points || 0;
        let tierIcon = '⛺'; if (pts > 200) tierIcon = '🏠'; if (pts > 500) tierIcon = '🏯'; if (pts > 1500) tierIcon = '🏰';
        const isSelf = activeVillage.owner === state.playerName;
        const isScouted = !!activeVillage.scoutedAt;
        const intelAge = activeVillage.scoutedAt ? Math.floor((Date.now() - activeVillage.scoutedAt) / 1000) : null;
        const hasSelectedUnits = Object.keys(sentUnits).some(k => (sentUnits[k as keyof Units] ?? 0) > 0);
        const fc = battleForecast;
        const successColor = !fc || fc.atkPower === 0 ? 'bg-gray-700' : !fc.isScouted ? 'bg-gray-600' : fc.ratio > 1.5 ? 'bg-green-500' : fc.ratio > 0.8 ? 'bg-yellow-500' : 'bg-red-500';
        const successLabel = !fc || fc.atkPower === 0 ? '—' : !fc.isScouted ? '?' : fc.ratio > 1.5 ? 'Favorable' : fc.ratio > 0.8 ? 'Risky' : 'Suicidal';
        const successTextColor = !fc || fc.atkPower === 0 ? 'text-gray-500' : !fc.isScouted ? 'text-gray-400' : fc.ratio > 1.5 ? 'text-green-400' : fc.ratio > 0.8 ? 'text-yellow-400' : 'text-red-400';

        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl sovereign-panel rounded-lg shadow-2xl overflow-hidden border border-outline-variant max-h-[90vh] flex flex-col">

            {/* ── 1. TARGET INTEL HEADER ── */}
            <div className="px-6 py-5 border-b border-outline-variant shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tierIcon}</span>
                  <div>
                    <h2 className="text-2xl text-primary medieval-font leading-none tracking-widest">{activeVillage.name || 'Barbarian Outpost'}</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-on-surface-variant/60 font-mono tracking-[0.2em]">{activeVillage.x}|{activeVillage.y}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isSelf ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/15 text-red-400'}`}>
                        {activeVillage.owner || 'Unknown'}
                      </span>
                      {isScouted && intelAge !== null && (
                        <span className={`text-[9px] font-mono ${intelAge < 300 ? 'text-green-400' : 'text-yellow-500'}`}>
                          Intel: {intelAge < 60 ? `${intelAge}s ago` : `${Math.floor(intelAge / 60)}m ago`}
                        </span>
                      )}
                      {!isScouted && !isSelf && <span className="text-[9px] text-gray-500 italic">No intel</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => { setTargetVillage(null); setDispatchMode(null); setSentUnits({}); }} className="w-8 h-8 bg-surface-highest rounded border border-outline-variant flex items-center justify-center text-gray-500 hover:text-white transition-all text-sm">✕</button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-black/30 border border-outline-variant px-3 py-2 rounded">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Points</span>
                  <span className="text-sm text-primary font-bold font-mono">{pts.toLocaleString()}</span>
                </div>
                <div className="bg-black/30 border border-outline-variant px-3 py-2 rounded">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Endorsement</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-bold font-mono">{activeVillage.endorsement ?? 100}</span>
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all" style={{ width: `${activeVillage.endorsement ?? 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="bg-black/30 border border-outline-variant px-3 py-2 rounded">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block">Wall</span>
                  <span className="text-sm text-white font-bold font-mono">{isScouted ? `Lv.${activeVillage.buildings?.cityWall || 0}` : '?'}</span>
                </div>
              </div>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">

              {/* Own village: enter citadel */}
              {isSelf && (
                <button onClick={() => { setActiveVillageId(activeVillage.id); setTargetVillage(null); }} className="w-full py-4 gold-button rounded">
                  🚀 Enter the Citadel
                </button>
              )}

              {/* ── 2. RECON PANEL (scouted intel) ── */}
              {!isSelf && isScouted && activeVillage.units && activeVillage.resources && (
                <div className="mb-5">
                  <h3 className="text-[10px] text-primary/70 font-bold uppercase tracking-[0.2em] mb-3">Reconnaissance Intel</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Garrison */}
                    <div className="bg-black/30 border border-outline-variant p-3 rounded">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Garrison</span>
                      <div className="grid grid-cols-3 gap-1">
                        {Object.entries(activeVillage.units).filter(([, v]) => (v as number) > 0).map(([u, v]) => (
                          <div key={u} className="flex items-center gap-1" title={u.charAt(0).toUpperCase() + u.slice(1)}>
                            <span className="text-xs">{UNIT_EMOJIS[u]}</span>
                            <span className="text-[10px] text-gray-300 font-mono">{v as number}</span>
                          </div>
                        ))}
                        {Object.entries(activeVillage.units).filter(([, v]) => (v as number) > 0).length === 0 && (
                          <span className="text-[10px] text-gray-500 italic col-span-3">Empty</span>
                        )}
                      </div>
                    </div>
                    {/* Resources */}
                    <div className="bg-black/30 border border-outline-variant p-3 rounded">
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Resources</span>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between"><span className="text-[10px] text-wood">🪵 Wood</span><span className="text-[10px] text-gray-300 font-mono">{Math.floor(activeVillage.resources.wood).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] text-clay">🧱 Clay</span><span className="text-[10px] text-gray-300 font-mono">{Math.floor(activeVillage.resources.clay).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] text-iron">⛏️ Iron</span><span className="text-[10px] text-gray-300 font-mono">{Math.floor(activeVillage.resources.iron).toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Not scouted prompt */}
              {!isSelf && !isScouted && (
                <div className="mb-5 bg-black/20 border border-dashed border-gray-700 p-4 rounded text-center">
                  <span className="text-gray-500 text-xs">🕵️ No intelligence available — send scouts first</span>
                  {(currentActive?.units?.scout ?? 0) > 0 && (
                    <button
                      onClick={() => { setDispatchMode('scout'); setSentUnits({ scout: currentActive?.units?.scout || 0 }); }}
                      className="mt-3 block mx-auto text-[10px] text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300 border border-blue-500/30 px-4 py-1.5 rounded transition-all hover:bg-blue-500/10"
                    >
                      Quick Scout ({currentActive?.units?.scout} available)
                    </button>
                  )}
                </div>
              )}

              {/* ── ACTION BUTTONS (no dispatch mode) ── */}
              {!isSelf && !dispatchMode && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button onClick={() => setDispatchMode('attack')} className="p-5 bg-red-900/20 hover:bg-red-800/30 border border-red-500/30 rounded-lg flex flex-col items-center gap-3 transition-all group active:scale-95">
                    <span className="text-4xl group-hover:scale-110 transition-transform">⚔️</span>
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Attack</span>
                  </button>
                  <button onClick={() => setDispatchMode('scout')} className="p-5 bg-blue-900/20 hover:bg-blue-800/30 border border-blue-500/30 rounded-lg flex flex-col items-center gap-3 transition-all group active:scale-95">
                    <span className="text-4xl group-hover:scale-110 transition-transform">🕵️</span>
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Scout</span>
                  </button>
                </div>
              )}

              {/* ── 3. ARMY COMPOSER ── */}
              {!isSelf && dispatchMode && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[10px] text-primary/70 font-bold uppercase tracking-[0.2em]">
                      {dispatchMode === 'attack' ? '⚔️ Assault Forces' : '🕵️ Reconnaissance'}
                    </h3>
                    <button onClick={() => { setDispatchMode(null); setSentUnits({}); }} className="text-[10px] text-gray-500 hover:text-white transition-colors">← Back</button>
                  </div>

                  {/* Quick presets */}
                  {dispatchMode === 'attack' && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {[
                        { label: 'Max Army', key: 'all' as const },
                        { label: 'Infantry', key: 'infantry' as const },
                        { label: 'Cavalry', key: 'cavalry' as const },
                        { label: 'Clear', key: 'clear' as const },
                      ].map(p => (
                        <button key={p.key} onClick={() => applyPreset(p.key)} className="text-[9px] px-2.5 py-1 rounded border border-outline-variant text-gray-400 hover:text-primary hover:border-primary/30 transition-all uppercase tracking-wider font-bold">
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Unit cards */}
                  <div className="grid grid-cols-2 gap-2 mb-4 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                    {Object.entries(currentActive?.units || {}).map(([u, count]) => {
                      const c = count as number || 0;
                      if (c <= 0) return null;
                      if (dispatchMode === 'scout' && u !== 'scout') return null;
                      const atlas = UNIT_ATLAS[u as keyof Units];
                      const selected = sentUnits[u as keyof Units] || 0;
                      return (
                        <div key={u} className={`bg-black/30 border rounded p-2.5 transition-all ${selected > 0 ? 'border-primary/40 bg-primary/5' : 'border-outline-variant'}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{UNIT_EMOJIS[u]}</span>
                              <span className="text-[10px] text-white font-bold uppercase tracking-wider">{u.charAt(0).toUpperCase() + u.slice(1)}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">{c}</span>
                          </div>
                          {/* Slider + input */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <input
                              type="range" min={0} max={c} value={selected}
                              onChange={(e) => setSentUnits({ ...sentUnits, [u]: parseInt(e.target.value) })}
                              className="flex-1 h-1 accent-primary cursor-pointer"
                            />
                            <input
                              type="number" min={0} max={c}
                              className="w-14 bg-black/50 border border-outline-variant rounded text-white px-1.5 py-0.5 text-[10px] outline-none focus:border-primary/50 font-mono text-center"
                              value={selected || ''}
                              onChange={(e) => setSentUnits({ ...sentUnits, [u]: Math.min(c, parseInt(e.target.value) || 0) })}
                            />
                          </div>
                          {/* Stats row */}
                          <div className="flex gap-2 text-[8px] text-gray-500 font-mono">
                            <span>⚔️{atlas.atk}</span>
                            <span>🛡️{atlas.def}</span>
                            <span>🎒{atlas.carry}</span>
                            <span>🏃{atlas.speed}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── 4. BATTLE FORECAST ── */}
                  {dispatchMode === 'attack' && fc && fc.unitCount > 0 && (
                    <div className="bg-black/30 border border-outline-variant rounded p-3 mb-4">
                      <h4 className="text-[9px] text-primary/60 font-bold uppercase tracking-[0.2em] mb-2">Battle Forecast</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Your Attack</span>
                          <span className="text-green-400 font-mono font-bold">{fc.atkPower.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Their Defense</span>
                          <span className={`font-mono font-bold ${fc.isScouted ? 'text-red-400' : 'text-gray-500'}`}>{fc.isScouted ? fc.defPower.toLocaleString() : '?'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Est. Losses</span>
                          <span className={`font-mono font-bold ${fc.isScouted ? (fc.estimatedLossPct > 50 ? 'text-red-400' : fc.estimatedLossPct > 20 ? 'text-yellow-400' : 'text-green-400') : 'text-gray-500'}`}>
                            {fc.isScouted ? `~${fc.estimatedLossPct}%` : '?'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Loot Capacity</span>
                          <span className="text-amber-400 font-mono font-bold">{fc.lootCapacity.toLocaleString()}{fc.isScouted ? ` / ${fc.availableLoot.toLocaleString()}` : ''}</span>
                        </div>
                      </div>
                      {/* Success bar */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${successColor}`} style={{ width: `${Math.min(100, (fc.ratio / 3) * 100)}%` }} />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${successTextColor}`}>{successLabel}</span>
                      </div>
                      {/* Nobleman info */}
                      {fc.hasNobleman && (
                        <div className="mt-2 pt-2 border-t border-outline-variant flex justify-between text-[10px]">
                          <span className="text-gray-500">👑 Endorsement Drop</span>
                          <span className="text-purple-400 font-mono font-bold">~{(sentUnits.nobleman || 1) * 15}-{(sentUnits.nobleman || 1) * 25} (current: {fc.endorsement})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 5. DEPLOYMENT FOOTER ── */}
            {!isSelf && dispatchMode && (
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-low shrink-0">
                {travelStats && travelStats.duration > 0 && (
                  <div className="flex justify-between items-center mb-3 text-[10px]">
                    <div className="flex gap-4">
                      <span className="text-gray-500">📏 {travelStats.dist.toFixed(1)} tiles</span>
                      <span className="text-gray-500">⏱️ {formatTime(travelStats.duration / 1000)}</span>
                      <span className="text-gray-500">🔄 {formatTime((travelStats.duration * 2) / 1000)}</span>
                    </div>
                    <span className="text-gray-600 italic">Bottleneck: {travelStats.slowestUnit}</span>
                  </div>
                )}
                <button
                  disabled={!hasSelectedUnits}
                  onClick={handleDispatch}
                  className="w-full py-3.5 gold-button rounded transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {dispatchMode === 'attack' ? '⚔️ Commence Invasion' : '🕵️ Launch Reconnaissance'}
                </button>
              </div>
            )}

          </div>
        </div>
        );
      })()}
    </div>
  );
}

function getTileColor(tile: MapTile, playerName: string) {
  if (tile.type === 'village' || tile.type === 'player') {
    if (tile.owner === playerName) return '#3b82f6'; // blue
    if (tile.owner === 'Barbarian') return '#6b7280'; // grey
    return '#ef4444'; // red for other players
  }

  switch (tile.type) {
    case 'grass': return '#2d5a2d';
    case 'forest': return '#1a4a1a';
    case 'mountain': return '#6a6a5a';
    case 'water': return '#1a3a6a';
    default: return '#1a261a';
  }
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rs = Math.floor(s % 60);
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
}
