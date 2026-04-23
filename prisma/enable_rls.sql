-- Enable Row Level Security on all tables
-- Prisma connects as 'postgres' role which BYPASSES RLS, so app is unaffected.
-- This protects tables from unauthorized access via Supabase REST API (PostgREST).

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSave" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorldTile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CombatCommand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Clan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClanInvestment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BugReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BattleReport" ENABLE ROW LEVEL SECURITY;

-- By default, with RLS enabled and NO policies, all access via non-superuser roles
-- (anon, authenticated) is denied. This is the safest default since all access
-- goes through Prisma (postgres role) which bypasses RLS.
