import { 
  Buildings, Resources, Units, UNIT_ATLAS, calculatePoints, 
  getProductionRate, getGrainProduction, getMeatProduction, getFishProduction, 
  getGranaryCapacity, getWarehouseCapacity 
} from '@/utils/shared';

export interface ProcessedTile {
  buildings: Buildings;
  resources: Resources;
  units: Partial<Units>;
  lastUpdated: number;
}

/**
 * Lazy Update Engine
 * Calculates state of a tile (production, barbarian growth) based on elapsed time.
 */
export function calculateTileState(
  currentBuildings: Buildings,
  currentResources: Resources,
  currentUnits: Partial<Units>,
  lastUpdatedAt: Date,
  isBarbarian: boolean = false
): ProcessedTile {
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - lastUpdatedAt.getTime()) / 1000);
  
  const buildings = { ...currentBuildings };
  const resources = { ...currentResources };
  const units = { ...currentUnits };

  // 1. Basic Resource Production
  const warehouseCap = getWarehouseCapacity(buildings.warehouse || 1);
  resources.wood = Math.min(warehouseCap, resources.wood + (getProductionRate(buildings.timberCamp || 0) / 3600 * elapsedSeconds));
  resources.clay = Math.min(warehouseCap, resources.clay + (getProductionRate(buildings.clayPit || 0) / 3600 * elapsedSeconds));
  resources.iron = Math.min(warehouseCap, resources.iron + (getProductionRate(buildings.ironMine || 0) / 3600 * elapsedSeconds));

  // 2. Food Production & Upkeep
  const granaryCap = getGranaryCapacity(buildings.granary || 1);
  const grainProd = getGrainProduction(buildings.farm || 0);
  const meatProd = getMeatProduction(buildings.huntersLodge || 0);
  const fishProd = getFishProduction(buildings.fishery || 0);
  
  // Upkeep calculation
  let upkeepGrain = 0, upkeepFish = 0, upkeepMeat = 0;
  (Object.entries(units) as [keyof Units, number][]).forEach(([u, c]) => {
    const atlas = UNIT_ATLAS[u];
    upkeepGrain += (c || 0) * atlas.grain;
    upkeepFish += (c || 0) * atlas.fish;
    upkeepMeat += (c || 0) * atlas.meat;
  });

  const netGrain = grainProd - upkeepGrain;
  const netFish = fishProd - upkeepFish;
  const netMeat = meatProd - upkeepMeat;

  resources.grain = Math.min(granaryCap, Math.max(0, (resources.grain || 0) + netGrain / 3600 * elapsedSeconds));
  resources.fish = Math.min(granaryCap, Math.max(0, (resources.fish || 0) + netFish / 3600 * elapsedSeconds));
  resources.meat = Math.min(granaryCap, Math.max(0, (resources.meat || 0) + netMeat / 3600 * elapsedSeconds));

  // 3. Barbarian Autonomous Growth
  if (isBarbarian) {
    // Barbarians build and recruit slowly based on elapsed time
    // Probability per hour: 30% chance to upgrade or recruit
    const hours = elapsedSeconds / 3600;
    const growthCycles = Math.floor(hours * 0.3); // 0.3 chance events per hour
    
    for (let i = 0; i < growthCycles; i++) {
        const rand = Math.random();
        if (rand < 0.6) {
            // Build something
            const keys = Object.keys(buildings) as (keyof Buildings)[];
            const target = keys[Math.floor(Math.random() * keys.length)];
            if (buildings[target] < 20) buildings[target]++;
        } else {
            // Recruit basic units
            if (Math.random() > 0.5) units.pikeman = (units.pikeman || 0) + 2;
            else units.swordman = (units.swordman || 0) + 2;
        }
    }
  }

  return { buildings, resources, units, lastUpdated: now };
}

/**
 * Combat Resolution Logic
 */
export function resolveBattle(attackerUnits: Partial<Units>, defenderUnits: Partial<Units>, defenderWallLvl: number) {
  let sAtk = { ...attackerUnits };
  let sDef = { ...defenderUnits };
  let aLosses: Partial<Units> = {};
  let dLosses: Partial<Units> = {};

  // Attacker Power
  let atkP = 0;
  (Object.entries(sAtk) as [keyof Units, number][]).forEach(([u, c]) => {
    if (u !== 'scout') atkP += (c || 0) * UNIT_ATLAS[u].atk;
  });

  // Defender Power
  let defP = 0;
  (Object.entries(sDef) as [keyof Units, number][]).forEach(([u, c]) => {
    if (u !== 'scout') defP += (c || 0) * UNIT_ATLAS[u].def;
  });
  
  // Wall Bonus
  defP = (defP + (defenderWallLvl * 20)) * (1 + (defenderWallLvl * 0.04));

  if (atkP > defP) {
    // Attacker Victory
    const ratio = defP > 0 ? Math.pow(defP / atkP, 1.5) : 0;
    (Object.entries(sAtk) as [keyof Units, number][]).forEach(([u, c]) => {
      if (u !== 'scout') {
        const l = Math.floor((c || 0) * ratio);
        aLosses[u] = l;
        sAtk[u] = (c || 0) - l;
      }
    });
    // Defender wiped
    (Object.entries(sDef) as [keyof Units, number][]).forEach(([u, c]) => {
      dLosses[u] = (c || 0);
      sDef[u] = 0;
    });
    return { winner: 'attacker', attackerUnits: sAtk, defenderUnits: sDef, attackerLosses: aLosses, defenderLosses: dLosses };
  } else {
    // Defender Victory
    const ratio = atkP > 0 ? Math.pow(atkP / defP, 1.5) : 0;
    (Object.entries(sDef) as [keyof Units, number][]).forEach(([u, c]) => {
      if (u !== 'scout') {
        const l = Math.floor((c || 0) * ratio);
        dLosses[u] = l;
        sDef[u] = (c || 0) - l;
      }
    });
    // Attacker wiped
    (Object.entries(sAtk) as [keyof Units, number][]).forEach(([u, c]) => {
      aLosses[u] = (c || 0);
      sAtk[u] = 0;
    });
    return { winner: 'defender', attackerUnits: sAtk, defenderUnits: sDef, attackerLosses: aLosses, defenderLosses: dLosses };
  }
}
