"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { calculatePoints } from "@/utils/shared";
import { getTerrainType } from "@/utils/mapUtils";

// Resource types
export interface Resources {
  wood: number;
  clay: number;
  iron: number;
  grain: number;
  meat: number;
  fish: number;
}

// Building levels
export interface Buildings {
  headquarters: number;
  timberCamp: number;
  clayPit: number;
  ironMine: number;
  warehouse: number;
  granary: number;
  cityWall: number;
  barracks: number;
  stable: number;
  castle: number;
  palace: number;
  farm: number;
  huntersLodge: number;
  fishery: number;
  residence: number;
}

// Units
export interface Units {
  pikeman: number;
  swordman: number;
  axeman: number;
  archer: number;
  scout: number;
  lightCavalry: number;
  heavyCavalry: number;
  horseArcher: number;
  knight: number;
  nobleman: number;
}

export const UNIT_ATLAS: Record<keyof Units, { name: string, reqB: keyof Buildings, reqLvl: number, w: number, c: number, i: number, grain: number, fish: number, meat: number, pop: number, time: number, speed: number, carry: number, atk: number, def: number, defCav: number, defArch: number }> = {
  // Low tier → grain, 1 pop
  pikeman:      { name: "Pikeman",       reqB: 'barracks', reqLvl: 1,  w: 50,    c: 30,    i: 10,    grain: 1, fish: 0, meat: 0, pop: 1, time: 15,  speed: 8,  carry: 25,  atk: 10,  def: 15,  defCav: 45,  defArch: 20 },
  swordman:     { name: "Swordsman",     reqB: 'barracks', reqLvl: 1,  w: 50,    c: 30,    i: 10,    grain: 1, fish: 0, meat: 0, pop: 1, time: 20,  speed: 10, carry: 15,  atk: 25,  def: 50,  defCav: 15,  defArch: 40 },
  axeman:       { name: "Axeman",        reqB: 'barracks', reqLvl: 2,  w: 50,    c: 30,    i: 10,    grain: 2, fish: 0, meat: 0, pop: 1, time: 18,  speed: 8,  carry: 10,  atk: 40,  def: 10,  defCav: 5,   defArch: 10 },
  scout:        { name: "Scout",         reqB: 'stable',   reqLvl: 1,  w: 50,    c: 50,    i: 20,    grain: 1, fish: 0, meat: 0, pop: 1, time: 10,  speed: 3,  carry: 0,   atk: 0,   def: 2,   defCav: 1,   defArch: 2 },
  // Mid tier → fish, 2 pop
  archer:       { name: "Archer",        reqB: 'barracks', reqLvl: 5,  w: 100,   c: 30,    i: 60,    grain: 0, fish: 2, meat: 0, pop: 2, time: 25,  speed: 8,  carry: 10,  atk: 15,  def: 50,  defCav: 40,  defArch: 5 },
  lightCavalry: { name: "Light Cavalry", reqB: 'stable',   reqLvl: 3,  w: 125,   c: 100,   i: 250,   grain: 0, fish: 2, meat: 0, pop: 2, time: 30,  speed: 4,  carry: 80,  atk: 130, def: 30,  defCav: 40,  defArch: 30 },
  horseArcher:  { name: "Horse Archer",  reqB: 'stable',   reqLvl: 5,  w: 250,   c: 100,   i: 150,   grain: 0, fish: 3, meat: 0, pop: 2, time: 35,  speed: 5,  carry: 50,  atk: 120, def: 40,  defCav: 30,  defArch: 50 },
  // Top tier → meat, 3 pop
  heavyCavalry: { name: "Heavy Cavalry", reqB: 'stable',   reqLvl: 5,  w: 200,   c: 150,   i: 600,   grain: 0, fish: 0, meat: 3, pop: 3, time: 45,  speed: 5,  carry: 50,  atk: 150, def: 200, defCav: 80,  defArch: 180 },
  knight:       { name: "Knight",        reqB: 'castle',   reqLvl: 1,  w: 1000,  c: 1000,  i: 1000,  grain: 0, fish: 0, meat: 5, pop: 3, time: 120, speed: 4,  carry: 100, atk: 150, def: 250, defCav: 250, defArch: 250 },
  nobleman:     { name: "Nobleman",      reqB: 'palace',   reqLvl: 1,  w: 40000, c: 50000, i: 50000, grain: 0, fish: 0, meat: 8, pop: 3, time: 300, speed: 20, carry: 0,   atk: 30,  def: 100, defCav: 100, defArch: 100 },
};

