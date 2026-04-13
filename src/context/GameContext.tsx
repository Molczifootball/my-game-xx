"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  calculatePoints, Buildings, Resources, Units, UNIT_ATLAS, 
  getProductionRate, getGranaryCapacity, getWarehouseCapacity, 
  getGrainProduction, getMeatProduction, getFishProduction,
  getFoodUpkeep, getMaxPopulation, getCurrentPopulation,
  MAX_LEVELS, BUILDING_REQUIREMENTS
} from "@/utils/shared";
import { getTerrainType } from "@/utils/mapUtils";

export interface ActiveUpgrade {
  id: string; 
  building: keyof Buildings;
  targetLevel: number;
  completesAt: number;
}

export interface ActiveRecruitment {
  id: string;
  unit: keyof Units;
  completesAt: number;
}

export interface ActiveCommand {
  id: string;
  type: 'attack' | 'scout';
  status: 'marching' | 'returning';
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
  units: Partial<Units>;
  travelDurationMs: number;
  arrivesAt: number;
  returnsAt: number;
  loot: Resources;
}

export interface BattleReport {
  id: string;
  timestamp: number;
  targetX: number;
  targetY: number;
  targetName: string;
  type: 'attack' | 'scout';
  result: 'victory' | 'defeat' | 'scouted';
  direction: 'outgoing' | 'incoming'; // outgoing = you attacked, incoming = you were attacked
  loot: Resources;
  attackerUnits?: Partial<Units>;
  attackerLosses?: Partial<Units>;
  defenderUnits?: Partial<Units>;
  defenderLosses?: Partial<Units>;
  targetResources?: Resources;
  targetUnits?: Partial<Units>;
  targetBuildings?: Partial<Buildings>;
  endorsementDrop?: number;
  attackerName?: string;
  originX?: number;
  originY?: number;
  originName?: string;
  isRead: boolean;
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  type: 'empty' | 'grass' | 'forest' | 'water' | 'mountain' | 'village' | 'player' | 'border';
  points?: number;
  name?: string;
  owner?: string;
  buildings?: Buildings;
  resources?: Resources;
  lastAttackAt?: number | null;
  scoutedAt?: number | null;
  endorsement?: number;
  units?: Partial<Units>;
  // For player villages only
  upgrades?: ActiveUpgrade[];
  recruitment?: ActiveRecruitment[];
}

export interface MapSettings {
  visualMode: 'classic' | 'tactical';
  zoomIndex?: number;
  showGrid?: boolean;
}

export interface GameState {
  activeVillageId: string;
  playerName: string;
  activeCommands: ActiveCommand[];
  reports: BattleReport[];
  worldMap: MapTile[];
  lastTick: number;
  mapSettings: MapSettings;
}

interface GameContextType {
  state: GameState;
  activeVillage: MapTile | undefined;
  setActiveVillageId: (id: string) => void;
  upgradeBuilding: (building: keyof Buildings) => void;
  recruitUnit: (unit: keyof Units, count?: number) => void;
  dispatchArmy: (targetX: number, targetY: number, units: Partial<Units>, type: 'attack' | 'scout') => void;
  MAX_LEVELS: Record<keyof Buildings, number>;
  getTimeRemaining: (completesAt: number) => number;
  resetVillage: () => void;
  addResources: () => void;
  maxAllBuildings: () => void;
  renameVillage: (name: string) => void;
  markReportAsRead: (reportId: string) => void;
  addArmy: (units: Partial<Units>) => void;
  updateWorldTile: (x: number, y: number, data: Partial<MapTile>) => void;
  regenerateMap: () => void;
  playerPoints: number;
  setMapSettings: (settings: MapSettings) => void;
}

