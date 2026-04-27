import { createHash, createHmac } from "node:crypto";

export function computePayloadHash(prevHash: string | null, payload: unknown): string {
  const secret = process.env.DELETION_RECEIPT_HMAC_SECRET ?? "custodia-dev-receipt-secret-change-me";
  const canonical = JSON.stringify({ prevHash, payload });
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

export function signReceipt(prevHash: string | null, payload: unknown): { payloadHash: string; signature: string } {
  const secret = process.env.DELETION_RECEIPT_HMAC_SECRET ?? "custodia-dev-receipt-secret-change-me";
  const payloadHash = computePayloadHash(prevHash, payload);
  const signature = createHmac("sha256", secret).update(payloadHash).digest("hex");
  return { payloadHash, signature };
}

export function quickHash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}
