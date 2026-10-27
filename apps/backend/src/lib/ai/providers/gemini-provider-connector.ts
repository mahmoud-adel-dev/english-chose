import { activeHealth, classifyProviderFailure } from "./provider-errors";
import {
  DiscoveredProviderModel,
  ProviderConnector,
  ProviderCredentials,
  ProviderHealthResult,
  ProviderQuotaSnapshot,
} from "./provider-types";

export class GeminiProviderConnector implements ProviderConnector {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  private async listModels(credentials: ProviderCredentials) {
    const started = Date.now();
    const baseUrl = (credentials.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
    try {
      const response = await this.fetchImpl(
        `${baseUrl}/models?key=${encodeURIComponent(credentials.apiKey)}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) }
      );
      const body = (await response.json().catch(() => ({}))) as Record<string, any>;
      return { response, body, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        response: undefined,
        body: { error: { status: "NETWORK_ERROR", message: error instanceof Error ? error.name : "network_error" } },
        latencyMs: Date.now() - started,
      };
    }
  }

  async validateCredentials(credentials: ProviderCredentials): Promise<ProviderHealthResult> {
    const { response, body, latencyMs } = await this.listModels(credentials);
    if (response?.ok) return activeHealth(latencyMs);
    return classifyProviderFailure({
      status: response?.status,
      code: body?.error?.status,
      message: body?.error?.message,
      latencyMs,
    });
  }

  async discoverModels(credentials: ProviderCredentials): Promise<DiscoveredProviderModel[]> {
    const { response, body } = await this.listModels(credentials);
    if (!response?.ok) throw new Error("Gemini model discovery failed for this API key.");
    return (Array.isArray(body.models) ? body.models : [])
      .filter((model: any) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model: any) => ({
        id: String(model.name || "").replace(/^models\//, ""),
        displayName: String(model.displayName || model.name),
        contextWindow: Number(model.inputTokenLimit || 0),
        supportsVision: true,
        supportsAudioIn: true,
        supportsAudioOut: false,
        supportsJsonMode: true,
        pricingSource: "UNAVAILABLE" as const,
        raw: model,
      }));
  }

  async fetchProviderQuota(): Promise<ProviderQuotaSnapshot> {
    return {
      availability: "UNSUPPORTED",
      source: "Gemini Developer API",
      scope: "PROJECT",
      metrics: [],
      retrievedAt: new Date().toISOString(),
      note: "Gemini exposes project quota in Google AI Studio, not through this API key endpoint.",
    };
  }
}
