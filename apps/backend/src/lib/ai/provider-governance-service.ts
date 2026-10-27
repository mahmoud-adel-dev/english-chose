import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  decryptCredential,
  EncryptedCredential,
  encryptCredential,
} from "./provider-credentials";
import { toProviderAdminView } from "./provider-governance-view";
import { providerCatalog, getProviderDefinition } from "./providers/provider-catalog";
import { createProviderConnector } from "./providers/provider-connector-factory";
import { DiscoveredProviderModel, ProviderCredentials } from "./providers/provider-types";

const environmentKeyNames: Record<string, string> = {
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
  "google-gemini": "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  xai: "XAI_API_KEY",
  cohere: "COHERE_API_KEY",
  together: "TOGETHER_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function encryptedFromJson(value: unknown): EncryptedCredential | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  if (
    typeof item.ciphertext !== "string" ||
    typeof item.nonce !== "string" ||
    typeof item.authTag !== "string" ||
    typeof item.lastFour !== "string"
  ) return undefined;
  return {
    ciphertext: item.ciphertext,
    nonce: item.nonce,
    authTag: item.authTag,
    lastFour: item.lastFour,
    keyVersion: Number(item.keyVersion || 1),
  };
}

async function providerOrThrow(id: string) {
  const provider = await prisma.aiProvider.findUnique({ where: { id }, include: { models: true } });
  if (!provider) throw new Error("Provider connection not found.");
  return provider;
}

export async function resolveProviderCredentials(provider: {
  credentialSource: string;
  inferenceCredential: unknown;
  managementCredential: unknown;
  apiKeySecretKey: string;
  baseUrl: string | null;
}): Promise<ProviderCredentials> {
  let apiKey = "";
  if (provider.credentialSource === "ENV_REFERENCE") {
    apiKey = process.env[provider.apiKeySecretKey] || "";
  } else {
    const encrypted = encryptedFromJson(provider.inferenceCredential);
    if (encrypted) apiKey = decryptCredential(encrypted);
  }
  const management = encryptedFromJson(provider.managementCredential);
  return {
    apiKey,
    managementKey: management ? decryptCredential(management) : undefined,
    baseUrl: provider.baseUrl || undefined,
  };
}

export async function listProviderGovernance() {
  const providers = await prisma.aiProvider.findMany({
    include: { models: { orderBy: { displayName: "asc" } } },
    orderBy: { priorityOrder: "asc" },
  });
  const configured = new Set(providers.map((provider) => provider.identifier));
  return {
    catalog: providerCatalog.map((definition) => ({
      ...definition,
      configured: configured.has(definition.identifier),
    })),
    providers: providers.map((provider) => toProviderAdminView(provider)),
  };
}

export async function configureProviderConnection(input: {
  identifier: string;
  apiKey?: string;
  managementKey?: string;
  baseUrl?: string;
}) {
  const definition = getProviderDefinition(input.identifier);
  if (!definition) throw new Error("Unsupported provider identifier.");
  if (definition.identifier === "custom-openai-compatible" && !input.baseUrl?.startsWith("https://")) {
    throw new Error("Custom providers require an HTTPS base URL.");
  }

  const existing = await prisma.aiProvider.findUnique({ where: { identifier: input.identifier } });
  const inference = input.apiKey?.trim() ? encryptCredential(input.apiKey.trim()) : undefined;
  const management = input.managementKey?.trim()
    ? encryptCredential(input.managementKey.trim())
    : undefined;
  const envName = environmentKeyNames[input.identifier] || "CUSTOM_PROVIDER_API_KEY";
  if (!existing && !inference && !process.env[envName]) {
    throw new Error("An API key is required for this provider.");
  }

  const data: Prisma.AiProviderUncheckedCreateInput = {
    identifier: definition.identifier,
    name: definition.name,
    baseUrl: input.baseUrl?.trim() || definition.defaultBaseUrl || null,
    apiKeySecretKey: envName,
    credentialSource: inference ? "ENCRYPTED" : "ENV_REFERENCE",
    inferenceCredential: inference ? asJson(inference) : undefined,
    managementCredential: management ? asJson(management) : undefined,
    inferenceKeyLastFour: inference?.lastFour,
    managementKeyLastFour: management?.lastFour,
    credentialHealth: "UNTESTED",
    credentialReason: null,
    providerErrorCode: null,
    lastTestedAt: null,
    lastTestLatencyMs: null,
  };

  const provider = existing
    ? await prisma.aiProvider.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          baseUrl: data.baseUrl,
          ...(inference
            ? {
                credentialSource: "ENCRYPTED",
                inferenceCredential: asJson(inference),
                inferenceKeyLastFour: inference.lastFour,
              }
            : {}),
          ...(management
            ? {
                managementCredential: asJson(management),
                managementKeyLastFour: management.lastFour,
              }
            : {}),
          credentialHealth: "UNTESTED",
          credentialReason: null,
          providerErrorCode: null,
        },
        include: { models: true },
      })
    : await prisma.aiProvider.create({ data, include: { models: true } });

  return toProviderAdminView(provider);
}

