-- Link deletion tasks to integrations for Nango connection id at execution time
ALTER TABLE "deletion_tasks" ADD COLUMN "integration_id" UUID;

-- AddForeignKey
ALTER TABLE "deletion_tasks" ADD CONSTRAINT "deletion_tasks_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
