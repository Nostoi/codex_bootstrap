-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "conflictData" TEXT;

-- AlterTable
ALTER TABLE "calendar_sync_states" ADD COLUMN     "updatedEvents" INTEGER NOT NULL DEFAULT 0;
