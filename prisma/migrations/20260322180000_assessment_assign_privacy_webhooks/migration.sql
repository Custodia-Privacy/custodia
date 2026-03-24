-- AlterTable
ALTER TABLE "sites" ADD COLUMN "privacy_webhook_url" VARCHAR(2048),
ADD COLUMN "privacy_webhook_secret" VARCHAR(255);

-- AlterTable
ALTER TABLE "preference_centers" ADD COLUMN "privacy_webhook_url" VARCHAR(2048),
ADD COLUMN "privacy_webhook_secret" VARCHAR(255);

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN "assigned_to_user_id" UUID;

-- CreateTable
CREATE TABLE "assessment_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assessment_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "actor_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessment_activities_assessment_id_created_at_idx" ON "assessment_activities"("assessment_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "assessments_assigned_to_user_id_idx" ON "assessments"("assigned_to_user_id");

-- AddForeignKey
ALTER TABLE "assessment_activities" ADD CONSTRAINT "assessment_activities_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_activities" ADD CONSTRAINT "assessment_activities_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
