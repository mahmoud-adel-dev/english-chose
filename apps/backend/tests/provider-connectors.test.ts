import { describe, expect, it, vi } from "vitest";
import { OpenRouterConnector } from "../src/lib/ai/providers/openrouter-connector";
import { classifyProviderFailure } from "../src/lib/ai/providers/provider-errors";
import { providerCatalog } from "../src/lib/ai/providers/provider-catalog";
import { OpenAiCompatibleConnector } from "../src/lib/ai/providers/openai-compatible-connector";
import { GeminiProviderConnector } from "../src/lib/ai/providers/gemini-provider-connector";
import { AnthropicProviderConnector } from "../src/lib/ai/providers/anthropic-provider-connector";
import { createProviderConnector } from "../src/lib/ai/providers/provider-connector-factory";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("provider catalog", () => {
  it("contains one unique first-class connection for OpenRouter and every supported provider", () => {
    const identifiers = providerCatalog.map((provider) => provider.identifier);

    expect(new Set(identifiers).size).toBe(identifiers.length);
    expect(identifiers).toEqual(
      expect.arrayContaining([
        "openrouter",
        "openai",
        "google-gemini",
        "anthropic",
        "groq",
        "mistral",
        "deepseek",
        "xai",
        "cohere",
        "together",
        "fireworks",
        "perplexity",
        "custom-openai-compatible",
      ])
    );
  });
});

describe("provider failure classification", () => {
  it.each([
    [401, "invalid_api_key", "INVALID_CREDENTIAL"],
    [402, "insufficient_credits", "QUOTA_EXHAUSTED"],
    [403, "permission_denied", "PERMISSION_DENIED"],
    [429, "rate_limit_exceeded", "RATE_LIMITED"],
    [429, "enforced_spend_limit_reached", "QUOTA_EXHAUSTED"],
    [503, "service_unavailable", "PROVIDER_UNAVAILABLE"],
  ])("maps %i/%s to %s", (status, code, expected) => {
    expect(classifyProviderFailure({ status, code, message: "safe message" }).health).toBe(
      expected
    );
  });
});

describe("OpenRouter connector", () => {
  it("validates the inference key and returns provider-reported key quota", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: {
          label: "sk-or-v1-abc...7890",
          limit: 100,
          limit_remaining: 74.5,
          limit_reset: "monthly",
          usage: 25.5,
          usage_daily: 2.25,
          usage_weekly: 8.5,
          usage_monthly: 25.5,
          is_free_tier: false,
          expires_at: "2027-12-31T23:59:59Z",
        },
      })
    );
    const connector = new OpenRouterConnector(fetchMock as typeof fetch);

    const result = await connector.validateCredentials({ apiKey: "sk-or-v1-test" });
    const quota = await connector.fetchProviderQuota({ apiKey: "sk-or-v1-test" });

    expect(result.health).toBe("ACTIVE");
    expect(quota.availability).toBe("AVAILABLE");
    expect(quota.scope).toBe("API_KEY");
    expect(quota.metrics).toEqual(
      expect.arrayContaining([
        { key: "spend_limit", label: "Spending limit", value: 100, unit: "USD" },
        { key: "remaining", label: "Remaining", value: 74.5, unit: "USD" },
        { key: "usage", label: "Total usage", value: 25.5, unit: "USD" },
      ])
    );
    expect(quota.resetPolicy).toBe("monthly");
  });

  it("discovers models with context, modalities, and per-million-token prices", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        data: [
          {
            id: "openai/gpt-4.1-mini",
            name: "GPT-4.1 Mini",
            context_length: 1048576,
            architecture: {
              input_modalities: ["text", "image"],
              output_modalities: ["text"],
            },
            pricing: { prompt: "0.0000004", completion: "0.0000016" },
          },
        ],
      })
    );
    const connector = new OpenRouterConnector(fetchMock as typeof fetch);

    const models = await connector.discoverModels({ apiKey: "sk-or-v1-test" });

    expect(models).toEqual([
      expect.objectContaining({
        id: "openai/gpt-4.1-mini",
        displayName: "GPT-4.1 Mini",
        contextWindow: 1048576,
        supportsVision: true,
        supportsAudioIn: false,
        inputCostPerMillion: 0.4,
        outputCostPerMillion: 1.6,
        pricingSource: "PROVIDER",
      }),
    ]);
  });

  it("adds account credits when an OpenRouter management key is configured", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.endsWith("/credits")) {
        return jsonResponse({ data: { total_credits: 120, total_usage: 35.25 } });
      }
      return jsonResponse({
        data: {
          limit: 50,
          limit_remaining: 20,
          usage: 30,
          limit_reset: "monthly",
        },
      });
    });
    const connector = new OpenRouterConnector(fetchMock as typeof fetch);

    const quota = await connector.fetchProviderQuota({
      apiKey: "sk-or-v1-test",
      managementKey: "sk-or-mgmt-test",
    });

    expect(quota.metrics).toEqual(
      expect.arrayContaining([
        { key: "account_credits", label: "Purchased credits", value: 120, unit: "USD" },
        { key: "account_usage", label: "Account usage", value: 35.25, unit: "USD" },
        { key: "account_remaining", label: "Account balance", value: 84.75, unit: "USD" },
      ])
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports an invalid key reason without leaking the submitted secret", async () => {
    const secret = "sk-or-v1-do-not-leak";
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { error: { code: "invalid_api_key", message: `Invalid token ${secret}` } },
        { status: 401 }
      )
    );
    const connector = new OpenRouterConnector(fetchMock as typeof fetch);

    const result = await connector.validateCredentials({ apiKey: secret });

    expect(result.health).toBe("INVALID_CREDENTIAL");
    expect(result.reason).toBe("The provider rejected this API key.");
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});

