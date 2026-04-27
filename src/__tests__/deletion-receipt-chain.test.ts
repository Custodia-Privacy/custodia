import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { computePayloadHash, signReceipt } from "@/lib/deletion/receipt-chain";

describe("deletion receipt chain", () => {
  const prevSecret = process.env.DELETION_RECEIPT_HMAC_SECRET;

  beforeEach(() => {
    process.env.DELETION_RECEIPT_HMAC_SECRET = "test-secret-fixed";
  });

  afterEach(() => {
    process.env.DELETION_RECEIPT_HMAC_SECRET = prevSecret;
  });

  it("computes stable payload hash for same input", () => {
    const a = computePayloadHash(null, { x: 1 });
    const b = computePayloadHash(null, { x: 1 });
    expect(a).toBe(b);
  });

  it("chains prevHash into payload hash", () => {
    const first = computePayloadHash(null, { step: 1 });
    const second = computePayloadHash(first, { step: 2 });
    expect(second).not.toBe(first);
  });

  it("signReceipt returns signature derived from payloadHash", () => {
    const { payloadHash, signature } = signReceipt(null, { ok: true });
    expect(payloadHash.length).toBeGreaterThan(16);
    expect(signature.length).toBeGreaterThan(16);
  });
});
