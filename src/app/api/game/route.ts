import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { auth as nextAuth } from '@/lib/auth';
import { calculateTileState, resolveBattle } from '@/lib/game-engine';
import { Buildings, Resources, Units } from '@/utils/shared';

export const dynamic = 'force-dynamic';

async function getAuthAndPrisma() {
  const prisma = getPrisma();
  return { auth: nextAuth, prisma };
}

// Helper: Find a spawn point for new players
async function spawnPlayer(prisma: any, userId: string, playerName: string) {
  // Find a random grass tile that isn't near too many players (simple logic for now)
  const grassTiles = await prisma.worldTile.findMany({
    where: { type: 'grass' },
    take: 50,
    orderBy: { updatedAt: 'asc' } // Pick older grass tiles
  });

  if (grassTiles.length === 0) throw new Error("No space left on map!");

  const spawnTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];

  // Initialize player village
  return await prisma.worldTile.update({
    where: { id: spawnTile.id },
    data: {
      type: 'player',
      ownerId: userId,
      ownerName: playerName,
      name: 'Lechitic Settlement',
      buildings: { headquarters: 1, timberCamp: 1, clayPit: 1, ironMine: 1, warehouse: 1, granary: 1, cityWall: 0, barracks: 0, stable: 0, castle: 0, palace: 0, farm: 1, huntersLodge: 0, fishery: 0, residence: 1 },
      resources: { wood: 500, clay: 500, iron: 500, grain: 500, meat: 100, fish: 100 },
      units: { pikeman: 0, swordman: 0 },
      updatedAt: new Date()
    }
  });
}

// GET — Load game state + Nearby map for current user
export async function GET(req: NextRequest) {
  try {
    const { prisma } = await getAuthAndPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const userId = session.user.id;
    const playerName = session.user.name || 'Player';

    // 1. Get player's village(s)
    let villages = await prisma.worldTile.findMany({ where: { ownerId: userId } });

    // 2. If no village, spawn the player
    if (villages.length === 0) {
      const newVillage = await spawnPlayer(prisma, userId, playerName);
      villages = [newVillage];
    }

    // 3. Process each village (Lazy Update)
    const processedVillages = await Promise.all(villages.map(async (v: any) => {
      const updated = calculateTileState(
        v.buildings as Buildings, 
        v.resources as Resources, 
        v.units as Units, 
        v.updatedAt
      );
      if (updated.lastUpdated !== v.updatedAt.getTime()) {
        // Save back lazy update
        return await prisma.worldTile.update({
          where: { id: v.id },
          data: { resources: updated.resources, updatedAt: new Date(updated.lastUpdated) }
        });
      }
      return v;
    }));

    // 4. Fetch nearby world map (e.g. 30x30 around first village)
    const first = processedVillages[0];
    const range = 15;
    const worldMap = await prisma.worldTile.findMany({
      where: {
        x: { gte: first.x - range, lte: first.x + range },
        y: { gte: first.y - range, lte: first.y + range }
      }
    });

    // 5. Get active commands (Only related to player)
    const commands = await prisma.combatCommand.findMany({
      where: {
        OR: [{ ownerId: userId }, { targetOwnerId: userId }]
      }
    });

    return NextResponse.json({
      playerName,
      activeVillageId: `${first.x}|${first.y}`,
      villages: processedVillages,
      worldMap,
      commands
    });
  } catch (error) {
    console.error('Failed to load multiplayer session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Handle specific actions (Upgrade, Recruit, Dispatch)
export async function POST(req: NextRequest) {
  try {
    const { prisma } = await getAuthAndPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { action, payload } = await req.json();
    const userId = session.user.id;

    if (action === 'upgrade') {
      const { x, y, building } = payload;
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x, y } } });
      if (!tile) return NextResponse.json({ error: 'Village not found' }, { status: 404 });
      if (tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      // Lazy update first to get current resources
      const state = calculateTileState(
        tile.buildings as Buildings, 
        tile.resources as Resources, 
        tile.units as Units, 
        tile.updatedAt
      );
      const lvl = (state.buildings[building] || 0) + 1;
      
      // Verification: simplified for this step
      const cost = 100 * Math.pow(1.2, lvl - 1);
      if (state.resources.wood < cost) return NextResponse.json({ error: 'Too expensive' }, { status: 400 });

      // Execute upgrade
      const nB = { ...state.buildings, [building]: lvl };
      const nR = { ...state.resources, wood: state.resources.wood - cost };

      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { buildings: nB, resources: nR, updatedAt: new Date() }
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'recruit') {
      const { x, y, unit, count } = payload;
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x, y } } });
      if (!tile) return NextResponse.json({ error: 'Village not found' }, { status: 404 });
      if (tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      const state = calculateTileState(
        tile.buildings as Buildings, 
        tile.resources as Resources, 
        tile.units as Units, 
        tile.updatedAt
      );
      const nU = { ...state.units, [unit]: (state.units[unit] || 0) + count };

      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { units: nU, updatedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'dispatch') {
      const { originX, originY, targetX, targetY, units, type } = payload;
      const origin = await prisma.worldTile.findUnique({ where: { x_y: { x: originX, y: originY } } });
      const target = await prisma.worldTile.findUnique({ where: { x_y: { x: targetX, y: targetY } } });
      if (!origin) return NextResponse.json({ error: 'Origin not found' }, { status: 404 });
      if (origin.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      // Calculate travel time (simplified)
      const dist = Math.sqrt(Math.pow(targetX - originX, 2) + Math.pow(targetY - originY, 2));
      const travelTimeMs = dist * 10 * 1000; // 10s per tile for now

      await prisma.combatCommand.create({
        data: {
          type,
          status: 'marching',
          originX, originY,
          targetX, targetY,
          units,
          returnsAt: new Date(Date.now() + travelTimeMs * 2), // Round trip storage
          arrivesAt: new Date(Date.now() + travelTimeMs),
          ownerId: userId,
          targetOwnerId: target?.ownerId || null,
        }
      });

      // Deduct units from origin
      const currentUnits = (origin.units as any) || {};
      const nU = { ...currentUnits };
      Object.entries(units).forEach(([u, count]) => {
        if (nU[u]) nU[u] -= (count as number);
      });

      await prisma.worldTile.update({
        where: { id: origin.id },
        data: { units: nU, updatedAt: new Date() }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Action failed:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
