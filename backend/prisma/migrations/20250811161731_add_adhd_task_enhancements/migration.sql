/*
  Warnings:

  - The values [SELF,BOSS,TEAM,AI_GENERATED] on the enum `TaskSource` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `confidence` on the `interaction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `input` on the `interaction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `interactionType` on the `interaction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `interaction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `output` on the `interaction_logs` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryStatus` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `lastRetryAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `notificationType` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `retryCount` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `afternoonEnergyLevel` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `focusSessionLength` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `morningEnergyLevel` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationPreferences` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `preferredFocusTypes` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `workEndTime` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the column `workStartTime` on the `user_settings` table. All the data in the column will be lost.
  - You are about to drop the `blacklisted_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_sync_conflicts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `calendar_sync_states` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_providers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_sessions` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `priority` on table `tasks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `source` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskSource_new" AS ENUM ('MANUAL', 'AI_EXTRACTED', 'CALENDAR', 'EMAIL', 'PRD');
ALTER TABLE "tasks" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "source" TYPE "TaskSource_new" USING ("source"::text::"TaskSource_new");
ALTER TYPE "TaskSource" RENAME TO "TaskSource_old";
ALTER TYPE "TaskSource_new" RENAME TO "TaskSource";
DROP TYPE "TaskSource_old";
ALTER TABLE "tasks" ALTER COLUMN "source" SET DEFAULT 'MANUAL';
COMMIT;

-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_userId_fkey";

-- DropForeignKey
ALTER TABLE "calendar_sync_conflicts" DROP CONSTRAINT "calendar_sync_conflicts_calendarEventId_fkey";

-- DropForeignKey
ALTER TABLE "calendar_sync_conflicts" DROP CONSTRAINT "calendar_sync_conflicts_syncStateId_fkey";

-- DropForeignKey
ALTER TABLE "calendar_sync_states" DROP CONSTRAINT "calendar_sync_states_userId_fkey";

-- DropForeignKey
ALTER TABLE "oauth_providers" DROP CONSTRAINT "oauth_providers_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "interaction_logs" DROP COLUMN "confidence",
DROP COLUMN "input",
DROP COLUMN "interactionType",
DROP COLUMN "metadata",
DROP COLUMN "output";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "deliveryStatus",
DROP COLUMN "lastRetryAt",
DROP COLUMN "metadata",
DROP COLUMN "notificationType",
DROP COLUMN "readAt",
DROP COLUMN "retryCount";

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "source" SET NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "user_settings" DROP COLUMN "afternoonEnergyLevel",
DROP COLUMN "focusSessionLength",
DROP COLUMN "morningEnergyLevel",
DROP COLUMN "notificationPreferences",
DROP COLUMN "preferredFocusTypes",
DROP COLUMN "workEndTime",
DROP COLUMN "workStartTime";

-- DropTable
DROP TABLE "blacklisted_tokens";

-- DropTable
DROP TABLE "calendar_events";

-- DropTable
DROP TABLE "calendar_sync_conflicts";

-- DropTable
DROP TABLE "calendar_sync_states";

-- DropTable
DROP TABLE "oauth_providers";

-- DropTable
DROP TABLE "user_sessions";

-- DropEnum
DROP TYPE "CalendarConflictResolution";

-- DropEnum
DROP TYPE "CalendarConflictType";

-- DropEnum
DROP TYPE "CalendarSyncStatus";
