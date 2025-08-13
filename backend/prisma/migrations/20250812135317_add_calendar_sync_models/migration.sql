-- CreateEnum
CREATE TYPE "CalendarSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CalendarConflictType" AS ENUM ('TITLE', 'DESCRIPTION_MISMATCH', 'START_TIME', 'TIME_MISMATCH', 'LOCATION_MISMATCH', 'BOTH_MODIFIED');

-- CreateEnum
CREATE TYPE "CalendarConflictResolution" AS ENUM ('PENDING', 'USE_LOCAL', 'USE_REMOTE', 'MERGE', 'MANUAL');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "graphId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "bodyPreview" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "importance" TEXT,
    "sensitivity" TEXT,
    "showAs" TEXT,
    "attendees" JSONB[],
    "categories" TEXT[],
    "organizer" JSONB,
    "recurrence" JSONB,
    "rawData" JSONB NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "lastSyncToken" TEXT,
    "lastSyncTime" TIMESTAMP(3),
    "lastSyncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "syncedCount" INTEGER NOT NULL DEFAULT 0,
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_conflicts" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "conflictType" "CalendarConflictType" NOT NULL,
    "description" TEXT NOT NULL,
    "localData" JSONB NOT NULL,
    "remoteData" JSONB NOT NULL,
    "resolution" "CalendarConflictResolution" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "autoResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_graphId_key" ON "calendar_events"("graphId");

-- CreateIndex
CREATE INDEX "calendar_events_graphId_idx" ON "calendar_events"("graphId");

-- CreateIndex
CREATE INDEX "calendar_events_userId_idx" ON "calendar_events"("userId");

-- CreateIndex
CREATE INDEX "calendar_events_start_end_idx" ON "calendar_events"("start", "end");

-- CreateIndex
CREATE INDEX "calendar_sync_states_userId_idx" ON "calendar_sync_states"("userId");

-- CreateIndex
CREATE INDEX "calendar_sync_states_lastSyncStatus_idx" ON "calendar_sync_states"("lastSyncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_states_userId_calendarId_key" ON "calendar_sync_states"("userId", "calendarId");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_eventId_idx" ON "calendar_sync_conflicts"("eventId");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_conflictType_idx" ON "calendar_sync_conflicts"("conflictType");

-- CreateIndex
CREATE INDEX "calendar_sync_conflicts_resolution_idx" ON "calendar_sync_conflicts"("resolution");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_states" ADD CONSTRAINT "calendar_sync_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
