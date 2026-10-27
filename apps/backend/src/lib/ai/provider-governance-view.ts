interface ProviderRecord {
  id: string;
  identifier: string;
  name: string;
  baseUrl: string | null;
  status: string;
  priorityOrder: number;
  maxRpm: number;
  apiKeySecretKey: string;
  credentialSource: string;
  inferenceCredential: unknown;
  managementCredential: unknown;
  inferenceKeyLastFour: string | null;
  managementKeyLastFour: string | null;
  credentialHealth: string;
  credentialReason: string | null;
  providerErrorCode: string | null;
  lastTestedAt: Date | null;
  lastTestLatencyMs: number | null;
  quotaSnapshot: unknown;
  quotaRefreshedAt: Date | null;
  discoverySnapshot: unknown;
  modelsDiscoveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  models?: unknown[];
}

export function credentialMask(
  source: string,
  lastFour: string | null,
  environmentReference?: string
) {
  if (source === "ENV_REFERENCE" && environmentReference) {
    return { configured: true, mask: "Server environment" };
  }
  if (lastFour) return { configured: true, mask: `••••${lastFour}` };
  return { configured: false, mask: null };
}

export function toProviderAdminView(provider: ProviderRecord) {
  const discovery = Array.isArray(provider.discoverySnapshot)
    ? provider.discoverySnapshot
    : [];
  return {
    id: provider.id,
    identifier: provider.identifier,
    name: provider.name,
    baseUrl: provider.baseUrl,
    status: provider.status,
    priorityOrder: provider.priorityOrder,
    maxRpm: provider.maxRpm,
    credentialSource: provider.credentialSource,
    credentialHealth: provider.credentialHealth,
    credentialReason: provider.credentialReason,
    providerErrorCode: provider.providerErrorCode,
    lastTestedAt: provider.lastTestedAt?.toISOString() ?? null,
    lastTestLatencyMs: provider.lastTestLatencyMs,
    quota: provider.quotaSnapshot,
    quotaRefreshedAt: provider.quotaRefreshedAt?.toISOString() ?? null,
    discoveredModels: discovery,
    discoveredModelCount: discovery.length,
    modelsDiscoveredAt: provider.modelsDiscoveredAt?.toISOString() ?? null,
    models: provider.models ?? [],
    credentials: {
      inference: credentialMask(
        provider.credentialSource,
        provider.inferenceKeyLastFour,
        provider.apiKeySecretKey
      ),
      management: credentialMask("ENCRYPTED", provider.managementKeyLastFour),
    },
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}
