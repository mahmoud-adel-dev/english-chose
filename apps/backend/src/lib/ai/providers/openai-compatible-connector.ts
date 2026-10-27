import { activeHealth, classifyProviderFailure } from "./provider-errors";
import {
  DiscoveredProviderModel,
  ProviderConnector,
  ProviderCredentials,
  ProviderHealthResult,
  ProviderQuotaSnapshot,
} from "./provider-types";

export interface OpenAiCompatibleOptions {
  identifier: string;
  name: string;
  baseUrl: string;
  quotaMode: "INFERENCE_KEY" | "MANAGEMENT_KEY" | "RESPONSE_HEADERS" | "UNSUPPORTED";
  modelDiscovery?: boolean;
}

interface ProviderHttpResult {
  response?: Response;
  body: Record<string, any>;
  latencyMs: number;
}

export class OpenAiCompatibleConnector implements ProviderConnector {
  constructor(
    private readonly options: OpenAiCompatibleOptions,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  private baseUrl(credentials: ProviderCredentials): string {
    return (credentials.baseUrl || this.options.baseUrl).replace(/\/$/, "");
  }

  private async requestModels(credentials: ProviderCredentials): Promise<ProviderHttpResult> {
    const started = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl(credentials)}/models`, {
        headers: { Authorization: `Bearer ${credentials.apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, any>;
      return { response, body, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        body: { error: { code: "network_error", message: error instanceof Error ? error.name : "network_error" } },
        latencyMs: Date.now() - started,
      };
    }
  }

  async validateCredentials(credentials: ProviderCredentials): Promise<ProviderHealthResult> {
    if (this.options.modelDiscovery === false) {
      return {
        health: "ACTIVE_LIMITED",
        ok: true,
        latencyMs: 0,
        reason: "This provider does not expose model discovery; validation requires an inference request.",
        checkedAt: new Date().toISOString(),
      };
    }
    const { response, body, latencyMs } = await this.requestModels(credentials);
    if (response?.ok) return activeHealth(latencyMs);
    return classifyProviderFailure({
      status: response?.status,
      code: body?.error?.code || body?.error?.type,
      message: body?.error?.message,
      latencyMs,
    });
  }

  async discoverModels(credentials: ProviderCredentials): Promise<DiscoveredProviderModel[]> {
    if (this.options.modelDiscovery === false) return [];
    const { response, body } = await this.requestModels(credentials);
    if (!response?.ok) {
      const failure = classifyProviderFailure({
        status: response?.status,
        code: body?.error?.code || body?.error?.type,
        message: body?.error?.message,
      });
      throw new Error(failure.reason);
    }

    const data = Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : [];
    return data.map((model: any) => ({
      id: String(model.id || model.name),
      displayName: String(model.display_name || model.name || model.id),
      contextWindow: Number(model.context_window || model.context_length || 0),
      supportsVision: Boolean(model.capabilities?.vision),
      supportsAudioIn: Boolean(model.capabilities?.audio_input),
      supportsAudioOut: Boolean(model.capabilities?.audio_output),
      supportsJsonMode: model.capabilities?.json_mode !== false,
      pricingSource: "UNAVAILABLE" as const,
      raw: model,
    }));
  }

  async fetchProviderQuota(credentials: ProviderCredentials): Promise<ProviderQuotaSnapshot> {
    if (this.options.quotaMode === "MANAGEMENT_KEY" && !credentials.managementKey) {
      return {
        availability: "REQUIRES_MANAGEMENT_CREDENTIAL",
        source: `${this.options.name} management API`,
        scope: "ORGANIZATION",
        metrics: [],
        retrievedAt: new Date().toISOString(),
        note: `${this.options.name} usage requires a separate management credential.`,
      };
    }
    if (this.options.quotaMode === "UNSUPPORTED") {
      return {
        availability: "UNSUPPORTED",
        source: `${this.options.name} API`,
        scope: "API_KEY",
        metrics: [],
        retrievedAt: new Date().toISOString(),
        note: `${this.options.name} does not expose quota to this API key.`,
      };
    }

    const { response, body } = await this.requestModels(credentials);
    if (!response?.ok) {
      const failure = classifyProviderFailure({
        status: response?.status,
        code: body?.error?.code || body?.error?.type,
        message: body?.error?.message,
      });
      return {
        availability: "TEMPORARILY_UNAVAILABLE",
        source: `${this.options.name} response headers`,
        scope: "PROJECT",
        metrics: [],
        retrievedAt: new Date().toISOString(),
        note: failure.reason,
      };
    }

    const readNumber = (name: string) => {
      const value = response.headers.get(name);
      return value === null || value.trim() === "" ? undefined : Number(value);
    };
    const requestLimit = readNumber("x-ratelimit-limit-requests");
    const requestRemaining = readNumber("x-ratelimit-remaining-requests");
    const tokenLimit = readNumber("x-ratelimit-limit-tokens");
    const tokenRemaining = readNumber("x-ratelimit-remaining-tokens");
    const metrics = [];
    if (Number.isFinite(requestLimit) || Number.isFinite(requestRemaining)) {
      metrics.push({
        key: "requests",
        label: "Requests",
        value: requestRemaining ?? 0,
        unit: "REQUESTS" as const,
        limit: requestLimit,
        remaining: requestRemaining,
      });
    }
    if (Number.isFinite(tokenLimit) || Number.isFinite(tokenRemaining)) {
      metrics.push({
        key: "tokens",
        label: "Tokens",
        value: tokenRemaining ?? 0,
        unit: "TOKENS" as const,
        limit: tokenLimit,
        remaining: tokenRemaining,
      });
    }
    return {
      availability: metrics.length ? "AVAILABLE" : "UNSUPPORTED",
      source: `${this.options.name} response headers`,
      scope: "PROJECT",
      metrics,
      retrievedAt: new Date().toISOString(),
      resetsAt: response.headers.get("x-ratelimit-reset-requests"),
      note: metrics.length
        ? "Provider-reported rate capacity."
        : `${this.options.name} did not return quota headers for this request.`,
    };
  }
}
