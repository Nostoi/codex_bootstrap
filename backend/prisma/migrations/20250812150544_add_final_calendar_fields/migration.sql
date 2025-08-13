-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "description" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "localVersion" TEXT;
