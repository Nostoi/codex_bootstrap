-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_REMINDER', 'TASK_OVERDUE', 'ENERGY_SUGGESTION', 'FOCUS_BREAK', 'DAILY_PLANNING', 'SYSTEM_UPDATE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "deliveryStatus" "DeliveryStatus",
ADD COLUMN     "notificationType" "NotificationType",
ADD COLUMN     "readAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "afternoonEnergyLevel" "EnergyLevel",
ADD COLUMN     "morningEnergyLevel" "EnergyLevel",
ADD COLUMN     "notificationPreferences" JSONB,
ADD COLUMN     "preferredFocusTypes" "FocusType"[],
ADD COLUMN     "workEndTime" TEXT,
ADD COLUMN     "workStartTime" TEXT;
