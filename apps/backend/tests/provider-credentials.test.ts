import { describe, expect, it } from "vitest";
import {
  decryptCredential,
  encryptCredential,
  parseEncryptionKey,
} from "../src/lib/ai/provider-credentials";

describe("provider credential encryption", () => {
  const key = Buffer.alloc(32, 7);

  it("round-trips a credential without storing the plaintext", () => {
    const encrypted = encryptCredential("sk-or-v1-super-secret", key);

    expect(JSON.stringify(encrypted)).not.toContain("sk-or-v1-super-secret");
    expect(encrypted.lastFour).toBe("cret");
    expect(decryptCredential(encrypted, key)).toBe("sk-or-v1-super-secret");
  });

  it("uses a fresh nonce for repeated encryption", () => {
    const first = encryptCredential("same-secret", key);
    const second = encryptCredential("same-secret", key);

    expect(first.nonce).not.toBe(second.nonce);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("rejects malformed server encryption keys", () => {
    expect(() => parseEncryptionKey("too-short")).toThrow(
      "PROVIDER_CREDENTIAL_ENCRYPTION_KEY"
    );
  });
});
