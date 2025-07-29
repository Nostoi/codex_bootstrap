-- CreateEnum
CREATE TYPE "CalendarSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "CalendarConflictType" AS ENUM ('TITLE_MISMATCH', 'TIME_MISMATCH', 'LOCATION_MISMATCH', 'DESCRIPTION_MISMATCH', 'DELETED_REMOTELY', 'DELETED_LOCALLY', 'BOTH_MODIFIED');

-- CreateEnum
CREATE TYPE "CalendarConflictResolution" AS ENUM ('PENDING', 'USE_LOCAL', 'USE_REMOTE', 'MERGE', 'MANUAL', 'SKIP');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "graphId" TEXT,
    "graphCalendarId" TEXT,
    "graphEtag" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT DEFAULT 'UTC',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "locallyModified" BOOLEAN NOT NULL DEFAULT false,
    "remotelyModified" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "conflictData" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarId" TEXT,
    "lastFullSync" TIMESTAMP(3),
    "lastDeltaSync" TIMESTAMP(3),
    "deltaToken" TEXT,
    "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncError" TEXT,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "syncedEvents" INTEGER NOT NULL DEFAULT 0,
    "conflictedEvents" INTEGER NOT NULL DEFAULT 0,
    "failedEvents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_sync_conflicts" (
    "id" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "conflictType" "CalendarConflictType" NOT NULL,
    "localVersion" TEXT NOT NULL,
    "remoteVersion" TEXT NOT NULL,
    "resolution" "CalendarConflictResolution" DEFAULT 'PENDING',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoResolvable" BOOLEAN NOT NULL DEFAULT false,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_sync_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_userId_graphId_key" ON "calendar_events"("userId", "graphId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_sync_states_userId_calendarId_key" ON "calendar_sync_states"("userId", "calendarId");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_states" ADD CONSTRAINT "calendar_sync_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
