"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { calculatePoints } from "@/utils/shared";
import { getTerrainType } from "@/utils/mapUtils";

// Resource types
export interface Resources {
  wood: number;
  clay: number;
  iron: number;
}

// Building levels
export interface Buildings {
  headquarters: number;
  timberCamp: number;
  clayPit: number;
  ironMine: number;
  warehouse: number;
  cityWall: number;
  barracks: number;
  stable: number;
  castle: number;
  palace: number;
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

export const UNIT_ATLAS: Record<keyof Units, { name: string, reqB: keyof Buildings, reqLvl: number, w: number, c: number, i: number, time: number, speed: number, carry: number, atk: number, def: number, defCav: number, defArch: number }> = {
  pikeman: { name: "Pikeman", reqB: 'barracks', reqLvl: 1, w: 50, c: 30, i: 10, time: 15, speed: 8, carry: 25, atk: 10, def: 15, defCav: 45, defArch: 20 },
  swordman: { name: "Swordsman", reqB: 'barracks', reqLvl: 1, w: 50, c: 30, i: 10, time: 20, speed: 10, carry: 15, atk: 25, def: 50, defCav: 15, defArch: 40 },
  axeman: { name: "Axeman", reqB: 'barracks', reqLvl: 2, w: 50, c: 30, i: 10, time: 18, speed: 8, carry: 10, atk: 40, def: 10, defCav: 5, defArch: 10 },
  archer: { name: "Archer", reqB: 'barracks', reqLvl: 5, w: 100, c: 30, i: 60, time: 25, speed: 8, carry: 10, atk: 15, def: 50, defCav: 40, defArch: 5 },
  scout: { name: "Scout", reqB: 'stable', reqLvl: 1, w: 50, c: 50, i: 20, time: 10, speed: 3, carry: 0, atk: 0, def: 2, defCav: 1, defArch: 2 },
  lightCavalry: { name: "Light Cavalry", reqB: 'stable', reqLvl: 3, w: 125, c: 100, i: 250, time: 30, speed: 4, carry: 80, atk: 130, def: 30, defCav: 40, defArch: 30 },
  heavyCavalry: { name: "Heavy Cavalry", reqB: 'stable', reqLvl: 5, w: 200, c: 150, i: 600, time: 45, speed: 5, carry: 50, atk: 150, def: 200, defCav: 80, defArch: 180 },
  horseArcher: { name: "Horse Archer", reqB: 'stable', reqLvl: 5, w: 250, c: 100, i: 150, time: 35, speed: 5, carry: 50, atk: 120, def: 40, defCav: 30, defArch: 50 },
  knight: { name: "Knight", reqB: 'castle', reqLvl: 1, w: 1000, c: 1000, i: 1000, time: 120, speed: 4, carry: 100, atk: 150, def: 250, defCav: 250, defArch: 250 },
  nobleman: { name: "Nobleman", reqB: 'palace', reqLvl: 1, w: 40000, c: 50000, i: 50000, time: 300, speed: 20, carry: 0, atk: 30, def: 100, defCav: 100, defArch: 100 },
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
  recruitUnit: (unit: keyof Units) => void;
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
  headquarters: 20, timberCamp: 30, clayPit: 30, ironMine: 30, warehouse: 20, cityWall: 20, barracks: 25, stable: 20, castle: 1, palace: 1,
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
          ? { headquarters: 1, timberCamp: 1, clayPit: 1, ironMine: 1, warehouse: 1, cityWall: 0, barracks: 0, stable: 0, castle: 0, palace: 0 }
          : { headquarters: Math.floor(Math.random() * 15) + 1, timberCamp: Math.floor(Math.random() * 20), clayPit: Math.floor(Math.random() * 20), ironMine: Math.floor(Math.random() * 20), warehouse: Math.floor(Math.random() * 10) + 1, cityWall: Math.floor(Math.random() * 10), barracks: Math.floor(Math.random() * 10), stable: Math.floor(Math.random() * 5), castle: 0, palace: 0 };
        r = isPlayer ? { wood: 500, clay: 500, iron: 500 } : { wood: Math.floor(Math.random() * 5000), clay: Math.floor(Math.random() * 5000), iron: Math.floor(Math.random() * 5000) };
        u = isPlayer ? { pikeman: 0, swordman: 0, axeman: 0, archer: 0, scout: 0, lightCavalry: 0, heavyCavalry: 0, horseArcher: 0, knight: 0, nobleman: 0 } : { pikeman: Math.floor(Math.random() * 20), swordman: Math.floor(Math.random() * 10) };
        if (isPlayer) { up = []; rec = []; }
      }

