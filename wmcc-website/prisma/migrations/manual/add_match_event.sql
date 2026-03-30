-- Migration: Add MatchEvent model
-- Run this against your database BEFORE deploying the new code.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).

-- ─────────────────────────────────────────────
-- 1. Create MatchEvent table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MatchEvent" (
  "id"        TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "date"      TIMESTAMP(3) NOT NULL,
  "venue"     TEXT         NOT NULL,
  "teamId"    TEXT         NOT NULL,
  "season"    INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MatchEvent"
  ADD CONSTRAINT IF NOT EXISTS "MatchEvent_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MatchEvent_teamId_idx"  ON "MatchEvent"("teamId");
CREATE INDEX IF NOT EXISTS "MatchEvent_date_idx"    ON "MatchEvent"("date");
CREATE INDEX IF NOT EXISTS "MatchEvent_season_idx"  ON "MatchEvent"("season");

-- ─────────────────────────────────────────────
-- 2. Add eventId to Match (nullable for migration)
-- ─────────────────────────────────────────────
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "eventId" TEXT;

-- ─────────────────────────────────────────────
-- 3. Create a MatchEvent for every existing Match
--    (skip matches that already have an eventId)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  m   RECORD;
  eid TEXT;
BEGIN
  FOR m IN
    SELECT * FROM "Match" WHERE "eventId" IS NULL
  LOOP
    eid := 'evt_' || encode(gen_random_bytes(12), 'hex');

    INSERT INTO "MatchEvent" ("id", "name", "date", "venue", "teamId", "season", "createdAt")
    VALUES (
      eid,
      'vs ' || m.opposition,
      m.date,
      m.venue,
      m."teamId",
      EXTRACT(YEAR FROM m.date)::integer,
      NOW()
    );

    UPDATE "Match" SET "eventId" = eid WHERE "id" = m.id;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────
-- 4. Make Match.eventId NOT NULL and add FK
-- ─────────────────────────────────────────────
ALTER TABLE "Match" ALTER COLUMN "eventId" SET NOT NULL;

ALTER TABLE "Match"
  ADD CONSTRAINT IF NOT EXISTS "Match_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "MatchEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Match_eventId_idx" ON "Match"("eventId");

-- ─────────────────────────────────────────────
-- 5. Migrate AvailabilityRequest: matchId → eventId
-- ─────────────────────────────────────────────
ALTER TABLE "AvailabilityRequest" ADD COLUMN IF NOT EXISTS "eventId" TEXT;

-- Copy eventId from the related Match
UPDATE "AvailabilityRequest" ar
SET "eventId" = m."eventId"
FROM "Match" m
WHERE ar."matchId" = m."id"
  AND ar."eventId" IS NULL;

-- Drop old FK, index, and unique constraint
ALTER TABLE "AvailabilityRequest"
  DROP CONSTRAINT IF EXISTS "AvailabilityRequest_matchId_fkey";

DROP INDEX IF EXISTS "AvailabilityRequest_matchId_idx";

ALTER TABLE "AvailabilityRequest"
  DROP CONSTRAINT IF EXISTS "AvailabilityRequest_matchId_playerId_key";

-- Drop old column
ALTER TABLE "AvailabilityRequest" DROP COLUMN IF EXISTS "matchId";

-- Make eventId NOT NULL and add FK + constraints
ALTER TABLE "AvailabilityRequest" ALTER COLUMN "eventId" SET NOT NULL;

ALTER TABLE "AvailabilityRequest"
  ADD CONSTRAINT IF NOT EXISTS "AvailabilityRequest_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "MatchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "AvailabilityRequest_eventId_idx"
  ON "AvailabilityRequest"("eventId");

ALTER TABLE "AvailabilityRequest"
  ADD CONSTRAINT IF NOT EXISTS "AvailabilityRequest_eventId_playerId_key"
  UNIQUE ("eventId", "playerId");

-- ─────────────────────────────────────────────
-- 6. Migrate MatchFeeAssignment: matchId → eventId
-- ─────────────────────────────────────────────
ALTER TABLE "MatchFeeAssignment" ADD COLUMN IF NOT EXISTS "eventId" TEXT;

-- Copy eventId from the related Match
UPDATE "MatchFeeAssignment" mfa
SET "eventId" = m."eventId"
FROM "Match" m
WHERE mfa."matchId" = m."id"
  AND mfa."eventId" IS NULL;

-- Drop old FK, index, and unique constraint
ALTER TABLE "MatchFeeAssignment"
  DROP CONSTRAINT IF EXISTS "MatchFeeAssignment_matchId_fkey";

DROP INDEX IF EXISTS "MatchFeeAssignment_matchId_idx";

ALTER TABLE "MatchFeeAssignment"
  DROP CONSTRAINT IF EXISTS "MatchFeeAssignment_matchId_playerId_key";

-- Drop old column
ALTER TABLE "MatchFeeAssignment" DROP COLUMN IF EXISTS "matchId";

-- Make eventId NOT NULL and add FK + constraints
ALTER TABLE "MatchFeeAssignment" ALTER COLUMN "eventId" SET NOT NULL;

ALTER TABLE "MatchFeeAssignment"
  ADD CONSTRAINT IF NOT EXISTS "MatchFeeAssignment_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "MatchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "MatchFeeAssignment_eventId_idx"
  ON "MatchFeeAssignment"("eventId");

ALTER TABLE "MatchFeeAssignment"
  ADD CONSTRAINT IF NOT EXISTS "MatchFeeAssignment_eventId_playerId_key"
  UNIQUE ("eventId", "playerId");
