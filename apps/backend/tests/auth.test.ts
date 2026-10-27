import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signToken, verifyToken, extractBearerToken } from "../src/lib/auth/jwt";

describe("Authentication & Token Security", () => {
  it("hashes password with salt and verifies correctly", async () => {
    const raw = "SuperSecretPassword123!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword("WrongPassword!", hash);
    expect(isBadMatch).toBe(false);
  });

  it("signs and verifies JWT tokens with role and userId", async () => {
    const payload = {
      userId: "user-123-uuid",
      email: "learner@englishcoach.app",
      role: "STUDENT",
    };

    const token = await signToken(payload, "2h");
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it("safely rejects invalid or malformed tokens", async () => {
    const invalid = await verifyToken("malformed.jwt.token");
    expect(invalid).toBeNull();
  });

  it("extracts bearer token from authorization header correctly", () => {
    expect(extractBearerToken("Bearer eyJhbGciOi...")).toBe("eyJhbGciOi...");
    expect(extractBearerToken("Basic 12345")).toBeNull();
    expect(extractBearerToken("")).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });
});
