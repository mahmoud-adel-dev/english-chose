import { describe, expect, it, vi } from "vitest";
import {
  decideGoogleAccountAction,
  parseGoogleAuthConfiguration,
  sanitizeGoogleAuthConfiguration,
  verifyGoogleIdentity,
} from "../src/lib/auth/google-auth";

describe("Google authentication policy", () => {
  it("requires a web client id when Google login is enabled", () => {
    expect(() => parseGoogleAuthConfiguration({ enabled: true, webClientId: "" })).toThrow(
      "Web client ID"
    );
  });

  it("never exposes encrypted secrets in an admin or public view", () => {
    const view = sanitizeGoogleAuthConfiguration({
      enabled: true,
      webClientId: "web.apps.googleusercontent.com",
      androidClientId: "android.apps.googleusercontent.com",
      iosClientId: null,
      clientSecretLastFour: "1234",
      apiKeyLastFour: "5678",
      clientSecretCredential: { ciphertext: "private-secret" },
      apiKeyCredential: { ciphertext: "private-api-key" },
    });

    expect(view).toEqual({
      enabled: true,
      webClientId: "web.apps.googleusercontent.com",
      androidClientId: "android.apps.googleusercontent.com",
      iosClientId: null,
      clientSecretConfigured: true,
      clientSecretLastFour: "1234",
      apiKeyConfigured: true,
      apiKeyLastFour: "5678",
    });
    expect(JSON.stringify(view)).not.toContain("private");
  });

  it("verifies the ID token against the configured audience and requires verified email", async () => {
    const verifier = vi.fn().mockResolvedValue({
      sub: "google-123",
      email: "Student@Gmail.com",
      email_verified: true,
      name: "Student",
    });

    const identity = await verifyGoogleIdentity(
      "signed-token",
      "web.apps.googleusercontent.com",
      verifier
    );

    expect(verifier).toHaveBeenCalledWith("signed-token", "web.apps.googleusercontent.com");
    expect(identity.email).toBe("student@gmail.com");
    expect(identity.subject).toBe("google-123");
    expect(identity.canLinkExistingEmail).toBe(true);
  });

  it("rejects an unverified Google email", async () => {
    await expect(
      verifyGoogleIdentity("token", "audience", async () => ({
        sub: "google-123",
        email: "student@example.com",
        email_verified: false,
      }))
    ).rejects.toThrow("verified email");
  });

  it("reuses subject, links matching email, or creates exactly one account", () => {
    const active = { id: "u1", isActive: true, googleSubject: "g1" };
    expect(decideGoogleAccountAction(active, null)).toEqual({ type: "USE", userId: "u1" });
    expect(decideGoogleAccountAction(null, { id: "u2", isActive: true, googleSubject: null }, true)).toEqual({
      type: "LINK",
      userId: "u2",
    });
    expect(decideGoogleAccountAction(null, null)).toEqual({ type: "CREATE" });
  });

  it("does not auto-link an existing non-Google-hosted email account", () => {
    expect(() =>
      decideGoogleAccountAction(
        null,
        { id: "u2", isActive: true, googleSubject: null },
        false
      )
    ).toThrow("password");
  });

  it("rejects inactive and conflicting linked accounts", () => {
    expect(() =>
      decideGoogleAccountAction({ id: "u1", isActive: false, googleSubject: "g1" }, null)
    ).toThrow("disabled");
    expect(() =>
      decideGoogleAccountAction(null, { id: "u2", isActive: true, googleSubject: "other" })
    ).toThrow("another Google account");
  });
});
