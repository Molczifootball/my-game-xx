import { Buildings } from '@/context/GameContext';

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
  farm: { name: "Farm", desc: "Produces food to sustain your army. Without food, soldiers desert.", icon: "🌾", image: "/images/headquarters.png" },
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
