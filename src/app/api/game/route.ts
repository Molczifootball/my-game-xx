import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { auth as nextAuth } from '@/lib/auth';
import { calculateTileState, resolveBattle, UpgradeEntry } from '@/lib/game-engine';
import { Buildings, Resources, Units, getBuildCost, getBuildDuration, MAX_LEVELS } from '@/utils/shared';

export const dynamic = 'force-dynamic';

async function getAuthAndPrisma() {
  const prisma = getPrisma();
  return { auth: nextAuth, prisma };
}

// Helper: Find a spawn point for new players — prefer tiles closest to center (50,50)
async function spawnPlayer(prisma: any, userId: string, playerName: string) {
  // Get all unowned grass tiles
  const grassTiles = await prisma.worldTile.findMany({
    where: { type: 'grass', ownerId: null },
  });

  if (grassTiles.length === 0) throw new Error("No space left on map!");

  // Sort by distance to center (50, 50) — closest first
  const CENTER_X = 50, CENTER_Y = 50;
  grassTiles.sort((a: any, b: any) => {
    const distA = Math.sqrt(Math.pow(a.x - CENTER_X, 2) + Math.pow(a.y - CENTER_Y, 2));
    const distB = Math.sqrt(Math.pow(b.x - CENTER_X, 2) + Math.pow(b.y - CENTER_Y, 2));
    return distA - distB;
  });

  // Pick from the 5 closest tiles randomly to avoid all players stacking on the same spot
  const candidates = grassTiles.slice(0, 5);
  const spawnTile = candidates[Math.floor(Math.random() * candidates.length)];

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

    // 3. Process each village (Lazy Update — flush upgrade queue + resources)
    const processedVillages = await Promise.all(villages.map(async (v: any) => {
      const upgrades: UpgradeEntry[] = Array.isArray(v.upgrades) ? v.upgrades : [];
      const updated = calculateTileState(
        v.buildings as Buildings, 
        v.resources as Resources, 
        v.units as Units, 
        v.updatedAt,
        false,
        upgrades
      );
      const hasChanges = updated.lastUpdated !== v.updatedAt.getTime()
        || updated.upgrades.length !== upgrades.length;
      if (hasChanges) {
        // Save back lazy update (resources + any flushed upgrades)
        return await prisma.worldTile.update({
          where: { id: v.id },
          data: { 
            buildings: updated.buildings as any,
            resources: updated.resources as any,
            upgrades: updated.upgrades as any,
            updatedAt: new Date(updated.lastUpdated)
          }
        });
      }
      return v;
    }));

    // 4. Fetch the FULL world map (all 10,000 tiles)
    const first = processedVillages[0];
    const worldMap = await prisma.worldTile.findMany({});

    // 5. COMBAT RESOLUTION LOOP
    const now = new Date();
    
    // a) Resolve expired marching commands
    const expiredMarching = await prisma.combatCommand.findMany({
      where: { status: 'marching', arrivesAt: { lte: now } }
    });
    for (const cmd of expiredMarching) {
      if (cmd.type === 'attack') {
        const targetTile = await prisma.worldTile.findUnique({ where: { x_y: { x: cmd.targetX, y: cmd.targetY } } });
        if (targetTile) {
          const tBuildings = targetTile.buildings as any || {};
          const tResources = targetTile.resources as any || {};
          const tUnits = targetTile.units as any || {};
          const bResult = resolveBattle(cmd.units as any, tUnits, tBuildings.cityWall || 0);

          let stolen = { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 };
          let survivors = bResult.attackerUnits;
          let survivingCount = Object.values(survivors).reduce((a: number, c: any) => a + (c || 0), 0);

          if (bResult.winner === 'attacker' && survivingCount > 0) {
            // Steal ~20% of resources as a baseline
            ['wood', 'clay', 'iron', 'grain', 'meat', 'fish'].forEach((res) => {
              const available = tResources[res] || 0;
              const taken = Math.floor(available * 0.2);
              stolen[res as keyof typeof stolen] = taken;
              tResources[res] = available - taken;
            });
            // Update target
            await prisma.worldTile.update({
              where: { id: targetTile.id },
              data: { resources: tResources, units: bResult.defenderUnits as any, lastAttackAt: now }
            });
          } else {
            // Update target troops if they won
            await prisma.worldTile.update({
              where: { id: targetTile.id },
              data: { units: bResult.defenderUnits as any, lastAttackAt: now }
            });
          }

          // Create Battle Report
          const attackerReport = {
            userId: cmd.ownerId,
            targetX: cmd.targetX, targetY: cmd.targetY, targetName: targetTile.name || 'Unknown',
            type: 'attack', result: bResult.winner === 'attacker' ? 'victory' : 'defeat', direction: 'outgoing',
            loot: stolen as any, isRead: false,
            attackerUnits: cmd.units as any, attackerLosses: bResult.attackerLosses as any,
            defenderUnits: bResult.defenderUnits as any, defenderLosses: bResult.defenderLosses as any
          };
          await prisma.battleReport.create({ data: attackerReport });
          
          if (targetTile.ownerId) {
            await prisma.battleReport.create({ data: { ...attackerReport, userId: targetTile.ownerId, direction: 'incoming', result: bResult.winner === 'defender' ? 'victory' : 'defeat', isRead: false } as any });
          }

          if (survivingCount > 0) {
            // Bounce it back
            await prisma.combatCommand.update({
              where: { id: cmd.id },
              data: { status: 'returning', units: survivors as any, loot: stolen }
            });
          } else {
            // Everyone died
            await prisma.combatCommand.delete({ where: { id: cmd.id } });
          }
        }
      } else if (cmd.type === 'scout') {
        const targetTile = await prisma.worldTile.findUnique({ where: { x_y: { x: cmd.targetX, y: cmd.targetY } } });
        if (targetTile) {
          // Add intel timestamp
          await prisma.worldTile.update({
             where: { id: targetTile.id },
             data: { scoutedAt: now }
          });
          const report = {
            userId: cmd.ownerId,
            targetX: cmd.targetX, targetY: cmd.targetY, targetName: targetTile.name || 'Unknown',
            type: 'scout', result: 'scouted', direction: 'outgoing',
            loot: { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 } as any, isRead: false,
            targetResources: targetTile.resources as any, targetUnits: targetTile.units as any, targetBuildings: targetTile.buildings as any
          };
          await prisma.battleReport.create({ data: report });
          // Bounce back
          await prisma.combatCommand.update({ where: { id: cmd.id }, data: { status: 'returning' } });
        }
      }
    }

    // b) Resolve returning commands
    const expiredReturning = await prisma.combatCommand.findMany({
      where: { status: 'returning', returnsAt: { lte: now } }
    });
    for (const cmd of expiredReturning) {
      const originTile = await prisma.worldTile.findUnique({ where: { x_y: { x: cmd.originX, y: cmd.originY } } });
      if (originTile) {
        const oResources = originTile.resources as any || { wood: 0, clay: 0, iron: 0, grain: 0, meat: 0, fish: 0 };
        const oUnits = originTile.units as any || {};
        const cmdLoot = cmd.loot as any || {};
        const cmdUnits = cmd.units as any || {};

        // Merge units
        Object.keys(cmdUnits).forEach(u => { oUnits[u] = (oUnits[u] || 0) + (cmdUnits[u] || 0); });
        // Deposit loot
        Object.keys(cmdLoot).forEach(res => { oResources[res] = (oResources[res] || 0) + (cmdLoot[res] || 0); });

        await prisma.worldTile.update({
          where: { id: originTile.id },
          data: { resources: oResources, units: oUnits }
        });
      }
      await prisma.combatCommand.delete({ where: { id: cmd.id } });
    }

    // 6. Get active commands (Only related to player)
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

// POST — Handle specific actions (Upgrade, Recruit, Dispatch, Dev)
export async function POST(req: NextRequest) {
  try {
    const { prisma } = await getAuthAndPrisma();
    const session = await nextAuth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { action, payload } = await req.json();
    const userId = session.user.id;

    // ── UPGRADE ──────────────────────────────────────────────────────────────
    if (action === 'upgrade') {
      const { x, y, building } = payload;
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x, y } } });
      if (!tile) return NextResponse.json({ error: 'Village not found' }, { status: 404 });
      if (tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      // Flush any completed upgrades first
      const existingUpgrades: UpgradeEntry[] = Array.isArray(tile.upgrades) ? (tile.upgrades as any[]) : [];
      const state = calculateTileState(
        tile.buildings as Buildings, tile.resources as Resources,
        tile.units as Units, tile.updatedAt, false, existingUpgrades
      );

      // Queue cap: 3 pending upgrades max
      if (state.upgrades.length >= 3) {
        return NextResponse.json({ error: 'Build queue full (max 3)' }, { status: 400 });
      }

      // Calculate virtual level based on actual level + queued upgrades of this type
      const queuedCount = state.upgrades.filter(u => u.building === building).length;
      const currentLevel = (state.buildings[building as keyof Buildings] || 0) + queuedCount;
      const maxLvl = MAX_LEVELS[building as keyof Buildings];
      if (currentLevel >= maxLvl) {
        return NextResponse.json({ error: 'Already at max level' }, { status: 400 });
      }

      // Resource cost
      const cost = getBuildCost(building as keyof Buildings, currentLevel);
      if (state.resources.wood < cost.wood || state.resources.clay < cost.clay || state.resources.iron < cost.iron) {
        return NextResponse.json({ error: 'Insufficient resources' }, { status: 400 });
      }

      // Build duration (HQ reduces time)
      const hqLvl = state.buildings.headquarters || 1;
      const durationMs = getBuildDuration(building as keyof Buildings, currentLevel, hqLvl);

      // Push to upgrade queue. If queue is not empty, start timer from last item's completesAt
      const lastCompletesAt = state.upgrades.length > 0 
        ? Math.max(Date.now(), ...state.upgrades.map(u => u.completesAt))
        : Date.now();
      const completesAt = lastCompletesAt + durationMs;

      const newUpgrade: UpgradeEntry = {
        id: `${building}-${completesAt}`,
        building: building as keyof Buildings,
        targetLevel: currentLevel + 1,
        completesAt,
      };
      const newUpgrades = [...state.upgrades, newUpgrade];

      // Deduct resources
      const newResources = {
        ...state.resources,
        wood: state.resources.wood - cost.wood,
        clay: state.resources.clay - cost.clay,
        iron: state.resources.iron - cost.iron,
      };

      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { 
          buildings: state.buildings as any,
          resources: newResources as any, 
          upgrades: newUpgrades as any,
          updatedAt: new Date(state.lastUpdated)
        }
      });

      return NextResponse.json({ success: true, completesAt, durationMs });
    }

    // ── RECRUIT ──────────────────────────────────────────────────────────────
    if (action === 'recruit') {
      const { x, y, unit, count } = payload;
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x, y } } });
      if (!tile) return NextResponse.json({ error: 'Village not found' }, { status: 404 });
      if (tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      const state = calculateTileState(
        tile.buildings as Buildings, tile.resources as Resources,
        tile.units as Units, tile.updatedAt
      );
      const nU = { ...state.units, [unit]: (state.units[unit as keyof Units] || 0) + count };

      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { units: nU, updatedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    // ── DISPATCH ─────────────────────────────────────────────────────────────
    if (action === 'dispatch') {
      const { originX, originY, targetX, targetY, units, type } = payload;
      const origin = await prisma.worldTile.findUnique({ where: { x_y: { x: originX, y: originY } } });
      const target = await prisma.worldTile.findUnique({ where: { x_y: { x: targetX, y: targetY } } });
      if (!origin) return NextResponse.json({ error: 'Origin not found' }, { status: 404 });
      if (origin.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

      const dist = Math.sqrt(Math.pow(targetX - originX, 2) + Math.pow(targetY - originY, 2));
      const travelTimeMs = dist * 10 * 1000;

      await prisma.combatCommand.create({
        data: {
          type, status: 'marching',
          originX, originY, targetX, targetY, units,
          returnsAt: new Date(Date.now() + travelTimeMs * 2),
          arrivesAt: new Date(Date.now() + travelTimeMs),
          ownerId: userId,
          targetOwnerId: target?.ownerId || null,
        }
      });

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

    // ── RENAME ───────────────────────────────────────────────────────────────
    if (action === 'rename') {
      const { villageId, name } = payload;
      const [vx, vy] = villageId.split('|').map(Number);
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x: vx, y: vy } } });
      if (!tile || tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      await prisma.worldTile.update({ where: { id: tile.id }, data: { name: name.trim().slice(0, 32) } });
      return NextResponse.json({ success: true });
    }

    // ── MARK READ ────────────────────────────────────────────────────────────
    if (action === 'mark_read') {
      // Reports are client-side only for now — just acknowledge
      return NextResponse.json({ success: true });
    }

    // ── DEV: ADD RESOURCES ───────────────────────────────────────────────────
    if (action === 'dev_resources') {
      const { villageId } = payload;
      const [vx, vy] = villageId.split('|').map(Number);
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x: vx, y: vy } } });
      if (!tile || tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      const r = tile.resources as any;
      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { resources: { wood: (r.wood||0)+100000, clay: (r.clay||0)+100000, iron: (r.iron||0)+100000, grain: (r.grain||0)+100000, meat: (r.meat||0)+100000, fish: (r.fish||0)+100000 }, updatedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    // ── DEV: MAX ALL BUILDINGS ───────────────────────────────────────────────
    if (action === 'dev_max') {
      const { villageId } = payload;
      const [vx, vy] = villageId.split('|').map(Number);
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x: vx, y: vy } } });
      if (!tile || tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      await prisma.worldTile.update({
        where: { id: tile.id },
        data: { buildings: MAX_LEVELS, upgrades: [], updatedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    // ── DEV: ADD ARMY ────────────────────────────────────────────────────────
    if (action === 'dev_army') {
      const { villageId, units } = payload;
      const [vx, vy] = villageId.split('|').map(Number);
      const tile = await prisma.worldTile.findUnique({ where: { x_y: { x: vx, y: vy } } });
      if (!tile || tile.ownerId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      const existing = (tile.units as any) || {};
      const merged: any = { ...existing };
      Object.entries(units).forEach(([u, c]) => { merged[u] = (merged[u] || 0) + (c as number); });
      await prisma.worldTile.update({ where: { id: tile.id }, data: { units: merged, updatedAt: new Date() } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Action failed:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
