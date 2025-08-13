-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "timeZone" TEXT;

-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "autoResolvable" BOOLEAN NOT NULL DEFAULT false;