export async function testProviderConnection(id: string) {
  const provider = await providerOrThrow(id);
  const credentials = await resolveProviderCredentials(provider);
  if (!credentials.apiKey) throw new Error("The configured API key is empty or unavailable.");
  const connector = createProviderConnector(provider.identifier);
  const health = await connector.validateCredentials(credentials);

  let models: DiscoveredProviderModel[] = [];
  let quota: unknown = provider.quotaSnapshot;
  if (health.ok) {
    const [modelsResult, quotaResult] = await Promise.allSettled([
      connector.discoverModels(credentials),
      connector.fetchProviderQuota(credentials),
    ]);
    if (modelsResult.status === "fulfilled") models = modelsResult.value;
    if (quotaResult.status === "fulfilled") quota = quotaResult.value;
  }

  const now = new Date();
  const updated = await prisma.aiProvider.update({
    where: { id },
    data: {
      credentialHealth: health.health,
      credentialReason: health.reason || null,
      providerErrorCode: health.providerErrorCode || null,
      lastTestedAt: now,
      lastTestLatencyMs: health.latencyMs,
      ...(health.ok && models.length
        ? { discoverySnapshot: asJson(models), modelsDiscoveredAt: now }
        : {}),
      ...(health.ok && quota
        ? { quotaSnapshot: asJson(quota), quotaRefreshedAt: now }
        : {}),
    },
    include: { models: true },
  });
  return toProviderAdminView(updated);
}

export async function refreshProviderQuota(id: string) {
  const provider = await providerOrThrow(id);
  const connector = createProviderConnector(provider.identifier);
  const quota = await connector.fetchProviderQuota(await resolveProviderCredentials(provider));
  const updated = await prisma.aiProvider.update({
    where: { id },
    data: { quotaSnapshot: asJson(quota), quotaRefreshedAt: new Date() },
    include: { models: true },
  });
  return toProviderAdminView(updated);
}

export async function discoverProviderModels(id: string) {
  const provider = await providerOrThrow(id);
  const connector = createProviderConnector(provider.identifier);
  const models = await connector.discoverModels(await resolveProviderCredentials(provider));
  const identifiers = models.map((model) => model.id);
  await prisma.$transaction([
    prisma.aiModel.updateMany({
      where: { providerId: id, modelIdentifier: { notIn: identifiers } },
      data: { isAvailable: false },
    }),
    prisma.aiModel.updateMany({
      where: { providerId: id, modelIdentifier: { in: identifiers } },
      data: { isAvailable: true, discoveredAt: new Date() },
    }),
    prisma.aiProvider.update({
      where: { id },
      data: { discoverySnapshot: asJson(models), modelsDiscoveredAt: new Date() },
    }),
  ]);
  return models;
}

export async function importProviderModels(id: string, modelIdentifiers: string[]) {
  const provider = await providerOrThrow(id);
  const snapshot = Array.isArray(provider.discoverySnapshot)
    ? (provider.discoverySnapshot as unknown as DiscoveredProviderModel[])
    : [];
  const selected = snapshot.filter((model) => modelIdentifiers.includes(model.id));
  if (!selected.length) throw new Error("Select at least one discovered model.");

  await prisma.$transaction(
    selected.map((model) =>
      prisma.aiModel.upsert({
        where: { providerId_modelIdentifier: { providerId: id, modelIdentifier: model.id } },
        update: {
          displayName: model.displayName,
          contextWindow: model.contextWindow || 128000,
          supportsVision: model.supportsVision,
          supportsAudioIn: model.supportsAudioIn,
          supportsAudioOut: model.supportsAudioOut,
          supportsJsonMode: model.supportsJsonMode,
          costPerInput1k: (model.inputCostPerMillion || 0) / 1000,
          costPerOutput1k: (model.outputCostPerMillion || 0) / 1000,
          pricingSource: model.pricingSource,
          sourceMetadata: model.raw ? asJson(model.raw) : undefined,
          isAvailable: true,
          discoveredAt: new Date(),
        },
        create: {
          providerId: id,
          modelIdentifier: model.id,
          displayName: model.displayName,
          contextWindow: model.contextWindow || 128000,
          supportsVision: model.supportsVision,
          supportsAudioIn: model.supportsAudioIn,
          supportsAudioOut: model.supportsAudioOut,
          supportsJsonMode: model.supportsJsonMode,
          costPerInput1k: (model.inputCostPerMillion || 0) / 1000,
          costPerOutput1k: (model.outputCostPerMillion || 0) / 1000,
          pricingSource: model.pricingSource,
          sourceMetadata: model.raw ? asJson(model.raw) : undefined,
          isAvailable: true,
          discoveredAt: new Date(),
        },
      })
    )
  );
  return providerOrThrow(id).then((result) => toProviderAdminView(result));
}
