export type ProviderProtocol =
  | "OPENROUTER"
  | "OPENAI_COMPATIBLE"
  | "GEMINI"
  | "ANTHROPIC"
  | "COHERE";

export interface ProviderDefinition {
  identifier: string;
  name: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  supportsManagementKey: boolean;
  quotaMode: "INFERENCE_KEY" | "MANAGEMENT_KEY" | "RESPONSE_HEADERS" | "UNSUPPORTED";
  modelDiscovery: boolean;
}

export const providerCatalog: ProviderDefinition[] = [
  { identifier: "openrouter", name: "OpenRouter", protocol: "OPENROUTER", defaultBaseUrl: "https://openrouter.ai/api/v1", supportsManagementKey: true, quotaMode: "INFERENCE_KEY", modelDiscovery: true },
  { identifier: "openai", name: "OpenAI", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.openai.com/v1", supportsManagementKey: true, quotaMode: "MANAGEMENT_KEY", modelDiscovery: true },
  { identifier: "google-gemini", name: "Google Gemini", protocol: "GEMINI", defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "anthropic", name: "Anthropic", protocol: "ANTHROPIC", defaultBaseUrl: "https://api.anthropic.com/v1", supportsManagementKey: true, quotaMode: "MANAGEMENT_KEY", modelDiscovery: true },
  { identifier: "groq", name: "Groq", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.groq.com/openai/v1", supportsManagementKey: false, quotaMode: "RESPONSE_HEADERS", modelDiscovery: true },
  { identifier: "mistral", name: "Mistral AI", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.mistral.ai/v1", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "deepseek", name: "DeepSeek", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.deepseek.com/v1", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "xai", name: "xAI", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.x.ai/v1", supportsManagementKey: false, quotaMode: "RESPONSE_HEADERS", modelDiscovery: true },
  { identifier: "cohere", name: "Cohere", protocol: "COHERE", defaultBaseUrl: "https://api.cohere.com/v1", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "together", name: "Together AI", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.together.xyz/v1", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "fireworks", name: "Fireworks AI", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.fireworks.ai/inference/v1", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: true },
  { identifier: "perplexity", name: "Perplexity", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "https://api.perplexity.ai", supportsManagementKey: false, quotaMode: "UNSUPPORTED", modelDiscovery: false },
  { identifier: "custom-openai-compatible", name: "Custom OpenAI-compatible", protocol: "OPENAI_COMPATIBLE", defaultBaseUrl: "", supportsManagementKey: false, quotaMode: "RESPONSE_HEADERS", modelDiscovery: true },
];

export function getProviderDefinition(identifier: string): ProviderDefinition | undefined {
  return providerCatalog.find((provider) => provider.identifier === identifier);
}
