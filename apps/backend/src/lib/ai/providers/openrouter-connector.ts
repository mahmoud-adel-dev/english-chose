import { activeHealth, classifyProviderFailure } from "./provider-errors";
import {
  DiscoveredProviderModel,
  ProviderConnector,
  ProviderCredentials,
  ProviderHealthResult,
  ProviderQuotaSnapshot,
} from "./provider-types";

export class OpenRouterConnector implements ProviderConnector {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  private baseUrl(credentials: ProviderCredentials): string {
    return (credentials.baseUrl || "https://openrouter.ai/api/v1").replace(/\/$/, "");
  }

  private async request(credentials: ProviderCredentials, path: string, useManagement = false) {
    const started = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl(credentials)}${path}`, {
        headers: {
          Authorization: `Bearer ${useManagement ? credentials.managementKey : credentials.apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12_000),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, any>;
      return { response, body, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        response: undefined,
        body: { error: { code: "network_error", message: error instanceof Error ? error.name : "network_error" } },
        latencyMs: Date.now() - started,
      };
    }
  }

  async validateCredentials(credentials: ProviderCredentials): Promise<ProviderHealthResult> {
    const { response, body, latencyMs } = await this.request(credentials, "/key");
    if (response?.ok) return activeHealth(latencyMs);
    return classifyProviderFailure({
      status: response?.status,
      code: body?.error?.code,
      message: body?.error?.message,
      latencyMs,
    });
  }

  async fetchProviderQuota(credentials: ProviderCredentials): Promise<ProviderQuotaSnapshot> {
    const { response, body } = await this.request(credentials, "/key");
    if (!response?.ok) {
      const failure = classifyProviderFailure({
        status: response?.status,
        code: body?.error?.code,
        message: body?.error?.message,
      });
      return {
        availability: response?.status === 403 ? "PERMISSION_DENIED" : "TEMPORARILY_UNAVAILABLE",
        source: "OpenRouter /api/v1/key",
        scope: "API_KEY",
        metrics: [],
        retrievedAt: new Date().toISOString(),
        note: failure.reason,
      };
    }

    const data = body.data || {};
    const metrics: Array<{
      key: string;
      label: string;
      value: number;
      unit: "USD";
    }> = [
      ["spend_limit", "Spending limit", data.limit],
      ["remaining", "Remaining", data.limit_remaining],
      ["usage", "Total usage", data.usage],
      ["usage_daily", "Daily usage", data.usage_daily],
      ["usage_weekly", "Weekly usage", data.usage_weekly],
      ["usage_monthly", "Monthly usage", data.usage_monthly],
    ]
      .filter((metric) => typeof metric[2] === "number")
      .map(([key, label, value]) => ({
        key: key as string,
        label: label as string,
        value: value as number,
        unit: "USD" as const,
      }));

    let source = "OpenRouter /api/v1/key";
    if (credentials.managementKey) {
      const creditsResult = await this.request(credentials, "/credits", true);
      if (creditsResult.response?.ok) {
        const totalCredits = Number(creditsResult.body?.data?.total_credits);
        const totalUsage = Number(creditsResult.body?.data?.total_usage);
        if (Number.isFinite(totalCredits)) {
          metrics.push({
            key: "account_credits",
            label: "Purchased credits",
            value: totalCredits,
            unit: "USD",
          });
        }
        if (Number.isFinite(totalUsage)) {
          metrics.push({
            key: "account_usage",
            label: "Account usage",
            value: totalUsage,
            unit: "USD",
          });
        }
        if (Number.isFinite(totalCredits) && Number.isFinite(totalUsage)) {
          metrics.push({
            key: "account_remaining",
            label: "Account balance",
            value: Number((totalCredits - totalUsage).toFixed(6)),
            unit: "USD",
          });
        }
        source = "OpenRouter /api/v1/key and /api/v1/credits";
      }
    }

    return {
      availability: "AVAILABLE",
      source,
      scope: "API_KEY",
      metrics,
      retrievedAt: new Date().toISOString(),
      resetPolicy: data.limit_reset ?? null,
      expiresAt: data.expires_at ?? null,
      note: data.is_free_tier ? "OpenRouter free tier" : undefined,
    };
  }

  async discoverModels(credentials: ProviderCredentials): Promise<DiscoveredProviderModel[]> {
    const { response, body } = await this.request(credentials, "/models");
    if (!response?.ok) {
      const failure = classifyProviderFailure({
        status: response?.status,
        code: body?.error?.code,
        message: body?.error?.message,
      });
      throw new Error(failure.reason);
    }

    return (Array.isArray(body.data) ? body.data : []).map((model: any) => {
      const inputs = model.architecture?.input_modalities || [];
      const outputs = model.architecture?.output_modalities || [];
      const prompt = Number(model.pricing?.prompt);
      const completion = Number(model.pricing?.completion);
      return {
        id: String(model.id),
        displayName: String(model.name || model.id),
        contextWindow: Number(model.context_length || 0),
        supportsVision: inputs.includes("image"),
        supportsAudioIn: inputs.includes("audio"),
        supportsAudioOut: outputs.includes("audio"),
        supportsJsonMode: true,
        inputCostPerMillion: Number.isFinite(prompt)
          ? Number((prompt * 1_000_000).toFixed(12))
          : undefined,
        outputCostPerMillion: Number.isFinite(completion)
          ? Number((completion * 1_000_000).toFixed(12))
          : undefined,
        pricingSource: Number.isFinite(prompt) || Number.isFinite(completion) ? "PROVIDER" : "UNAVAILABLE",
        raw: model,
      } satisfies DiscoveredProviderModel;
    });
  }
}
