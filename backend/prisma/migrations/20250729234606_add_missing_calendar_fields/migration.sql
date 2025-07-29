-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "eventId" TEXT;

-- AlterTable
ALTER TABLE "calendar_sync_states" ADD COLUMN     "createdEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "error" TEXT;
