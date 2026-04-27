-- Data Inventory: catalogue, PII findings, retention/minimization, deletion executor receipts

-- CreateEnum
CREATE TYPE "DataAssetKind" AS ENUM (
  'source',
  'data_system',
  'database',
  'schema',
  'table',
  'collection',
  'bucket',
  'folder',
  'file',
  'field'
);

-- CreateEnum
CREATE TYPE "DataAssetStatus" AS ENUM ('active', 'archived', 'error');

-- CreateEnum
CREATE TYPE "InventoryScanRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "DeletionExecutionStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "DeletionTaskStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "data_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "parent_id" UUID,
    "kind" "DataAssetKind" NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "external_ref" VARCHAR(1024),
    "config" JSONB NOT NULL DEFAULT '{}',
    "legacy_data_store_id" UUID,
    "integration_id" UUID,
    "last_scan_at" TIMESTAMP(3),
    "status" "DataAssetStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_asset_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_asset_id" UUID NOT NULL,
    "name" VARCHAR(512) NOT NULL,
    "external_ref" VARCHAR(1024),
    "data_type" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_asset_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_scan_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "status" "InventoryScanRunStatus" NOT NULL DEFAULT 'queued',
    "trigger" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "error_message" TEXT,
    "summary" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_scan_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pii_findings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "scan_run_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "field_id" UUID,
    "label" VARCHAR(64) NOT NULL,
    "avg_score" DOUBLE PRECISION NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pii_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule_days" INTEGER,
    "rules" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policy_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "retention_policy_id" UUID NOT NULL,
    "data_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_policy_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minimization_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minimization_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "minimization_policy_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "minimization_policy_id" UUID NOT NULL,
    "data_asset_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "minimization_policy_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_execution_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "dsar_request_id" UUID,
    "retention_policy_id" UUID,
    "dry_run" BOOLEAN NOT NULL DEFAULT true,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeletionExecutionStatus" NOT NULL DEFAULT 'pending',
    "created_by_user_id" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deletion_execution_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "external_record_id" VARCHAR(512) NOT NULL,
    "subject_email" VARCHAR(512),
    "status" "DeletionTaskStatus" NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deletion_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deletion_receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "run_id" UUID,
    "task_id" UUID,
    "prev_hash" VARCHAR(128),
    "payload_hash" VARCHAR(128) NOT NULL,
    "signature" VARCHAR(256) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deletion_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_assets_legacy_data_store_id_key" ON "data_assets"("legacy_data_store_id");

-- CreateIndex
CREATE INDEX "data_assets_org_id_kind_idx" ON "data_assets"("org_id", "kind");

-- CreateIndex
CREATE INDEX "data_assets_org_id_parent_id_idx" ON "data_assets"("org_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_asset_fields_table_asset_id_name_key" ON "data_asset_fields"("table_asset_id", "name");

-- CreateIndex
CREATE INDEX "data_asset_fields_table_asset_id_idx" ON "data_asset_fields"("table_asset_id");

-- CreateIndex
CREATE INDEX "inventory_scan_runs_org_id_created_at_idx" ON "inventory_scan_runs"("org_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pii_findings_scan_run_id_idx" ON "pii_findings"("scan_run_id");

-- CreateIndex
CREATE INDEX "pii_findings_org_id_label_idx" ON "pii_findings"("org_id", "label");

-- CreateIndex
CREATE INDEX "retention_policies_org_id_idx" ON "retention_policies"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policy_targets_retention_policy_id_data_asset_id_key" ON "retention_policy_targets"("retention_policy_id", "data_asset_id");

-- CreateIndex
CREATE INDEX "minimization_policies_org_id_idx" ON "minimization_policies"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "minimization_policy_targets_minimization_policy_id_data_asset_id_key" ON "minimization_policy_targets"("minimization_policy_id", "data_asset_id");

-- CreateIndex
CREATE INDEX "deletion_execution_runs_org_id_status_idx" ON "deletion_execution_runs"("org_id", "status");

-- CreateIndex
CREATE INDEX "deletion_execution_runs_dsar_request_id_idx" ON "deletion_execution_runs"("dsar_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "deletion_tasks_idempotency_key_key" ON "deletion_tasks"("idempotency_key");

-- CreateIndex
CREATE INDEX "deletion_tasks_run_id_idx" ON "deletion_tasks"("run_id");

-- CreateIndex
CREATE INDEX "deletion_receipts_org_id_created_at_idx" ON "deletion_receipts"("org_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "deletion_receipts_run_id_idx" ON "deletion_receipts"("run_id");

-- AddForeignKey
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_legacy_data_store_id_fkey" FOREIGN KEY ("legacy_data_store_id") REFERENCES "data_stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_assets" ADD CONSTRAINT "data_assets_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_asset_fields" ADD CONSTRAINT "data_asset_fields_table_asset_id_fkey" FOREIGN KEY ("table_asset_id") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_scan_runs" ADD CONSTRAINT "inventory_scan_runs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_findings" ADD CONSTRAINT "pii_findings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_findings" ADD CONSTRAINT "pii_findings_scan_run_id_fkey" FOREIGN KEY ("scan_run_id") REFERENCES "inventory_scan_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_findings" ADD CONSTRAINT "pii_findings_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_findings" ADD CONSTRAINT "pii_findings_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "data_asset_fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policy_targets" ADD CONSTRAINT "retention_policy_targets_retention_policy_id_fkey" FOREIGN KEY ("retention_policy_id") REFERENCES "retention_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policy_targets" ADD CONSTRAINT "retention_policy_targets_data_asset_id_fkey" FOREIGN KEY ("data_asset_id") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minimization_policies" ADD CONSTRAINT "minimization_policies_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minimization_policy_targets" ADD CONSTRAINT "minimization_policy_targets_minimization_policy_id_fkey" FOREIGN KEY ("minimization_policy_id") REFERENCES "minimization_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "minimization_policy_targets" ADD CONSTRAINT "minimization_policy_targets_data_asset_id_fkey" FOREIGN KEY ("data_asset_id") REFERENCES "data_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_execution_runs" ADD CONSTRAINT "deletion_execution_runs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_execution_runs" ADD CONSTRAINT "deletion_execution_runs_dsar_request_id_fkey" FOREIGN KEY ("dsar_request_id") REFERENCES "dsar_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_execution_runs" ADD CONSTRAINT "deletion_execution_runs_retention_policy_id_fkey" FOREIGN KEY ("retention_policy_id") REFERENCES "retention_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_tasks" ADD CONSTRAINT "deletion_tasks_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "deletion_execution_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_receipts" ADD CONSTRAINT "deletion_receipts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deletion_receipts" ADD CONSTRAINT "deletion_receipts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "deletion_execution_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
