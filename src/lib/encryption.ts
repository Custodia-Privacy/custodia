/**
 * AES-256-GCM field-level encryption for PII columns.
 *
 * Encrypted values are stored as: "enc:v1:<iv-hex>:<ciphertext-hex>:<tag-hex>"
 * The "enc:v1:" prefix allows detection of already-encrypted values and
 * future key rotation (v2, v3, etc.).
 *
 * Requires ENCRYPTION_KEY env var: 32-byte hex string (64 hex chars).
 * Generate with: openssl rand -hex 32
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIX = "enc:v1:";

let _key: Buffer | null = null;

function getKey(): Buffer {
  if (_key) return _key;
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32",
    );
  }
  _key = Buffer.from(hex, "hex");
  return _key;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
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
  return `${PREFIX}${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptField(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;

  const key = getKey();
  const payload = stored.slice(PREFIX.length);
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

/**
 * Encrypt a field value, returning null if input is null/undefined.
 * Safe to call on already-encrypted values (returns as-is).
 */
export function encryptOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (isEncrypted(value)) return value;
  return encryptField(value);
}

/**
 * Decrypt a field value, returning null if input is null/undefined.
 * Safe to call on plaintext values (returns as-is).
 */
export function decryptOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!isEncrypted(value)) return value;
  return decryptField(value);
}
