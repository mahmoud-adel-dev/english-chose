import { describe, expect, it } from "vitest";
import { encryptCredential } from "../src/lib/ai/provider-credentials";
import {
  credentialMask,
  toProviderAdminView,
} from "../src/lib/ai/provider-governance-view";

describe("provider governance admin view", () => {
  it("returns only a mask and never serializes stored credential material", () => {
    const encrypted = encryptCredential("sk-or-v1-secret-7890", Buffer.alloc(32, 9));
    const view = toProviderAdminView({
      id: "provider-1",
      identifier: "openrouter",
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      status: "ACTIVE",
      priorityOrder: 1,
      maxRpm: 60,
      apiKeySecretKey: "OPENROUTER_API_KEY",
      credentialSource: "ENCRYPTED",
      inferenceCredential: encrypted,
      managementCredential: null,
      inferenceKeyLastFour: "7890",
      managementKeyLastFour: null,
      credentialHealth: "ACTIVE",
      credentialReason: null,
      providerErrorCode: null,
      lastTestedAt: new Date("2026-10-27T18:00:00.000Z"),
      lastTestLatencyMs: 123,
      quotaSnapshot: { availability: "AVAILABLE", metrics: [] },
      quotaRefreshedAt: new Date("2026-10-27T18:01:00.000Z"),
      discoverySnapshot: [{ id: "openai/gpt-4.1-mini" }],
      modelsDiscoveredAt: new Date("2026-10-27T18:02:00.000Z"),
      createdAt: new Date("2026-10-27T17:00:00.000Z"),
      updatedAt: new Date("2026-10-27T18:02:00.000Z"),
      models: [],
    });

    expect(view.credentials.inference).toEqual({ configured: true, mask: "••••7890" });
    expect(JSON.stringify(view)).not.toContain(encrypted.ciphertext);
    expect(JSON.stringify(view)).not.toContain(encrypted.nonce);
    expect(JSON.stringify(view)).not.toContain("sk-or-v1-secret-7890");
    expect(view.discoveredModelCount).toBe(1);
  });

  it("uses an explicit environment-reference mask without revealing its value", () => {
    expect(credentialMask("ENV_REFERENCE", null, "GEMINI_API_KEY")).toEqual({
      configured: true,
      mask: "Server environment",
    });
  });
});