describe("OpenAI-compatible connector", () => {
  it("validates through model discovery and normalizes standard model payloads", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [{ id: "llama-3.3-70b-versatile", owned_by: "groq" }] })
    );
    const connector = new OpenAiCompatibleConnector(
      {
        identifier: "groq",
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        quotaMode: "RESPONSE_HEADERS",
      },
      fetchMock as typeof fetch
    );

    expect((await connector.validateCredentials({ apiKey: "gsk_test" })).health).toBe("ACTIVE");
    expect(await connector.discoverModels({ apiKey: "gsk_test" })).toEqual([
      expect.objectContaining({
        id: "llama-3.3-70b-versatile",
        displayName: "llama-3.3-70b-versatile",
        pricingSource: "UNAVAILABLE",
      }),
    ]);
  });

  it("reads provider rate quota from response headers without inventing account balance", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { data: [] },
        {
          headers: {
            "content-type": "application/json",
            "x-ratelimit-limit-requests": "14400",
            "x-ratelimit-remaining-requests": "14370",
            "x-ratelimit-reset-requests": "2m59s",
            "x-ratelimit-limit-tokens": "18000",
            "x-ratelimit-remaining-tokens": "17997",
          },
        }
      )
    );
    const connector = new OpenAiCompatibleConnector(
      {
        identifier: "groq",
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        quotaMode: "RESPONSE_HEADERS",
      },
      fetchMock as typeof fetch
    );

    const quota = await connector.fetchProviderQuota({ apiKey: "gsk_test" });

    expect(quota.availability).toBe("AVAILABLE");
    expect(quota.metrics).toEqual([
      expect.objectContaining({ key: "requests", limit: 14400, remaining: 14370 }),
      expect.objectContaining({ key: "tokens", limit: 18000, remaining: 17997 }),
    ]);
    expect(quota.note).not.toContain("balance");
  });

  it("explains when provider quota needs a separate management key", async () => {
    const connector = new OpenAiCompatibleConnector(
      {
        identifier: "openai",
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        quotaMode: "MANAGEMENT_KEY",
      },
      vi.fn() as unknown as typeof fetch
    );

    const quota = await connector.fetchProviderQuota({ apiKey: "sk-test" });

    expect(quota.availability).toBe("REQUIRES_MANAGEMENT_CREDENTIAL");
    expect(quota.note).toContain("management credential");
  });
});

describe("Gemini connector", () => {
  it("tests the key and returns only generative models available to it", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        models: [
          {
            name: "models/gemini-2.5-flash",
            displayName: "Gemini 2.5 Flash",
            inputTokenLimit: 1048576,
            outputTokenLimit: 65536,
            supportedGenerationMethods: ["generateContent", "countTokens"],
          },
          {
            name: "models/text-embedding-004",
            displayName: "Text Embedding",
            supportedGenerationMethods: ["embedContent"],
          },
        ],
      })
    );
    const connector = new GeminiProviderConnector(fetchMock as typeof fetch);

    expect((await connector.validateCredentials({ apiKey: "AIza-test" })).health).toBe("ACTIVE");
    expect(await connector.discoverModels({ apiKey: "AIza-test" })).toEqual([
      expect.objectContaining({
        id: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        contextWindow: 1048576,
      }),
    ]);
    expect((await connector.fetchProviderQuota({ apiKey: "AIza-test" })).availability).toBe(
      "UNSUPPORTED"
    );
  });
});

describe("Anthropic connector", () => {
  it("uses the inference key for models and requires an admin key for organization usage", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [{ id: "claude-sonnet-4-5", display_name: "Claude Sonnet 4.5" }] })
    );
    const connector = new AnthropicProviderConnector(fetchMock as typeof fetch);

    expect((await connector.validateCredentials({ apiKey: "sk-ant-test" })).health).toBe("ACTIVE");
    expect(await connector.discoverModels({ apiKey: "sk-ant-test" })).toEqual([
      expect.objectContaining({ id: "claude-sonnet-4-5", displayName: "Claude Sonnet 4.5" }),
    ]);
    expect((await connector.fetchProviderQuota({ apiKey: "sk-ant-test" })).availability).toBe(
      "REQUIRES_MANAGEMENT_CREDENTIAL"
    );
  });
});

describe("connector factory", () => {
  it("creates provider-specific connectors from the catalog identifier", () => {
    expect(createProviderConnector("openrouter")).toBeInstanceOf(OpenRouterConnector);
    expect(createProviderConnector("google-gemini")).toBeInstanceOf(GeminiProviderConnector);
    expect(createProviderConnector("anthropic")).toBeInstanceOf(AnthropicProviderConnector);
    expect(createProviderConnector("groq")).toBeInstanceOf(OpenAiCompatibleConnector);
    expect(() => createProviderConnector("missing-provider")).toThrow("Unsupported provider");
  });
});
