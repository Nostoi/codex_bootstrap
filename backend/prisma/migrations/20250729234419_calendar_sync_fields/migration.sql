-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CalendarConflictResolution" ADD VALUE 'PREFER_LOCAL';
ALTER TYPE "CalendarConflictResolution" ADD VALUE 'PREFER_REMOTE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CalendarConflictType" ADD VALUE 'TITLE';
ALTER TYPE "CalendarConflictType" ADD VALUE 'START_TIME';

-- AlterTable
ALTER TABLE "calendar_sync_conflicts" ADD COLUMN     "syncStateId" TEXT;

-- AlterTable
ALTER TABLE "calendar_sync_states" ADD COLUMN     "conflictsDetected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "direction" TEXT,
ADD COLUMN     "lastSyncTime" TIMESTAMP(3),
ADD COLUMN     "processedEvents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "calendar_sync_conflicts" ADD CONSTRAINT "calendar_sync_conflicts_syncStateId_fkey" FOREIGN KEY ("syncStateId") REFERENCES "calendar_sync_states"("id") ON DELETE CASCADE ON UPDATE CASCADE;