/** Calculate food upkeep per hour: { grain, fish, meat } */
export const getFoodUpkeep = (units: Partial<Units>): { grain: number; fish: number; meat: number } => {
  let grain = 0, fish = 0, meat = 0;
  (Object.entries(units) as [keyof Units, number][]).forEach(([u, c]) => {
    grain += (c || 0) * UNIT_ATLAS[u].grain;
    fish += (c || 0) * UNIT_ATLAS[u].fish;
    meat += (c || 0) * UNIT_ATLAS[u].meat;
  });
  return { grain, fish, meat };
};

/** Food production per hour based on building level */
export const getGrainProduction = (farmLevel: number): number => farmLevel === 0 ? 0 : 50 * Math.pow(1.15, farmLevel - 1);
export const getMeatProduction = (lodgeLevel: number): number => lodgeLevel === 0 ? 0 : 60 * Math.pow(1.15, lodgeLevel - 1);
export const getFishProduction = (fisheryLevel: number): number => fisheryLevel === 0 ? 0 : 60 * Math.pow(1.15, fisheryLevel - 1);
/** Granary capacity */
export const getGranaryCapacity = (granaryLevel: number): number => granaryLevel === 0 ? 500 : Math.floor(3000 * Math.pow(1.3, granaryLevel - 1));
/** Residence max population */
export const getMaxPopulation = (residenceLevel: number): number => residenceLevel === 0 ? 10 : Math.floor(25 * Math.pow(1.22, residenceLevel - 1));
/** Current population used by units (+ units in training queue) */
export const getCurrentPopulation = (units: Partial<Units>, recruitment?: { unit: keyof Units }[]): number => {
  let pop = 0;
  (Object.entries(units) as [keyof Units, number][]).forEach(([u, c]) => { pop += (c || 0) * UNIT_ATLAS[u].pop; });
  if (recruitment) recruitment.forEach(r => { pop += UNIT_ATLAS[r.unit].pop; });
  return pop;
};

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

const MAX_LEVELS: Record<keyof Buildings, number> = {
  headquarters: 20, timberCamp: 30, clayPit: 30, ironMine: 30, warehouse: 20, granary: 25, cityWall: 20, barracks: 25, stable: 20, castle: 1, palace: 1, farm: 25, huntersLodge: 25, fishery: 25, residence: 25,
};