const generateWorldMap = (): MapTile[] => {
  const map: MapTile[] = [];
  const W = 50, H = 50;
  const grid: MapTile['type'][][] = Array.from({ length: H }, () => Array(W).fill('grass'));

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Player village at 25|25 (index 24|24)
      if (x === 24 && y === 24) {
        grid[y][x] = 'player';
        continue;
      }

      // Determine terrain first
      const terrain = getTerrainType(x + 1, y + 1);

      // Village distribution: dense near center, sparse at edges — never on water
      const dist = Math.sqrt(Math.pow(x - 24, 2) + Math.pow(y - 24, 2));
      const probability = Math.max(0.05, 0.45 - (dist / 30)); // ~45% at center, ~5% at edges

      if (terrain !== 'water' && terrain !== 'forest' && Math.random() < probability) {
        grid[y][x] = 'village';
      } else {
        grid[y][x] = terrain;
      }
    }
  }

  // Post-process: remove villages surrounded by forest (no adjacent non-forest/non-water tile)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== 'village' && grid[y][x] !== 'player') continue;
      const neighbors = [
        y > 0 ? grid[y - 1][x] : 'border',
        y < H - 1 ? grid[y + 1][x] : 'border',
        x > 0 ? grid[y][x - 1] : 'border',
        x < W - 1 ? grid[y][x + 1] : 'border',
      ];
      const allBlocked = neighbors.every(n => n === 'forest' || n === 'water' || n === 'mountain' || n === 'border');
      if (allBlocked && grid[y][x] === 'village') {
        grid[y][x] = 'grass';
      }
    }
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const type = grid[y][x];
      const isBarbarian = type === 'village';
      const isPlayer = type === 'player';
      let b: Buildings | undefined, r: Resources | undefined, u: Partial<Units> | undefined, up: ActiveUpgrade[] | undefined, rec: ActiveRecruitment[] | undefined;
      
      if (isBarbarian || isPlayer) {
        b = isPlayer
          ? { headquarters: 1, timberCamp: 1, clayPit: 1, ironMine: 1, warehouse: 1, granary: 1, cityWall: 0, barracks: 0, stable: 0, castle: 0, palace: 0, farm: 1, huntersLodge: 0, fishery: 0, residence: 1 }
          : { headquarters: Math.floor(Math.random() * 15) + 1, timberCamp: Math.floor(Math.random() * 20), clayPit: Math.floor(Math.random() * 20), ironMine: Math.floor(Math.random() * 20), warehouse: Math.floor(Math.random() * 10) + 1, granary: Math.floor(Math.random() * 8), cityWall: Math.floor(Math.random() * 10), barracks: Math.floor(Math.random() * 10), stable: Math.floor(Math.random() * 5), castle: 0, palace: 0, farm: Math.floor(Math.random() * 15) + 1, huntersLodge: Math.floor(Math.random() * 8), fishery: Math.floor(Math.random() * 5), residence: Math.floor(Math.random() * 10) + 1 };
        r = isPlayer
          ? { wood: 500, clay: 500, iron: 500, grain: 500, meat: 100, fish: 100 }
          : { wood: Math.floor(Math.random() * 5000), clay: Math.floor(Math.random() * 5000), iron: Math.floor(Math.random() * 5000), grain: Math.floor(Math.random() * 3000), meat: Math.floor(Math.random() * 1500), fish: Math.floor(Math.random() * 1000) };
        u = isPlayer ? { pikeman: 0, swordman: 0, axeman: 0, archer: 0, scout: 0, lightCavalry: 0, heavyCavalry: 0, horseArcher: 0, knight: 0, nobleman: 0 } : { pikeman: Math.floor(Math.random() * 20), swordman: Math.floor(Math.random() * 10) };
        if (isPlayer) { up = []; rec = []; }
      }

      map.push({
        id: `${x + 1}|${y + 1}`, x: x + 1, y: y + 1, type,
        name: isBarbarian ? 'Wilderlands Outpost' : isPlayer ? 'Lechitic Capital' : undefined,
        points: (isBarbarian || isPlayer) ? calculatePoints(b!) : undefined,
        owner: isBarbarian ? 'Barbarian' : isPlayer ? 'Player_1' : undefined,
        buildings: b, resources: r, units: u, upgrades: up, recruitment: rec,
        endorsement: isBarbarian ? 100 : isPlayer ? 100 : undefined,
      });
    }
  }
  return map;
};



