export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  content: string;
  parsedJson?: unknown;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  modelIdentifier: string;
}

export interface SttTranscriptionRequest {
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
}

export interface SttTranscriptionResponse {
  transcript: string;
  confidence?: number;
  durationSec: number;
  latencyMs: number;
}

export interface ProviderConnectionTestResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface IAiProviderAdapter {
  readonly providerId: string;
  generateCompletion(model: string, req: AiCompletionRequest): Promise<AiCompletionResponse>;
  transcribeAudio(model: string, req: SttTranscriptionRequest): Promise<SttTranscriptionResponse>;
  testConnection(): Promise<ProviderConnectionTestResult>;
}
