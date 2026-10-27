export type CredentialHealth =
  | "UNTESTED"
  | "ACTIVE"
  | "ACTIVE_LIMITED"
  | "QUOTA_EXHAUSTED"
  | "RATE_LIMITED"
  | "INVALID_CREDENTIAL"
  | "PERMISSION_DENIED"
  | "BILLING_DISABLED"
  | "PROVIDER_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface ProviderCredentials {
  apiKey: string;
  managementKey?: string;
  baseUrl?: string;
}

export interface ProviderHealthResult {
  health: CredentialHealth;
  ok: boolean;
  latencyMs: number;
  reason?: string;
  providerErrorCode?: string;
  checkedAt: string;
}

export interface ProviderQuotaMetric {
  key: string;
  label: string;
  value: number;
  unit: "USD" | "REQUESTS" | "TOKENS" | "SECONDS";
  limit?: number;
  remaining?: number;
}

export interface ProviderQuotaSnapshot {
  availability:
    | "AVAILABLE"
    | "REQUIRES_MANAGEMENT_CREDENTIAL"
    | "UNSUPPORTED"
    | "PERMISSION_DENIED"
    | "TEMPORARILY_UNAVAILABLE";
  source: string;
  scope: "API_KEY" | "PROJECT" | "WORKSPACE" | "ORGANIZATION" | "ACCOUNT";
  metrics: ProviderQuotaMetric[];
  retrievedAt: string;
  resetPolicy?: string | null;
  resetsAt?: string | null;
  expiresAt?: string | null;
  note?: string;
}

export interface DiscoveredProviderModel {
  id: string;
  displayName: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsAudioIn: boolean;
  supportsAudioOut: boolean;
  supportsJsonMode: boolean;
  inputCostPerMillion?: number;
  outputCostPerMillion?: number;
  pricingSource: "PROVIDER" | "UNAVAILABLE";
  raw?: Record<string, unknown>;
}

export interface ProviderConnector {
  validateCredentials(credentials: ProviderCredentials): Promise<ProviderHealthResult>;
  discoverModels(credentials: ProviderCredentials): Promise<DiscoveredProviderModel[]>;
  fetchProviderQuota(credentials: ProviderCredentials): Promise<ProviderQuotaSnapshot>;
}
