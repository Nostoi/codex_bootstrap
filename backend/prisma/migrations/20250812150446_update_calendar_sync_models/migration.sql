/*
  Warnings:

  - A unique constraint covering the columns `[userId,graphId]` on the table `calendar_events` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('UPLOAD', 'DOWNLOAD', 'BIDIRECTIONAL');

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "graphCalendarId" TEXT,
ADD COLUMN     "graphEtag" TEXT,
ADD COLUMN     "locallyModified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "conflictData" JSONB,
ADD COLUMN     "syncStateId" TEXT;

-- AlterTable
ALTER TABLE "calendar_sync_states" ADD COLUMN     "conflictedEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deltaToken" TEXT,
ADD COLUMN     "direction" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
ADD COLUMN     "failedEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDeltaSync" TIMESTAMP(3),
ADD COLUMN     "lastFullSync" TIMESTAMP(3),
ADD COLUMN     "processedEvents" INTEGER,
ADD COLUMN     "status" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "syncedEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalEvents" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_userId_graphId_key" ON "calendar_events"("userId", "graphId");
