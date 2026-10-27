import { AnthropicProviderConnector } from "./anthropic-provider-connector";
import { GeminiProviderConnector } from "./gemini-provider-connector";
import { OpenAiCompatibleConnector } from "./openai-compatible-connector";
import { OpenRouterConnector } from "./openrouter-connector";
import { getProviderDefinition } from "./provider-catalog";
import { ProviderConnector } from "./provider-types";

export function createProviderConnector(identifier: string, fetchImpl: typeof fetch = fetch): ProviderConnector {
  const definition = getProviderDefinition(identifier);
  if (!definition) throw new Error(`Unsupported provider: ${identifier}`);

  if (definition.protocol === "OPENROUTER") return new OpenRouterConnector(fetchImpl);
  if (definition.protocol === "GEMINI") return new GeminiProviderConnector(fetchImpl);
  if (definition.protocol === "ANTHROPIC") return new AnthropicProviderConnector(fetchImpl);

  return new OpenAiCompatibleConnector(
    {
      identifier: definition.identifier,
      name: definition.name,
      baseUrl: definition.defaultBaseUrl,
      quotaMode: definition.quotaMode,
      modelDiscovery: definition.modelDiscovery,
    },
    fetchImpl
  );
}