const initialGameState: GameState = {
  playerName: "Player_1", activeVillageId: "25|25",
  activeCommands: [], reports: [], worldMap: [], lastTick: Date.now(),
  mapSettings: { visualMode: 'classic' },
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [state, setState] = useState<GameState>(initialGameState);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Derived state for the UI
  const activeVillage = useMemo(() => state.worldMap.find(t => t.id === state.activeVillageId), [state.worldMap, state.activeVillageId]);
  
  const playerPoints = useMemo(() => {
    return state.worldMap
      .filter(t => t.owner === state.playerName)
      .reduce((acc, tile) => acc + (tile.points || 0), 0);
  }, [state.worldMap, state.playerName]);

  // Load initial multiplayer state
  const loadState = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetch('/api/game');
      const data = await res.json();
      
      if (data.villages) {
        // Map database WorldTile to frontend MapTile format
        const worldMap: MapTile[] = data.worldMap.map((t: any) => ({
          ...t,
          id: `${t.x}|${t.y}`,
          owner: t.ownerName,
          points: calculatePoints(t.buildings || {}),
          // Map queued upgrades from DB format to ActiveUpgrade format
          upgrades: Array.isArray(t.upgrades) ? t.upgrades.map((u: any) => ({
            id: u.id,
            building: u.building,
            targetLevel: u.targetLevel,
            completesAt: u.completesAt,
          })) : [],
        }));

        setState(prev => ({
          ...prev,
          playerName: data.playerName,
          activeVillageId: data.activeVillageId,
          activeCommands: (data.commands || []).map((cmd: any) => {
            const arrivesAt = new Date(cmd.arrivesAt).getTime();
            const returnsAt = new Date(cmd.returnsAt).getTime();
            return {
              ...cmd,
              arrivesAt,
              returnsAt,
              travelDurationMs: returnsAt - arrivesAt,
              loot: cmd.loot || { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 },
            };
          }),
          reports: (data.reports || []).map((r: any) => ({
            ...r,
            timestamp: new Date(r.createdAt).getTime(),
          })),
          worldMap,
          lastTick: Date.now()
        }));
      }
    } catch (e) {
      console.error("Multiplayer load failed:", e);
    } finally {
      setLoading(false);
      setMounted(true);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Periodic Refresh (Sync with server every 10 seconds)
  useEffect(() => {
    if (!mounted || !session?.user?.id) return;
    const interval = setInterval(loadState, 10000);
    return () => clearInterval(interval);
  }, [mounted, session?.user?.id, loadState]);

  // "Ghost" Tick (Local UI interpolation for smooth resource counting)
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setState((ps) => {
        const now = Date.now();
        const dSec = Math.max(0, now - ps.lastTick) / 1000;
        
        const nMap = ps.worldMap.map(tile => {
          if (tile.id !== ps.activeVillageId || !tile.buildings || !tile.resources) return tile;
          
          let tr = { ...tile.resources };
          const tb = tile.buildings;
          
          // Smoothly interpolate resources locally
          const warehouseCap = Math.floor(5000 * Math.pow(1.3, tb.warehouse - 1));
          tr.wood = Math.min(warehouseCap, tr.wood + (getProductionRate(tb.timberCamp)/3600 * dSec));
          tr.clay = Math.min(warehouseCap, tr.clay + (getProductionRate(tb.clayPit)/3600 * dSec));
          tr.iron = Math.min(warehouseCap, tr.iron + (getProductionRate(tb.ironMine)/3600 * dSec));

          const granaryCap = getGranaryCapacity(tb.granary || 0);
          const grainProd = getGrainProduction(tb.farm || 0);
          const upkeep = getFoodUpkeep(tile.units || {});
          
          tr.grain = Math.min(granaryCap, Math.max(0, (tr.grain || 0) + (grainProd - upkeep.grain) / 3600 * dSec));

          return { ...tile, resources: tr };
        });

        return { ...ps, worldMap: nMap, lastTick: now };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const setActiveVillageId = (id: string) => setState(p => ({ ...p, activeVillageId: id }));

  // API Call Helpers for Actions
  const performAction = async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) await loadState(); // Refresh after action
    } catch (e) {
      console.error(`Action ${action} failed:`, e);
    }
  };

  const upgradeBuilding = (building: keyof Buildings) => {
    if (!activeVillage) return;
    performAction('upgrade', { x: activeVillage.x, y: activeVillage.y, building });
  };

  const recruitUnit = (unit: keyof Units, count: number = 1) => {
    if (!activeVillage) return;
    performAction('recruit', { x: activeVillage.x, y: activeVillage.y, unit, count });
  };

  const dispatchArmy = (tX: number, tY: number, units: Partial<Units>, type: 'attack' | 'scout') => {
    if (!activeVillage) return;
    performAction('dispatch', { originX: activeVillage.x, originY: activeVillage.y, targetX: tX, targetY: tY, units, type });
  };

  const getTimeRemaining = (t: number) => Math.max(0, Math.floor((t - Date.now()) / 1000));
  const resetVillage = () => { localStorage.clear(); fetch('/api/game', { method: 'DELETE' }).finally(() => window.location.reload()); };
  
  // Dev Helpers (Optional: we can disable these for true multiplayer)
  const maxAllBuildings = () => performAction('dev_max', { villageId: activeVillage?.id });
  const addResources = () => performAction('dev_resources', { villageId: activeVillage?.id });
  
  const renameVillage = (name: string) => performAction('rename', { villageId: activeVillage?.id, name });
  const markReportAsRead = (id: string) => performAction('mark_read', { id });
  
  const addArmy = (units: Partial<Units>) => performAction('dev_army', { villageId: activeVillage?.id, units });
  
  const updateWorldTile = (x: number, y: number, d: Partial<MapTile>) => {
    // Optimistic UI update or wait for poll
    setState(p => ({ ...p, worldMap: p.worldMap.map(t => (t.x === x && t.y === y) ? { ...t, ...d } : t) }));
  };

  const regenerateMap = () => loadState(); 
  const setMapSettings = (settings: MapSettings) => setState(p => ({ ...p, mapSettings: settings }));

  if (!mounted) return null;

  return (
    <GameContext.Provider value={{ 
      state, activeVillage, setActiveVillageId, upgradeBuilding, recruitUnit, dispatchArmy, 
      MAX_LEVELS, getTimeRemaining, resetVillage, addResources, maxAllBuildings, renameVillage, 
      markReportAsRead, addArmy, updateWorldTile, regenerateMap, playerPoints, setMapSettings 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const c = useContext(GameContext);
  if (!c) throw new Error("useGame error");
  return c;
};
