import { MapTile } from '@/context/GameContext';

/** Build a fast O(1) tile lookup indexed by "x|y" */
export function buildTileIndex(worldMap: MapTile[]): Map<string, MapTile> {
  const idx = new Map<string, MapTile>();
  for (const t of worldMap) {
    idx.set(`${t.x}|${t.y}`, t);
  }
  return idx;
}

/** Compute set of revealed tile keys ("x|y") for fog of war */
export function computeRevealedTiles(
  worldMap: MapTile[],
  playerName: string,
  visionRadius: number = 4
): Set<string> {
  const revealed = new Set<string>();
  const rSq = visionRadius * visionRadius;

  for (const tile of worldMap) {
    // Player villages reveal surrounding area
    if (tile.owner === playerName) {
      for (let dx = -visionRadius; dx <= visionRadius; dx++) {
        for (let dy = -visionRadius; dy <= visionRadius; dy++) {
          if (dx * dx + dy * dy <= rSq) {
            revealed.add(`${tile.x + dx}|${tile.y + dy}`);
          }
        }
      }
    }
    // Scouted tiles are revealed
    if (tile.scoutedAt) {
      revealed.add(`${tile.x}|${tile.y}`);
      // Also reveal 1 tile around scouted locations
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          revealed.add(`${tile.x + dx}|${tile.y + dy}`);
        }
      }
    }
  }

  return revealed;
}

/** Seeded pseudo-random for deterministic terrain */
export function seededRandom(x: number, y: number, seed: number = 42): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h >>> 0) / 4294967296;
}

/** Simple 2D noise for terrain clustering */
export function terrainNoise(x: number, y: number, scale: number = 0.15): number {
  const sx = x * scale;
  const sy = y * scale;
  return (
    Math.sin(sx * 1.7 + sy * 0.9) * 0.3 +
    Math.cos(sx * 0.8 - sy * 1.3) * 0.3 +
    Math.sin((sx + sy) * 1.1) * 0.4
  );
}

/** Determine terrain type for a non-village tile */
export function getTerrainType(x: number, y: number): 'grass' | 'forest' | 'mountain' | 'water' {
  const n = terrainNoise(x, y, 0.2);
  const r = seededRandom(x, y, 77);

  // Water: river-like bands using sine wave
  const river = Math.sin(x * 0.12 + y * 0.08) + Math.cos(y * 0.15 - x * 0.05);
  if (river > 1.55 && r < 0.7) return 'water';

  // Mountains: clustered in high-noise regions
  if (n > 0.35 && r < 0.6) return 'mountain';

  // Forests: medium-noise or edge-biased
  const edgeDist = Math.min(x - 1, y - 1, 50 - x, 50 - y);
  const forestBias = edgeDist < 8 ? 0.3 : 0;
  if ((n > 0.0 && n < 0.35 && r < 0.35 + forestBias) || (edgeDist < 5 && r < 0.4)) return 'forest';

  return 'grass';
}

/** Color for minimap tiles */
export function getMinimapColor(type: MapTile['type'], owner?: string, playerName?: string): string {
  if (type === 'village' || type === 'player') {
    if (owner === playerName) return '#3b82f6'; // blue
    if (owner === 'Barbarian') return '#6b7280'; // grey
    return '#ef4444'; // red
  }

  switch (type) {
    case 'forest': return '#1a3a1a';
    case 'mountain': return '#5a5a4a';
    case 'water': return '#1a3a6a';
    case 'grass': return '#2d4a2d';
    case 'empty': return '#111316';
    default: return '#111316';
  }
}

/** Tile rotation transform for visual variety */
export function getTileRotation(x: number, y: number): string {
  const hash = (x * 7 + y * 13) % 4;
  switch (hash) {
    case 0: return '';
    case 1: return 'rotate(90deg)';
    case 2: return 'rotate(180deg)';
    case 3: return 'scaleX(-1)';
    default: return '';
  }
}
