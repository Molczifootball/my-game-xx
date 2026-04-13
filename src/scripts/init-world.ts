import 'dotenv/config';
import { getPrisma } from '../lib/db';
import { getTerrainType } from '../utils/mapUtils';
import { calculatePoints } from '../utils/shared';

async function seedWorld() {
  const prisma = getPrisma();
  const W = 100;
  const H = 100;

  console.log(`🚀 Seeding a ${W}x${H} world (10,000 tiles)...`);

  // Check if map already exists
  const count = await prisma.worldTile.count();
  if (count > 0) {
    console.log('⚠️ World already seeded. Skipping.');
    return;
  }

  const batchSize = 500;
  let tiles = [];

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const worldX = x + 1;
      const worldY = y + 1;
      
      const terrain = getTerrainType(worldX, worldY);
      
      // Determine if this should be a barbarian village
      // Dense near center (50|50), sparse at edges
      const dist = Math.sqrt(Math.pow(worldX - 55, 2) + Math.pow(worldY - 55, 2));
      const probability = Math.max(0.02, 0.40 - (dist / 60));
      
      const isBarbarian = terrain !== 'water' && terrain !== 'forest' && Math.random() < probability;
      const type = isBarbarian ? 'village' : terrain;

      let b = null, r = null, u = null;
      if (isBarbarian) {
        b = { 
          headquarters: Math.floor(Math.random() * 8) + 1, 
          timberCamp: Math.floor(Math.random() * 10), 
          clayPit: Math.floor(Math.random() * 10), 
          ironMine: Math.floor(Math.random() * 10), 
          warehouse: Math.floor(Math.random() * 8) + 1, 
          granary: Math.floor(Math.random() * 5), 
          cityWall: Math.floor(Math.random() * 5), 
          barracks: Math.floor(Math.random() * 5), 
          stable: 0, castle: 0, palace: 0, 
          farm: Math.floor(Math.random() * 10) + 1, 
          huntersLodge: 0, fishery: 0, residence: Math.floor(Math.random() * 5) + 1 
        };
        r = { 
          wood: Math.floor(Math.random() * 2000), 
          clay: Math.floor(Math.random() * 2000), 
          iron: Math.floor(Math.random() * 2000), 
          grain: Math.floor(Math.random() * 1000), 
          meat: 0, fish: 0 
        };
        u = { pikeman: Math.floor(Math.random() * 10), swordman: Math.floor(Math.random() * 5) };
      }

      tiles.push({
        x: worldX,
        y: worldY,
        type,
        name: isBarbarian ? 'Wilderlands Outpost' : undefined,
        ownerId: null,
        ownerName: isBarbarian ? 'Barbarian' : undefined,
        buildings: b || {},
        resources: r || {},
        units: u || {},
        endorsement: isBarbarian ? 100 : undefined,
      });

      if (tiles.length >= batchSize) {
        await prisma.worldTile.createMany({ data: tiles });
        tiles = [];
        console.log(`... progress: ${worldX}|${worldY}`);
      }
    }
  }

  if (tiles.length > 0) {
    await prisma.worldTile.createMany({ data: tiles });
  }

  console.log('✅ World seeding complete!');
}

seedWorld()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
