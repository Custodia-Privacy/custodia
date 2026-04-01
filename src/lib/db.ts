/**
 * Prisma client singleton with transparent field-level encryption.
 * Prevents multiple instances in development (hot-reload).
 */
import { PrismaClient } from "@prisma/client";
import { encryptOptional, decryptOptional } from "./encryption";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function assertGeneratedClient(client: PrismaClient) {
  const c = client as unknown as {
    dsarRequest?: { create?: unknown };
    dsarActivity?: { create?: unknown };
  };
  if (typeof c.dsarRequest?.create !== "function" || typeof c.dsarActivity?.create !== "function") {
    throw new Error(
      "[Custodia] Prisma client is out of date (missing DSAR models). Run: npx prisma generate — then fully restart the dev server (stop Node, not only refresh).",
    );
  }
}

/**
 * PII fields that are encrypted at rest.
 * Maps model name -> field names to encrypt/decrypt.
 */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  DsarRequest: ["requesterName", "requesterEmail", "requesterPhone"],
  UserPreference: ["email", "externalId"],
  ConsentLog: ["visitorId"],
  Account: ["refreshToken", "accessToken", "idToken"],
  DataStore: ["connectionConfig"],
  Site: ["privacyWebhookSecret"],
  PreferenceCenter: ["privacyWebhookSecret"],
};

function encryptionEnabled(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY);
}

/**
 * Encrypt PII fields in data before writing to the database.
 */
function encryptDataFields(model: string, data: Record<string, unknown>): void {
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields || !encryptionEnabled()) return;
  for (const field of fields) {
    if (field in data && typeof data[field] === "string") {
      data[field] = encryptOptional(data[field] as string);
    }
    if (field in data && data[field] != null && typeof data[field] === "object") {
      const val = data[field] as Record<string, unknown>;
      if ("set" in val && typeof val.set === "string") {
        val.set = encryptOptional(val.set as string);
      }
    }
  }
}

/**
 * Decrypt PII fields after reading from the database.
 */
function decryptResultFields(model: string, result: unknown): void {
  if (!result || typeof result !== "object" || !encryptionEnabled()) return;
  const fields = ENCRYPTED_FIELDS[model];
  if (!fields) return;

  const obj = result as Record<string, unknown>;
  for (const field of fields) {
    if (field in obj && typeof obj[field] === "string") {
      obj[field] = decryptOptional(obj[field] as string);
    }
  }
}

function decryptResults(model: string, result: unknown): void {
  if (Array.isArray(result)) {
    for (const item of result) decryptResultFields(model, item);
  } else {
    decryptResultFields(model, result);
  }
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

assertGeneratedClient(basePrisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}

/**
 * Extended Prisma client with transparent PII encryption/decryption
 * using the $extends query extension API.
 */
const extendedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const modelName = model ?? "";

        if (ENCRYPTED_FIELDS[modelName] && encryptionEnabled()) {
          const a = args as Record<string, unknown>;
          if (a.data && typeof a.data === "object") {
            encryptDataFields(modelName, a.data as Record<string, unknown>);
          }
          if (a.create && typeof a.create === "object") {
            encryptDataFields(modelName, a.create as Record<string, unknown>);
          }
          if (a.update && typeof a.update === "object") {
            encryptDataFields(modelName, a.update as Record<string, unknown>);
          }
        }

        const result = await query(args);

        if (ENCRYPTED_FIELDS[modelName] && encryptionEnabled()) {
          decryptResults(modelName, result);
        }

        return result;
      },
    },
  },
});

export const db = extendedPrisma as unknown as PrismaClient;
