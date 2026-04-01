-- Add blind index columns for encrypted field lookups
-- These store HMAC-SHA256 hashes for deterministic equality queries

-- DsarRequest: requester_email_hash for email lookups
ALTER TABLE "dsar_requests" ADD COLUMN "requester_email_hash" VARCHAR(64);
CREATE INDEX "dsar_requests_requester_email_hash_idx" ON "dsar_requests" ("requester_email_hash");

-- Widen encrypted columns to accommodate ciphertext
ALTER TABLE "dsar_requests" ALTER COLUMN "requester_name" TYPE VARCHAR(512);
ALTER TABLE "dsar_requests" ALTER COLUMN "requester_email" TYPE VARCHAR(512);
ALTER TABLE "dsar_requests" ALTER COLUMN "requester_phone" TYPE VARCHAR(255);

-- UserPreference: email_hash and external_id_hash for lookups
ALTER TABLE "user_preferences" ADD COLUMN "email_hash" VARCHAR(64);
ALTER TABLE "user_preferences" ADD COLUMN "external_id_hash" VARCHAR(64);

-- Widen encrypted columns
ALTER TABLE "user_preferences" ALTER COLUMN "email" TYPE VARCHAR(512);
ALTER TABLE "user_preferences" ALTER COLUMN "external_id" TYPE VARCHAR(512);

-- Replace old plaintext indexes with blind index lookups
DROP INDEX IF EXISTS "user_preferences_center_id_email_idx";
DROP INDEX IF EXISTS "user_preferences_center_id_external_id_idx";
CREATE INDEX "user_preferences_center_id_email_hash_idx" ON "user_preferences" ("center_id", "email_hash");
CREATE INDEX "user_preferences_center_id_external_id_hash_idx" ON "user_preferences" ("center_id", "external_id_hash");
