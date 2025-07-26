-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "collaboration_sessions" DROP CONSTRAINT "collaboration_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "collaboration_sessions" DROP CONSTRAINT "collaboration_sessions_documentId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_projectId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_taskId_fkey";

-- DropForeignKey
ALTER TABLE "task_dependencies" DROP CONSTRAINT "task_dependencies_dependsOn_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_taskId_fkey";

-- DropForeignKey
ALTER TABLE "interaction_logs" DROP CONSTRAINT "interaction_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTask" DROP CONSTRAINT "_TagToTask_A_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTask" DROP CONSTRAINT "_TagToTask_B_fkey";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "collaboration_sessions";

-- DropTable
DROP TABLE "integration_configs";

-- DropTable
DROP TABLE "projects";

-- DropTable
DROP TABLE "tasks";

-- DropTable
DROP TABLE "task_dependencies";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "interaction_logs";

-- DropTable
DROP TABLE "user_settings";

-- DropTable
DROP TABLE "tags";

-- DropTable
DROP TABLE "_TagToTask";