// Building prerequisites: { building: [{ requires: building, level: minLevel }] }
export const BUILDING_REQUIREMENTS: Record<keyof Buildings, { requires: keyof Buildings; level: number }[]> = {
  headquarters: [],
  timberCamp: [{ requires: 'headquarters', level: 1 }],
  clayPit: [{ requires: 'headquarters', level: 1 }],
  ironMine: [{ requires: 'headquarters', level: 1 }],
  warehouse: [{ requires: 'headquarters', level: 1 }],
  cityWall: [{ requires: 'headquarters', level: 3 }, { requires: 'barracks', level: 1 }],
  barracks: [{ requires: 'headquarters', level: 3 }],
  stable: [{ requires: 'headquarters', level: 10 }, { requires: 'barracks', level: 5 }],
  castle: [{ requires: 'headquarters', level: 20 }, { requires: 'stable', level: 10 }, { requires: 'barracks', level: 15 }],
  palace: [{ requires: 'headquarters', level: 20 }, { requires: 'stable', level: 5 }, { requires: 'barracks', level: 10 }],
  farm: [{ requires: 'headquarters', level: 1 }],
  granary: [{ requires: 'headquarters', level: 2 }],
  huntersLodge: [{ requires: 'headquarters', level: 5 }, { requires: 'barracks', level: 1 }],
  fishery: [{ requires: 'headquarters', level: 8 }],
  residence: [{ requires: 'headquarters', level: 2 }],
};

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
export const getProductionRate = (lvl: number) => lvl === 0 ? 0 : 30 * Math.pow(1.15, lvl - 1);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(initialGameState);
  const [mounted, setMounted] = useState(false);

  // Derived state for the UI (backwards compatibility)
  const activeVillage = useMemo(() => state.worldMap.find(t => t.id === state.activeVillageId), [state.worldMap, state.activeVillageId]);
  const playerPoints = useMemo(() => {
    return state.worldMap
      .filter(t => t.owner === state.playerName)
      .reduce((acc, tile) => acc + (tile.points || 0), 0);
  }, [state.worldMap, state.playerName]);

  useEffect(() => {
    // Try loading from database first, fallback to localStorage, then generate new
    const loadState = async () => {
      try {
        const res = await fetch('/api/game');
        const data = await res.json();
        if (data.state && data.state.worldMap && data.state.worldMap.length > 0) {
          setState({ ...data.state, lastTick: Date.now() });
          setMounted(true);
          return;
        }
      } catch (e) {
        console.warn("DB load failed, trying localStorage:", e);
      }
      // Fallback to localStorage
      const saved = localStorage.getItem("tribalWarsCloneState");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.worldMap && Array.isArray(parsed.worldMap) && parsed.worldMap.length > 0) {
            setState({ ...parsed, lastTick: Date.now() });
            setMounted(true);
            return;
          }
        } catch (e) {
          console.error("Failed to load from localStorage:", e);
        }
      }
      // Generate new world
      setState({ ...initialGameState, worldMap: generateWorldMap(), lastTick: Date.now() });
      setMounted(true);
    };
    loadState();
  }, []);

  // Save to localStorage immediately, and debounce save to DB
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!mounted) return;
    // Always save to localStorage (instant)
    localStorage.setItem("tribalWarsCloneState", JSON.stringify(state));
    // Debounce DB save (every 5 seconds)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, playerName: state.playerName }),
      }).catch(e => console.warn('DB save failed:', e));
    }, 5000);
  }, [state, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setState((ps) => {
        const now = Date.now();
        const dSec = Math.max(0, now - ps.lastTick) / 1000;
        let nMap = [...ps.worldMap];
        let nRep = [...ps.reports];
        let nCmd: ActiveCommand[] = [];

        // 1. Update all player villages
        nMap = nMap.map(tile => {
          if (tile.owner !== ps.playerName || !tile.buildings || !tile.resources || !tile.units) return tile;
          
          let tb = { ...tile.buildings };
          let tr = { ...tile.resources };
          let tu = { ...tile.units };
          
          // Resource Production
          const cap = Math.floor(5000 * Math.pow(1.3, tb.warehouse - 1));
          tr.wood = Math.min(cap, tr.wood + (getProductionRate(tb.timberCamp)/3600 * dSec));
          tr.clay = Math.min(cap, tr.clay + (getProductionRate(tb.clayPit)/3600 * dSec));
          tr.iron = Math.min(cap, tr.iron + (getProductionRate(tb.ironMine)/3600 * dSec));

          // Food production (3 sources) & upkeep
          const granaryCap = getGranaryCapacity(tb.granary || 0);
          const grainProd = getGrainProduction(tb.farm || 0);
          const meatProd = getMeatProduction(tb.huntersLodge || 0);
          const fishProd = getFishProduction(tb.fishery || 0);
          const upkeep = getFoodUpkeep(tu);
          // Each food type: production - upkeep
          const netGrain = grainProd - upkeep.grain;
          const netFish = fishProd - upkeep.fish;
          const netMeat = meatProd - upkeep.meat;
          tr.grain = Math.min(granaryCap, Math.max(0, (tr.grain || 0) + netGrain / 3600 * dSec));
          tr.fish = Math.min(granaryCap, Math.max(0, (tr.fish || 0) + netFish / 3600 * dSec));
          tr.meat = Math.min(granaryCap, Math.max(0, (tr.meat || 0) + netMeat / 3600 * dSec));

          // Desertion: if any food type hits 0 while its upkeep exceeds production
          const starvingGrain = tr.grain <= 0 && upkeep.grain > grainProd;
          const starvingFish = tr.fish <= 0 && upkeep.fish > fishProd;
          const starvingMeat = tr.meat <= 0 && upkeep.meat > meatProd;
          if (starvingGrain || starvingFish || starvingMeat) {
            const desertionRate = 0.01 * dSec;
            const unitKeys = Object.keys(tu) as (keyof Units)[];
            // Desert units that consume the starving food type, most expensive first
            const sorted = unitKeys.filter(u => {
              if ((tu[u] || 0) <= 0) return false;
              const a = UNIT_ATLAS[u];
              return (starvingGrain && a.grain > 0) || (starvingFish && a.fish > 0) || (starvingMeat && a.meat > 0);
            }).sort((a, b) => (UNIT_ATLAS[b].grain + UNIT_ATLAS[b].fish + UNIT_ATLAS[b].meat) - (UNIT_ATLAS[a].grain + UNIT_ATLAS[a].fish + UNIT_ATLAS[a].meat));
            if (sorted.length > 0) {
              const u = sorted[0];
              const lost = Math.max(1, Math.floor((tu[u] || 0) * desertionRate));
              tu[u] = Math.max(0, (tu[u] || 0) - lost);
            }
          }

          // Building Upgrades
          const nUpg = (tile.upgrades || []).filter(u => {
            if (now >= u.completesAt) { tb[u.building] = u.targetLevel; return false; }
            return true;
          });

          // Unit Recruitment (only first in queue trains at a time)
          let nRec = [...(tile.recruitment || [])];
          if (nRec.length > 0 && now >= nRec[0].completesAt) {
            // First unit completed — add to army
            (tu as any)[nRec[0].unit] = (tu[nRec[0].unit] || 0) + 1;
            nRec.shift();
            // Recalculate start times for remaining queue items
            if (nRec.length > 0) {
              let prevEnd = now;
              nRec = nRec.map(r => {
                const d = UNIT_ATLAS[r.unit];
                const t = d.time * (['knight','nobleman'].includes(r.unit) ? 1 : Math.pow(0.95, tb[d.reqB] - 1));
                const completesAt = prevEnd + t * 1000;
                prevEnd = completesAt;
                return { ...r, completesAt };
              });
            }
          }

          return { ...tile, buildings: tb, resources: tr, units: tu, upgrades: nUpg, recruitment: nRec, points: calculatePoints(tb) };
        });

        // 2. Process active commands
        ps.activeCommands.forEach((cmd) => {
          if (cmd.status === 'marching' && now >= cmd.arrivesAt) {
            const tIdx = nMap.findIndex(t => t.x === cmd.targetX && t.y === cmd.targetY);
            if (tIdx !== -1) {
              const tile = { ...nMap[tIdx] };
              let loot = { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 };
              let sAtk = { ...cmd.units };
              let aL = {} as Partial<Units>;
              let dL = {} as Partial<Units>;
              let scoutIntel = null;

              // 1. SCOUT PHASE
              const aScouts = cmd.units.scout || 0;
              const dScouts = tile.units?.scout || 0;
              let sLoss = 0;
              
              if (aScouts > 0) {
                if (dScouts >= aScouts) {
                  sLoss = aScouts; // All die
                } else if (dScouts > 0) {
                  sLoss = Math.min(aScouts, dScouts); // One-to-one casualty logic
                }
                aL.scout = sLoss;
                sAtk.scout = aScouts - sLoss;
                if (sAtk.scout! > 0) {
                  tile.scoutedAt = now;
                  scoutIntel = { resources: { ...tile.resources! }, units: { ...tile.units! }, buildings: { ...tile.buildings! } };
                }
              }

              // 2. MAIN COMBAT PHASE (Only if 'attack' command)
              if (cmd.type === 'attack') {
                let atkP = 0; (Object.entries(cmd.units) as [keyof Units, number][]).forEach(([u, c]) => { if (u !== 'scout') atkP += (c || 0) * UNIT_ATLAS[u].atk; });
                let defP = 0; (Object.entries(tile.units || {}) as [keyof Units, number][]).forEach(([u, c]) => { if (u !== 'scout') defP += (c || 0) * UNIT_ATLAS[u].def; });
                const wall = tile.buildings?.cityWall || 0; defP = (defP + (wall * 20)) * (1 + (wall * 0.04));

                if (atkP > defP) {
                  const ratio = defP > 0 ? Math.pow(defP / atkP, 1.5) : 0;
                  (Object.entries(cmd.units) as [keyof Units, number][]).forEach(([u, c]) => { if (u !== 'scout') { const l = Math.floor((c || 0) * ratio); aL[u] = l; sAtk[u] = (c || 0) - l; } });
                  (Object.entries(tile.units || {}) as [keyof Units, number][]).forEach(([u, c]) => { dL[u] = c; if (tile.units) tile.units[u] = 0; });
                  let cap = 0; (Object.entries(sAtk) as [keyof Units, number][]).forEach(([u, c]) => cap += (c || 0) * UNIT_ATLAS[u].carry);
                  if (cap > 0 && tile.resources) {
                    const r = tile.resources;
                    loot.wood = Math.min(Math.floor(r.wood), cap); r.wood -= loot.wood; cap -= loot.wood;
                    loot.clay = Math.min(Math.floor(r.clay), cap); r.clay -= loot.clay; cap -= loot.clay;
                    loot.iron = Math.min(Math.floor(r.iron), cap); r.iron -= loot.iron; cap -= loot.iron;
                    loot.grain = Math.min(Math.floor(r.grain || 0), cap); r.grain = (r.grain || 0) - loot.grain; cap -= loot.grain;
                    loot.meat = Math.min(Math.floor(r.meat || 0), cap); r.meat = (r.meat || 0) - loot.meat; cap -= loot.meat;
                    loot.fish = Math.min(Math.floor(r.fish || 0), cap); r.fish = (r.fish || 0) - loot.fish;
                  }
                  if ((sAtk.nobleman ?? 0) > 0) {
                    let totalDrop = 0;
                    for (let i = 0; i < sAtk.nobleman!; i++) { totalDrop += Math.floor(Math.random() * 11) + 15; } // 15-25 per noble, summed
                    tile.endorsement = Math.max(0, (tile.endorsement || 100) - totalDrop);
                    if (tile.endorsement <= 0) { tile.owner = ps.playerName; tile.name = `${ps.playerName}'s Village`; tile.type = 'player'; tile.upgrades = []; tile.recruitment = []; }
                  }
                } else {
                  // Defender Victory
                  (Object.keys(cmd.units) as (keyof Units)[]).forEach(u => { if (u !== 'scout') { aL[u] = cmd.units[u] || 0; sAtk[u] = 0; } });
                  const ratio = atkP > 0 ? Math.pow(atkP / defP, 1.5) : 0;
                  (Object.entries(tile.units || {}) as [keyof Units, number][]).forEach(([u, c]) => { if (u !== 'scout') { const l = Math.floor((c || 0) * ratio); dL[u] = l; if (tile.units) tile.units[u] = (c || 0) - l; } });
                }
              }

              // 3. REPORT GENERATION
              const originTile = nMap.find(t => t.x === cmd.originX && t.y === cmd.originY);
              const isPlayerAttacker = originTile?.owner === ps.playerName;
              const isPlayerDefender = tile.owner === ps.playerName;
              const attackerWon = Object.entries(sAtk).some(([k, v]) => k !== 'scout' && (v || 0) > 0);
              const reportResult = cmd.type === 'scout' ? 'scouted' as const : (attackerWon ? 'victory' as const : 'defeat' as const);

              // Outgoing report (for attacker — player attacked someone)
              if (isPlayerAttacker) {
                nRep.unshift({
                  id: Math.random().toString(36).substr(2, 9), timestamp: now, targetX: cmd.targetX, targetY: cmd.targetY, targetName: tile.name || 'Barbarian',
                  type: cmd.type, result: reportResult, direction: 'outgoing',
                  loot, attackerUnits: cmd.units, attackerLosses: aL, defenderUnits: nMap[tIdx].units, defenderLosses: dL,
                  targetResources: scoutIntel?.resources, targetUnits: scoutIntel?.units, targetBuildings: scoutIntel?.buildings,
                  attackerName: ps.playerName,
                  originX: cmd.originX, originY: cmd.originY, originName: originTile?.name || 'Unknown',
                  isRead: false
                });
              }

              // Incoming report (for defender — player was attacked)
              if (isPlayerDefender && !isPlayerAttacker) {
                nRep.unshift({
                  id: Math.random().toString(36).substr(2, 9), timestamp: now, targetX: cmd.targetX, targetY: cmd.targetY, targetName: tile.name || 'Your Village',
                  type: cmd.type, result: attackerWon ? 'defeat' as const : 'victory' as const, direction: 'incoming',
                  loot, attackerUnits: cmd.units, attackerLosses: aL, defenderUnits: nMap[tIdx].units, defenderLosses: dL,
                  attackerName: originTile?.owner || 'Barbarian',
                  originX: cmd.originX, originY: cmd.originY, originName: originTile?.name || 'Barbarian Outpost',
                  isRead: false
                });
              }

              nMap[tIdx] = tile;
              nCmd.push({ ...cmd, status: 'returning', returnsAt: now + cmd.travelDurationMs, loot, units: sAtk });
            }
          } else if (cmd.status === 'returning' && now >= cmd.returnsAt) {
            const originIdx = nMap.findIndex(t => t.x === cmd.originX && t.y === cmd.originY);
            if (originIdx !== -1 && nMap[originIdx].units && nMap[originIdx].resources) {
               (Object.keys(cmd.units) as (keyof Units)[]).forEach(u => (nMap[originIdx].units as any)[u] += (cmd.units[u] || 0));
               const or = nMap[originIdx].resources!;
               or.wood += cmd.loot.wood; or.clay += cmd.loot.clay; or.iron += cmd.loot.iron;
               or.grain = (or.grain || 0) + (cmd.loot.grain || 0); or.meat = (or.meat || 0) + (cmd.loot.meat || 0); or.fish = (or.fish || 0) + (cmd.loot.fish || 0);
            }
          } else { nCmd.push(cmd); }
        });

        // 3. Barbarian passive growth
        nMap = nMap.map(t => {
          if (t.owner !== 'Barbarian' || !t.buildings || !t.resources) return t;
          const res = { ...t.resources }; res.wood += getProductionRate(t.buildings.timberCamp)/3600; res.clay += getProductionRate(t.buildings.clayPit)/3600; res.iron += getProductionRate(t.buildings.ironMine)/3600;
          const units = { ...t.units };
          if (Math.random() < 0.05) {
            if (res.wood >= 50 && res.clay >= 30 && res.iron >= 10) {
              if (Math.random() > 0.5) units.swordman = (units.swordman || 0) + 1; else units.pikeman = (units.pikeman || 0) + 1;
              res.wood -= 50; res.clay -= 30; res.iron -= 10;
            }
          }
          return { ...t, resources: res, units };
        });

        // 4. Barbarian raids on player villages (random chance every tick)
        if (Math.random() < 0.003) { // ~0.3% per second, roughly once every 5-6 minutes
          const playerVillages = nMap.filter(t => t.owner === ps.playerName);
          const barbarianVillages = nMap.filter(t => t.owner === 'Barbarian' && t.units &&
            ((t.units.pikeman || 0) + (t.units.swordman || 0)) >= 5
          );
          if (playerVillages.length > 0 && barbarianVillages.length > 0) {
            // Pick random player village as target
            const target = playerVillages[Math.floor(Math.random() * playerVillages.length)];
            // Pick nearest barbarian with troops
            const sorted = barbarianVillages
              .map(b => ({ b, dist: Math.sqrt(Math.pow(b.x - target.x, 2) + Math.pow(b.y - target.y, 2)) }))
              .filter(e => e.dist < 15) // Only nearby barbarians
              .sort((a, b) => a.dist - b.dist);
            if (sorted.length > 0) {
              const attacker = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))].b;
              // Send 30-70% of their troops
              const ratio = 0.3 + Math.random() * 0.4;
              const raidUnits: Partial<Units> = {};
              let hasUnits = false;
              let slowestSpeed = 0;
              (['pikeman', 'swordman', 'axeman'] as (keyof Units)[]).forEach(u => {
                const count = Math.floor((attacker.units![u] || 0) * ratio);
                if (count > 0) {
                  raidUnits[u] = count;
                  hasUnits = true;
                  if (UNIT_ATLAS[u].speed > slowestSpeed) slowestSpeed = UNIT_ATLAS[u].speed;
                }
              });
              if (hasUnits && slowestSpeed > 0) {
                const dist = Math.sqrt(Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2));
                const travelMs = Math.floor(dist * slowestSpeed) * 1000;
                // Deduct units from barbarian village
                const aIdx = nMap.findIndex(t => t.id === attacker.id);
                if (aIdx !== -1) {
                  const au = { ...nMap[aIdx].units };
                  (Object.keys(raidUnits) as (keyof Units)[]).forEach(u => (au as any)[u] -= (raidUnits[u] || 0));
                  nMap[aIdx] = { ...nMap[aIdx], units: au };
                }
                nCmd.push({
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'attack',
                  status: 'marching',
                  originX: attacker.x, originY: attacker.y,
                  targetX: target.x, targetY: target.y,
                  units: raidUnits,
                  travelDurationMs: travelMs,
                  arrivesAt: now + travelMs,
                  returnsAt: 0,
                  loot: { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 },
                });
              }
            }
          }
        }

        return { ...ps, activeCommands: nCmd, reports: nRep, worldMap: nMap, lastTick: now };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const setActiveVillageId = (id: string) => setState(p => ({ ...p, activeVillageId: id }));

  const upgradeBuilding = (b: keyof Buildings) => {
    if (!activeVillage || (activeVillage.upgrades?.length || 0) >= 3) return alert("Queue full!");
    const lvl = (activeVillage.buildings![b] || 0) + activeVillage.upgrades!.filter(u => u.building === b).length + 1;
    if (lvl > MAX_LEVELS[b]) return alert("Max level!");
    // Check building prerequisites
    const reqs = BUILDING_REQUIREMENTS[b];
    for (const req of reqs) {
      if ((activeVillage.buildings![req.requires] || 0) < req.level) {
        return alert(`Requires ${req.requires} level ${req.level}!`);
      }
    }
    const mult = Math.pow(1.2, lvl - 1); const sp = ['castle','barracks','cityWall','stable','palace'].includes(b);
    const cost = { wood: (sp ? 200 : 100) * mult, clay: (sp ? 200 : 100) * mult, iron: (sp ? 200 : 100) * mult };
    if (activeVillage.resources!.wood >= cost.wood && activeVillage.resources!.clay >= cost.clay && activeVillage.resources!.iron >= cost.iron) {
      const t = (sp ? 120 : 60) * Math.pow(1.2, lvl - 1);
      const s = activeVillage.upgrades!.length > 0 ? activeVillage.upgrades![activeVillage.upgrades!.length - 1].completesAt : Date.now();
      updateWorldTile(activeVillage.x, activeVillage.y, { 
        resources: { ...activeVillage.resources!, wood: activeVillage.resources!.wood - cost.wood, clay: activeVillage.resources!.clay - cost.clay, iron: activeVillage.resources!.iron - cost.iron },
        upgrades: [...activeVillage.upgrades!, { id: Math.random().toString(36).substr(2, 9), building: b, targetLevel: lvl, completesAt: s + t * 1000 }] 
      });
    } else alert("No resources!");
  };

  const recruitUnit = (u: keyof Units, count: number = 1) => {
    const d = UNIT_ATLAS[u];
    if (!activeVillage || activeVillage.buildings![d.reqB] < d.reqLvl) return alert(`Requires ${d.reqB} level ${d.reqLvl}!`);
    if (u === 'knight' && (activeVillage.units![u]! + activeVillage.recruitment!.filter(r => r.unit === 'knight').length) >= 1) return alert("Max 1 Knight!");

    // Population cap check
    const currentPop = getCurrentPopulation(activeVillage.units!, activeVillage.recruitment);
    const maxPop = getMaxPopulation(activeVillage.buildings!.residence || 0);
    const popNeeded = count * d.pop;
    const popAvailable = maxPop - currentPop;
    const maxByPop = Math.floor(popAvailable / d.pop);
    if (maxByPop <= 0) return alert(`Population cap reached! (${currentPop}/${maxPop}) Upgrade Residence.`);

    // Clamp to what we can afford and what pop allows
    const affordCount = Math.min(count, maxByPop,
      Math.floor(activeVillage.resources!.wood / d.w),
      Math.floor(activeVillage.resources!.clay / d.c),
      Math.floor(activeVillage.resources!.iron / d.i)
    );
    if (affordCount <= 0) return alert("Insufficient resources!");

    const totalW = d.w * affordCount, totalC = d.c * affordCount, totalI = d.i * affordCount;
    const trainTime = d.time * (['knight','nobleman'].includes(u) ? 1 : Math.pow(0.95, activeVillage.buildings![d.reqB] - 1));

    // Build queue entries
    const newRec = [...activeVillage.recruitment!];
    let prevEnd = newRec.length > 0 ? newRec[newRec.length - 1].completesAt : Date.now();
    for (let i = 0; i < affordCount; i++) {
      prevEnd = prevEnd + trainTime * 1000;
      newRec.push({ id: Math.random().toString(36).substr(2, 9), unit: u, completesAt: prevEnd });
    }

    updateWorldTile(activeVillage.x, activeVillage.y, {
      resources: { ...activeVillage.resources!, wood: activeVillage.resources!.wood - totalW, clay: activeVillage.resources!.clay - totalC, iron: activeVillage.resources!.iron - totalI },
      recruitment: newRec
    });
  };

  const dispatchArmy = (tX: number, tY: number, units: Partial<Units>, type: 'attack' | 'scout') => {
    if (!activeVillage) return;
    let sp = 0; (Object.keys(units) as (keyof Units)[]).forEach(k => { if ((units[k] ?? 0) > 0 && UNIT_ATLAS[k].speed > sp) sp = UNIT_ATLAS[k].speed; });
    if (sp === 0) return alert("No units!");
    const t = Math.floor(Math.sqrt(Math.pow(tX - activeVillage.x, 2) + Math.pow(tY - activeVillage.y, 2)) * sp) * 1000;
    setState(p => {
      const nMap = p.worldMap.map(tile => {
        if (tile.id === activeVillage.id) {
          const nU = { ...tile.units };
          (Object.keys(units) as (keyof Units)[]).forEach(k => (nU as any)[k] -= (units[k] || 0));
          return { ...tile, units: nU };
        }
        return tile;
      });
      return { ...p, worldMap: nMap, activeCommands: [...p.activeCommands, { id: Math.random().toString(36).substr(2, 9), type, status: 'marching', originX: activeVillage.x, originY: activeVillage.y, targetX: tX, targetY: tY, units, travelDurationMs: t, arrivesAt: Date.now() + t, returnsAt: 0, loot: { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 } }] };
    });
  };

  const getTimeRemaining = (t: number) => Math.max(0, Math.floor((t - Date.now()) / 1000));
  const resetVillage = () => { localStorage.clear(); fetch('/api/game', { method: 'DELETE' }).finally(() => window.location.reload()); };
  const maxAllBuildings = () => updateWorldTile(activeVillage!.x, activeVillage!.y, { buildings: { ...MAX_LEVELS } });
  const addResources = () => { const r = activeVillage!.resources!; updateWorldTile(activeVillage!.x, activeVillage!.y, { resources: { wood: r.wood + 100000, clay: r.clay + 100000, iron: r.iron + 100000, grain: (r.grain || 0) + 100000, meat: (r.meat || 0) + 100000, fish: (r.fish || 0) + 100000 } }); };
  const renameVillage = (n: string) => n.trim() && updateWorldTile(activeVillage!.x, activeVillage!.y, { name: n.trim() });
  const addArmy = (a: Partial<Units>) => {
    const u = { ...activeVillage!.units };
    (Object.keys(a) as (keyof Units)[]).forEach(k => (u as any)[k] += (a[k] ?? 0));
    updateWorldTile(activeVillage!.x, activeVillage!.y, { units: u });
  };
  const markReportAsRead = (id: string) => setState(p => ({ ...p, reports: p.reports.map(r => r.id === id ? { ...r, isRead: true } : r) }));
  const updateWorldTile = (x: number, y: number, d: Partial<MapTile>) => setState(p => ({ ...p, worldMap: p.worldMap.map(t => (t.x === x && t.y === y) ? { ...t, ...d, points: d.buildings ? calculatePoints(d.buildings) : t.points } : t) }));
  const regenerateMap = () => setState(p => ({ ...p, worldMap: generateWorldMap() }));
  const setMapSettings = (settings: MapSettings) => setState(p => ({ ...p, mapSettings: settings }));

  if (!mounted) return null;
  return (
    <GameContext.Provider value={{ state, activeVillage, setActiveVillageId, upgradeBuilding, recruitUnit, dispatchArmy, MAX_LEVELS, getTimeRemaining, resetVillage, addResources, maxAllBuildings, renameVillage, markReportAsRead, addArmy, updateWorldTile, regenerateMap, playerPoints, setMapSettings }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const c = useContext(GameContext);
  if (!c) throw new Error("useGame error");
  return c;
};
