import { CredentialHealth, ProviderHealthResult } from "./provider-types";

const SAFE_REASONS: Record<CredentialHealth, string> = {
  UNTESTED: "The credential has not been tested yet.",
  ACTIVE: "The credential is active.",
  ACTIVE_LIMITED: "The credential is valid but some optional permissions are unavailable.",
  QUOTA_EXHAUSTED: "The credential is valid, but the provider-reported quota or credit is exhausted.",
  RATE_LIMITED: "The credential is valid, but the provider is temporarily rate limiting requests.",
  INVALID_CREDENTIAL: "The provider rejected this API key.",
  PERMISSION_DENIED: "The API key does not have permission for this resource.",
  BILLING_DISABLED: "Billing or prepayment is not enabled for this provider account.",
  PROVIDER_UNAVAILABLE: "The provider is temporarily unavailable.",
  NETWORK_ERROR: "The provider could not be reached.",
  UNKNOWN_ERROR: "The provider returned an unrecognized error.",
};

export function classifyProviderFailure(input: {
  status?: number;
  code?: string;
  message?: string;
  latencyMs?: number;
}): ProviderHealthResult {
  const code = (input.code || "").toLowerCase();
  const message = (input.message || "").toLowerCase();
  let health: CredentialHealth = "UNKNOWN_ERROR";

  if (!input.status) health = "NETWORK_ERROR";
  else if (input.status === 401) health = "INVALID_CREDENTIAL";
  else if (input.status === 402) health = "QUOTA_EXHAUSTED";
  else if (input.status === 403) health = "PERMISSION_DENIED";
  else if (input.status === 429) {
    health = /spend|quota|credit|usage_limit|enforced/.test(`${code} ${message}`)
      ? "QUOTA_EXHAUSTED"
      : "RATE_LIMITED";
  } else if (input.status >= 500) health = "PROVIDER_UNAVAILABLE";
  else if (/billing|payment|prepay/.test(`${code} ${message}`)) health = "BILLING_DISABLED";

  return {
    health,
    ok: false,
    latencyMs: input.latencyMs ?? 0,
    reason: SAFE_REASONS[health],
    providerErrorCode: input.code,
    checkedAt: new Date().toISOString(),
  };
}

export function activeHealth(latencyMs: number): ProviderHealthResult {
  return {
    health: "ACTIVE",
    ok: true,
    latencyMs,
    checkedAt: new Date().toISOString(),
  };
}
