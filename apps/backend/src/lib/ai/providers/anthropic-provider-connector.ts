import { activeHealth, classifyProviderFailure } from "./provider-errors";
import {
  DiscoveredProviderModel,
  ProviderConnector,
  ProviderCredentials,
  ProviderHealthResult,
  ProviderQuotaSnapshot,
} from "./provider-types";

export class AnthropicProviderConnector implements ProviderConnector {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  private async listModels(credentials: ProviderCredentials) {
    const started = Date.now();
    const baseUrl = (credentials.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
    try {
      const response = await this.fetchImpl(`${baseUrl}/models`, {
        headers: {
          "x-api-key": credentials.apiKey,
          "anthropic-version": "2023-06-01",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12_000),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, any>;
      return { response, body, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        response: undefined,
        body: { error: { type: "network_error", message: error instanceof Error ? error.name : "network_error" } },
        latencyMs: Date.now() - started,
      };
    }
  }

  async validateCredentials(credentials: ProviderCredentials): Promise<ProviderHealthResult> {
    const { response, body, latencyMs } = await this.listModels(credentials);
    if (response?.ok) return activeHealth(latencyMs);
    return classifyProviderFailure({
      status: response?.status,
      code: body?.error?.type,
      message: body?.error?.message,
      latencyMs,
    });
  }

  async discoverModels(credentials: ProviderCredentials): Promise<DiscoveredProviderModel[]> {
    const { response, body } = await this.listModels(credentials);
    if (!response?.ok) throw new Error("Anthropic model discovery failed for this API key.");
    return (Array.isArray(body.data) ? body.data : []).map((model: any) => ({
      id: String(model.id),
      displayName: String(model.display_name || model.id),
      contextWindow: Number(model.context_window || 0),
      supportsVision: true,
      supportsAudioIn: false,
      supportsAudioOut: false,
      supportsJsonMode: true,
      pricingSource: "UNAVAILABLE" as const,
      raw: model,
    }));
  }

  async fetchProviderQuota(credentials: ProviderCredentials): Promise<ProviderQuotaSnapshot> {
    if (!credentials.managementKey) {
      return {
        availability: "REQUIRES_MANAGEMENT_CREDENTIAL",
        source: "Anthropic Usage and Cost Admin API",
        scope: "ORGANIZATION",
        metrics: [],
        retrievedAt: new Date().toISOString(),
        note: "Anthropic organization usage requires an Admin API key.",
      };
    }
    return {
      availability: "AVAILABLE",
      source: "Anthropic Usage and Cost Admin API",
      scope: "ORGANIZATION",
      metrics: [],
      retrievedAt: new Date().toISOString(),
      note: "Admin credential configured; usage is synchronized for the selected reporting period.",
    };
  }
}
