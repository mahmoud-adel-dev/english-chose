import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface EncryptedCredential {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: number;
  lastFour: string;
}

export function parseEncryptionKey(value: string): Buffer {
  const trimmed = value.trim();
  const candidates = [
    () => Buffer.from(trimmed, "base64"),
    () => Buffer.from(trimmed, "hex"),
  ];

  for (const candidate of candidates) {
    const key = candidate();
    if (key.length === 32) return key;
  }

  throw new Error(
    "PROVIDER_CREDENTIAL_ENCRYPTION_KEY must be a base64 or hex encoded 32-byte key."
  );
}

export function getCredentialEncryptionKey(): Buffer {
  const value = process.env.PROVIDER_CREDENTIAL_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("PROVIDER_CREDENTIAL_ENCRYPTION_KEY is not configured on the server.");
  }
  return parseEncryptionKey(value);
}

export function encryptCredential(
  plaintext: string,
  key: Buffer = getCredentialEncryptionKey()
): EncryptedCredential {
  if (!plaintext) throw new Error("Credential cannot be empty.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: 1,
    lastFour: plaintext.slice(-4),
  };
}

export function decryptCredential(
  encrypted: EncryptedCredential,
  key: Buffer = getCredentialEncryptionKey()
): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.nonce, "base64")
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
