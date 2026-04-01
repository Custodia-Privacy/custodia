/**
 * AES-256-GCM field-level encryption for PII columns.
 *
 * Encrypted values are stored as: "enc:v1:<iv-hex>:<ciphertext-hex>:<tag-hex>"
 * The "enc:v1:" prefix allows detection of already-encrypted values and
 * key rotation (v2 uses ENCRYPTION_KEY, v1 fallback uses ENCRYPTION_KEY_PREVIOUS).
 *
 * Requires ENCRYPTION_KEY env var: 32-byte hex string (64 hex chars).
 * Generate with: openssl rand -hex 32
 *
 * Key rotation:
 *   1. Set ENCRYPTION_KEY_PREVIOUS to the old key
 *   2. Set ENCRYPTION_KEY to the new key
 *   3. Run: npx ts-node scripts/rotate-encryption-key.ts
 *   4. Once complete, remove ENCRYPTION_KEY_PREVIOUS
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { createLogger } from "./logger";

const log = createLogger("encryption");

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const PREFIX_V1 = "enc:v1:";
const PREFIX_V2 = "enc:v2:";

let _key: Buffer | null = null;
let _prevKey: Buffer | null = null;
let _hmacKey: Buffer | null = null;

function parseKeyHex(hex: string | undefined, name: string): Buffer | null {
  if (!hex) return null;
  if (hex.length !== 64) {
    throw new Error(`${name} must be a 64-character hex string (32 bytes).`);
  }
  return Buffer.from(hex, "hex");
}

function getKey(): Buffer {
  if (_key) return _key;
  _key = parseKeyHex(process.env.ENCRYPTION_KEY, "ENCRYPTION_KEY");
  if (!_key) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32",
    );
  }
  return _key;
}

function getPreviousKey(): Buffer | null {
  if (_prevKey !== null) return _prevKey;
  _prevKey = parseKeyHex(process.env.ENCRYPTION_KEY_PREVIOUS, "ENCRYPTION_KEY_PREVIOUS");
  return _prevKey;
}

function getHmacKey(): Buffer {
  if (_hmacKey) return _hmacKey;
  _hmacKey = getKey();
  return _hmacKey;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX_V1) || value.startsWith(PREFIX_V2);
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX_V2}${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

function decryptWithKey(stored: string, key: Buffer, prefix: string): string {
  const payload = stored.slice(prefix.length);
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted field");
  }

  const iv = Buffer.from(parts[0], "hex");
  const ciphertext = Buffer.from(parts[1], "hex");
  const tag = Buffer.from(parts[2], "hex");

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function decryptField(stored: string): string {
  if (!isEncrypted(stored)) return stored;

  if (stored.startsWith(PREFIX_V2)) {
    return decryptWithKey(stored, getKey(), PREFIX_V2);
  }

  if (stored.startsWith(PREFIX_V1)) {
    const prevKey = getPreviousKey();
    if (prevKey) {
      try {
        return decryptWithKey(stored, prevKey, PREFIX_V1);
      } catch { /* fall through to current key */ }
    }
    return decryptWithKey(stored, getKey(), PREFIX_V1);
  }

  return stored;
}

export function encryptOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (isEncrypted(value)) return value;
  return encryptField(value);
}

export function decryptOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value;
  return decryptField(value);
}

/**
 * Deterministic HMAC for blind indexes.
 * Same input always produces the same hash, enabling equality lookups
 * on encrypted fields without exposing plaintext.
 */
export function blindIndex(value: string): string {
  return createHmac("sha256", getHmacKey())
    .update(value.toLowerCase().trim())
    .digest("hex");
}

/**
 * Startup validation — call once during app bootstrap.
 * Warns loudly if encryption is not configured in production.
 */
export function validateEncryptionConfig(): void {
  const isProd = process.env.NODE_ENV === "production";
  const hasKey = Boolean(process.env.ENCRYPTION_KEY);

  if (isProd && !hasKey) {
    log.error(
      "ENCRYPTION_KEY is NOT set in production! PII will be stored in PLAINTEXT. " +
      "Generate a key with: openssl rand -hex 32",
    );
  }

  if (hasKey) {
    try {
      getKey();
      log.info("Encryption key loaded successfully");
    } catch (e) {
      log.error("Invalid ENCRYPTION_KEY", e);
      if (isProd) throw e;
    }
  }
}
