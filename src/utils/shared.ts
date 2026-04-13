export interface Resources {
  [key: string]: number;
  wood: number;
  clay: number;
  iron: number;
  grain: number;
  meat: number;
  fish: number;
}

export interface Buildings {
  [key: string]: number;
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

export const getProductionRate = (lvl: number) => lvl === 0 ? 0 : 30 * Math.pow(1.15, lvl - 1);
export const getGrainProduction = (farmLevel: number) => farmLevel === 0 ? 0 : 50 * Math.pow(1.15, farmLevel - 1);
export const getMeatProduction = (lodgeLevel: number) => lodgeLevel === 0 ? 0 : 60 * Math.pow(1.15, lodgeLevel - 1);
export const getFishProduction = (fisheryLevel: number) => fisheryLevel === 0 ? 0 : 60 * Math.pow(1.15, fisheryLevel - 1);
export const getGranaryCapacity = (granaryLevel: number) => granaryLevel === 0 ? 500 : Math.floor(3000 * Math.pow(1.3, granaryLevel - 1));
export const getWarehouseCapacity = (warehouseLevel: number) => Math.floor(5000 * Math.pow(1.3, warehouseLevel - 1));
export const getMaxPopulation = (residenceLevel: number) => residenceLevel === 0 ? 10 : Math.floor(25 * Math.pow(1.22, residenceLevel - 1));

export interface Units {
  [key: string]: number;
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
  pikeman:      { name: "Pikeman",       reqB: 'barracks', reqLvl: 1,  w: 50,    c: 30,    i: 10,    grain: 1, fish: 0, meat: 0, pop: 1, time: 15,  speed: 8,  carry: 25,  atk: 10,  def: 15,  defCav: 45,  defArch: 20 },
  swordman:     { name: "Swordsman",     reqB: 'barracks', reqLvl: 1,  w: 50,    c: 30,    i: 10,    grain: 1, fish: 0, meat: 0, pop: 1, time: 20,  speed: 10, carry: 15,  atk: 25,  def: 50,  defCav: 15,  defArch: 40 },
  axeman:       { name: "Axeman",        reqB: 'barracks', reqLvl: 2,  w: 50,    c: 30,    i: 10,    grain: 2, fish: 0, meat: 0, pop: 1, time: 18,  speed: 8,  carry: 10,  atk: 40,  def: 10,  defCav: 5,   defArch: 10 },
  scout:        { name: "Scout",         reqB: 'stable',   reqLvl: 1,  w: 50,    c: 50,    i: 20,    grain: 1, fish: 0, meat: 0, pop: 1, time: 10,  speed: 3,  carry: 0,   atk: 0,   def: 2,   defCav: 1,   defArch: 2 },
  archer:       { name: "Archer",        reqB: 'barracks', reqLvl: 5,  w: 100,   c: 30,    i: 60,    grain: 0, fish: 2, meat: 0, pop: 2, time: 25,  speed: 8,  carry: 10,  atk: 15,  def: 50,  defCav: 40,  defArch: 5 },
  lightCavalry: { name: "Light Cavalry", reqB: 'stable',   reqLvl: 3,  w: 125,   c: 100,   i: 250,   grain: 0, fish: 2, meat: 0, pop: 2, time: 30,  speed: 4,  carry: 80,  atk: 130, def: 30,  defCav: 40,  defArch: 30 },
  horseArcher:  { name: "Horse Archer",  reqB: 'stable',   reqLvl: 5,  w: 250,   c: 100,   i: 150,   grain: 0, fish: 3, meat: 0, pop: 2, time: 35,  speed: 5,  carry: 50,  atk: 120, def: 40,  defCav: 30,  defArch: 50 },
  heavyCavalry: { name: "Heavy Cavalry", reqB: 'stable',   reqLvl: 5,  w: 200,   c: 150,   i: 600,   grain: 0, fish: 0, meat: 3, pop: 3, time: 45,  speed: 5,  carry: 50,  atk: 150, def: 200, defCav: 80,  defArch: 180 },
  knight:       { name: "Knight",        reqB: 'castle',   reqLvl: 1,  w: 1000,  c: 1000,  i: 1000,  grain: 0, fish: 0, meat: 5, pop: 3, time: 120, speed: 4,  carry: 100, atk: 150, def: 250, defCav: 250, defArch: 250 },
  nobleman:     { name: "Nobleman",      reqB: 'palace',   reqLvl: 1,  w: 40000, c: 50000, i: 50000, grain: 0, fish: 0, meat: 8, pop: 3, time: 300, speed: 20, carry: 0,   atk: 30,  def: 100, defCav: 100, defArch: 100 },
};

export const getFoodUpkeep = (units: Partial<Units>): { grain: number; fish: number; meat: number } => {
  let grain = 0, fish = 0, meat = 0;
  (Object.entries(units) as [keyof Units, number][]).forEach(([u, c]) => {
    grain += (c || 0) * UNIT_ATLAS[u].grain;
    fish += (c || 0) * UNIT_ATLAS[u].fish;
    meat += (c || 0) * UNIT_ATLAS[u].meat;
  });
  return { grain, fish, meat };
};

export const getCurrentPopulation = (units: Partial<Units>, recruitment?: { unit: keyof Units }[]): number => {
  let pop = 0;
  (Object.entries(units) as [keyof Units, number][]).forEach(([u, c]) => { pop += (c || 0) * UNIT_ATLAS[u].pop; });
  if (recruitment) recruitment.forEach(r => { pop += UNIT_ATLAS[r.unit].pop; });
  return pop;
};



export const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const BUILDING_META: Record<keyof Buildings, { name: string, desc: string, icon: string, image: string }> = {
  headquarters: { name: "Headquarters", desc: "Construct other buildings faster and unlock new ones.", icon: "🏰", image: "/images/headquarters.png" },
  timberCamp: { name: "Timber Camp", desc: "Produces wood necessary for buildings and weapons.", icon: "🪓", image: "/images/timberCamp.png" },
  clayPit: { name: "Clay Pit", desc: "Produces clay essential for advanced structures.", icon: "🧱", image: "/images/clayPit.png" },
  ironMine: { name: "Iron Mine", desc: "Extracts iron for recruiting strong military units.", icon: "⛏️", image: "/images/ironMine.png" },
  warehouse: { name: "Warehouse", desc: "Stores resources. Increase level to hold more.", icon: "🛖", image: "/images/warehouse.png" },
  cityWall: { name: "City Wall", desc: "Protects your village against enemy attacks.", icon: "🧱", image: "/images/cityWall.png" },
  barracks: { name: "Barracks", desc: "Train infantry units like Swordsmen and Archers.", icon: "⚔️", image: "/images/barracks.png" },
  stable: { name: "Stable", desc: "Breed warhorses and train devastating cavalry units.", icon: "🐎", image: "/images/stable.png" },
  castle: { name: "Castle", desc: "A magnificent fortress to train your loyal Knight.", icon: "🛡️", image: "/images/castle.png" },
  palace: { name: "Palace", desc: "The seat of authority. Grants the ability to train Noblemen to conquer villages.", icon: "👑", image: "/images/palace.png" },
  farm: { name: "Farm", desc: "Produces grain to feed your infantry. The backbone of your food supply.", icon: "🌾", image: "/images/headquarters.png" },
  granary: { name: "Granary", desc: "Stores grain, meat and fish. Increase level to hold more food.", icon: "🏪", image: "/images/warehouse.png" },
  huntersLodge: { name: "Hunter's Lodge", desc: "Hunters provide meat to feed your cavalry and elite units.", icon: "🏹", image: "/images/barracks.png" },
  fishery: { name: "Fishery", desc: "Catches fish from the river. Fish supplements both grain and meat.", icon: "🐟", image: "/images/headquarters.png" },
  residence: { name: "Residence", desc: "Houses for your population. Higher level allows more soldiers to be stationed.", icon: "🏠", image: "/images/headquarters.png" },
};
export const MAX_LEVELS: Record<keyof Buildings, number> = {
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

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculates travel duration in seconds based on slowest unit speed.
 * slowestSpeed is in seconds per distance unit (e.g. 60s per tile).
 */
export const calculateTravelDuration = (dist: number, slowestSpeed: number) => {
  return Math.floor(dist * slowestSpeed);
};

export const UNIT_EMOJIS: Record<string, string> = {
  pikeman: '🛡️',
  swordman: '⚔️',
  axeman: '🪓',
  archer: '🏹',
  scout: '🕵️',
  lightCavalry: '🐎',
  heavyCavalry: '🏇',
  horseArcher: '🏹🏇',
  knight: '🛡️🐎',
  nobleman: '👑',
};

export const calculatePoints = (buildings: any) => {
  return Object.values(buildings).reduce((acc: number, level: any) => acc + Math.floor(10 * Math.pow(1.2, level || 0)), 0);
};

/**
 * Calculate resource cost of upgrading a building to the next level.
 * Returns { wood, clay, iron } cost.
 */
export const getBuildCost = (building: keyof Buildings, currentLevel: number): { wood: number; clay: number; iron: number } => {
  const BASE: Record<keyof Buildings, { w: number; c: number; i: number }> = {
    headquarters: { w: 90,   c: 80,   i: 70 },
    timberCamp:   { w: 100,  c: 80,   i: 20 },
    clayPit:      { w: 75,   c: 65,   i: 40 },
    ironMine:     { w: 100,  c: 80,   i: 30 },
    warehouse:    { w: 130,  c: 165,  i: 45 },
    granary:      { w: 130,  c: 165,  i: 45 },
    cityWall:     { w: 300,  c: 200,  i: 200 },
    barracks:     { w: 200,  c: 170,  i: 90 },
    stable:       { w: 270,  c: 240,  i: 260 },
    castle:       { w: 1000, c: 1200, i: 1200 },
    palace:       { w: 1000, c: 1200, i: 1200 },
    farm:         { w: 45,   c: 40,   i: 30 },
    huntersLodge: { w: 110,  c: 80,   i: 50 },
    fishery:      { w: 90,   c: 75,   i: 60 },
    residence:    { w: 110,  c: 120,  i: 70 },
  };
  const b = BASE[building] || { w: 100, c: 100, i: 100 };
  const factor = Math.pow(1.26, currentLevel);
  return {
    wood: Math.floor(b.w * factor),
    clay: Math.floor(b.c * factor),
    iron: Math.floor(b.i * factor),
  };
};

/**
 * Calculate build duration in milliseconds for upgrading a building to the next level.
 * HQ level reduces time by up to 50% at max level (20).
 */
export const getBuildDuration = (building: keyof Buildings, currentLevel: number, hqLevel: number): number => {
  const BASE_SECS: Record<keyof Buildings, number> = {
    headquarters: 120,  timberCamp: 60,   clayPit: 60,   ironMine: 60,
    warehouse: 90,      granary: 90,      cityWall: 180,  barracks: 200,
    stable: 240,        castle: 600,      palace: 600,   farm: 50,
    huntersLodge: 90,   fishery: 90,      residence: 90,
  };
  const base = BASE_SECS[building] || 60;
  const durationSec = base * Math.pow(1.22, currentLevel);
  const hqMultiplier = Math.pow(0.95, hqLevel); // -5% per HQ level
  return Math.floor(durationSec * hqMultiplier) * 1000; // Return ms
};
