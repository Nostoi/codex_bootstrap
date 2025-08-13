-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "syncStatus" "CalendarSyncStatus";

-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "remoteVersion" TEXT;