      map.push({
        id: `${x + 1}|${y + 1}`, x: x + 1, y: y + 1, type,
        name: isBarbarian ? 'Barbarian Outpost' : isPlayer ? 'Capital Village' : undefined,
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
    const saved = localStorage.getItem("tribalWarsCloneState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Robust check for existing world map data
        if (parsed.worldMap && Array.isArray(parsed.worldMap) && parsed.worldMap.length > 0) {
           setState({ ...parsed, lastTick: Date.now() });
        } else {
           setState({ ...initialGameState, worldMap: generateWorldMap(), lastTick: Date.now() });
        }
      } catch (e) { 
        console.error("Failed to load map state:", e);
        setState({ ...initialGameState, worldMap: generateWorldMap(), lastTick: Date.now() }); 
      }
    } else {
      setState({ ...initialGameState, worldMap: generateWorldMap(), lastTick: Date.now() });
    }
    setMounted(true);
  }, []);

  useEffect(() => { if (mounted) localStorage.setItem("tribalWarsCloneState", JSON.stringify(state)); }, [state, mounted]);

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

          // Building Upgrades
          const nUpg = (tile.upgrades || []).filter(u => {
            if (now >= u.completesAt) { tb[u.building] = u.targetLevel; return false; }
            return true;
          });

          // Unit Recruitment
          const nRec = (tile.recruitment || []).filter(r => {
            if (now >= r.completesAt) { (tu as any)[r.unit] = (tu[r.unit] || 0) + 1; return false; }
            return true;
          });

          return { ...tile, buildings: tb, resources: tr, units: tu, upgrades: nUpg, recruitment: nRec, points: calculatePoints(tb) };
        });

        // 2. Process active commands
        ps.activeCommands.forEach((cmd) => {
          if (cmd.status === 'marching' && now >= cmd.arrivesAt) {
            const tIdx = nMap.findIndex(t => t.x === cmd.targetX && t.y === cmd.targetY);
            if (tIdx !== -1) {
              const tile = { ...nMap[tIdx] };
              let loot = { wood: 0, clay: 0, iron: 0 };
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
                    loot.iron = Math.min(Math.floor(r.iron), cap); r.iron -= loot.iron;
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
              nRep.unshift({
                id: Math.random().toString(36).substr(2, 9), timestamp: now, targetX: cmd.targetX, targetY: cmd.targetY, targetName: tile.name || 'Barbarian',
                type: cmd.type, result: cmd.type === 'scout' ? 'scouted' : (Object.entries(sAtk).some(([k, v]) => k !== 'scout' && (v || 0) > 0) ? 'victory' : 'defeat'),
                loot, attackerUnits: cmd.units, attackerLosses: aL, defenderUnits: nMap[tIdx].units, defenderLosses: dL,
                targetResources: scoutIntel?.resources, targetUnits: scoutIntel?.units, targetBuildings: scoutIntel?.buildings,
                attackerName: ps.playerName,
                originX: cmd.originX, originY: cmd.originY, originName: originTile?.name || 'Unknown',
                isRead: false 
              });

              nMap[tIdx] = tile;
              nCmd.push({ ...cmd, status: 'returning', returnsAt: now + cmd.travelDurationMs, loot, units: sAtk });
            }
          } else if (cmd.status === 'returning' && now >= cmd.returnsAt) {
            const originIdx = nMap.findIndex(t => t.x === cmd.originX && t.y === cmd.originY);
            if (originIdx !== -1 && nMap[originIdx].units && nMap[originIdx].resources) {
               (Object.keys(cmd.units) as (keyof Units)[]).forEach(u => (nMap[originIdx].units as any)[u] += (cmd.units[u] || 0));
               nMap[originIdx].resources!.wood += cmd.loot.wood; nMap[originIdx].resources!.clay += cmd.loot.clay; nMap[originIdx].resources!.iron += cmd.loot.iron;
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

        return { ...ps, activeCommands: nCmd, reports: nRep, worldMap: nMap, lastTick: now };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  const setActiveVillageId = (id: string) => setState(p => ({ ...p, activeVillageId: id }));

  const upgradeBuilding = (b: keyof Buildings) => {
    if (!activeVillage || (activeVillage.upgrades?.length || 0) >= 3) return alert("Queue full!");
    const lvl = activeVillage.buildings![b] + activeVillage.upgrades!.filter(u => u.building === b).length + 1;
    if (lvl > MAX_LEVELS[b]) return alert("Max level!");
    const mult = Math.pow(1.2, lvl - 1); const sp = ['castle','barracks','cityWall','stable','palace'].includes(b);
    const cost = { wood: (sp ? 200 : 100) * mult, clay: (sp ? 200 : 100) * mult, iron: (sp ? 200 : 100) * mult };
    if (activeVillage.resources!.wood >= cost.wood && activeVillage.resources!.clay >= cost.clay && activeVillage.resources!.iron >= cost.iron) {
      const t = (sp ? 20 : 10) * Math.pow(1.15, lvl - 1);
      const s = activeVillage.upgrades!.length > 0 ? activeVillage.upgrades![activeVillage.upgrades!.length - 1].completesAt : Date.now();
      updateWorldTile(activeVillage.x, activeVillage.y, { 
        resources: { wood: activeVillage.resources!.wood - cost.wood, clay: activeVillage.resources!.clay - cost.clay, iron: activeVillage.resources!.iron - cost.iron }, 
        upgrades: [...activeVillage.upgrades!, { id: Math.random().toString(36).substr(2, 9), building: b, targetLevel: lvl, completesAt: s + t * 1000 }] 
      });
    } else alert("No resources!");
  };

  const recruitUnit = (u: keyof Units) => {
    const d = UNIT_ATLAS[u]; if (!activeVillage || activeVillage.buildings![d.reqB] < d.reqLvl) return alert(`Req ${d.reqB} ${d.reqLvl}`);
    if (u === 'knight' && (activeVillage.units![u]! + activeVillage.recruitment!.filter(r => r.unit === 'knight').length) >= 1) return alert("Max 1!");
    if (activeVillage.resources!.wood >= d.w && activeVillage.resources!.clay >= d.c && activeVillage.resources!.iron >= d.i) {
      const t = d.time * (['knight','nobleman'].includes(u) ? 1 : Math.pow(0.95, activeVillage.buildings![d.reqB] - 1));
      const s = activeVillage.recruitment!.length > 0 ? activeVillage.recruitment![activeVillage.recruitment!.length - 1].completesAt : Date.now();
      updateWorldTile(activeVillage.x, activeVillage.y, { 
        resources: { wood: activeVillage.resources!.wood - d.w, clay: activeVillage.resources!.clay - d.c, iron: activeVillage.resources!.iron - d.i }, 
        recruitment: [...activeVillage.recruitment!, { id: Math.random().toString(36).substr(2, 9), unit: u, completesAt: s + t * 1000 }] 
      });
    } else alert("No resources!");
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
      return { ...p, worldMap: nMap, activeCommands: [...p.activeCommands, { id: Math.random().toString(36).substr(2, 9), type, status: 'marching', originX: activeVillage.x, originY: activeVillage.y, targetX: tX, targetY: tY, units, travelDurationMs: t, arrivesAt: Date.now() + t, returnsAt: 0, loot: { wood: 0, clay: 0, iron: 0 } }] };
    });
  };

  const getTimeRemaining = (t: number) => Math.max(0, Math.floor((t - Date.now()) / 1000));
  const resetVillage = () => { localStorage.clear(); window.location.reload(); };
  const maxAllBuildings = () => updateWorldTile(activeVillage!.x, activeVillage!.y, { buildings: { ...MAX_LEVELS } });
  const addResources = () => updateWorldTile(activeVillage!.x, activeVillage!.y, { resources: { wood: activeVillage!.resources!.wood + 100000, clay: activeVillage!.resources!.clay + 100000, iron: activeVillage!.resources!.iron + 100000 } });
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
