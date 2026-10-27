import {
  AiCompletionRequest,
  AiCompletionResponse,
  IAiProviderAdapter,
  ProviderConnectionTestResult,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
} from "../types";

export class OpenAiCompatibleRuntimeAdapter implements IAiProviderAdapter {
  constructor(
    readonly providerId: string,
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  private headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async generateCompletion(model: string, req: AiCompletionRequest): Promise<AiCompletionResponse> {
    const started = Date.now();
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages: [
          ...(req.systemPrompt ? [{ role: "system", content: req.systemPrompt }] : []),
          { role: "user", content: req.userPrompt },
        ],
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 2048,
        ...(req.jsonSchema ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, any>;
    if (!response.ok) {
      throw new Error(`Provider request failed (${response.status}): ${body?.error?.code || body?.error?.type || "request_failed"}`);
    }
    const content = String(body?.choices?.[0]?.message?.content || "");
    let parsedJson: unknown;
    if (req.jsonSchema) {
      try { parsedJson = JSON.parse(content); } catch { parsedJson = undefined; }
    }
    return {
      content,
      parsedJson,
      promptTokens: Number(body?.usage?.prompt_tokens || body?.usage?.input_tokens || 0),
      completionTokens: Number(body?.usage?.completion_tokens || body?.usage?.output_tokens || 0),
      latencyMs: Date.now() - started,
      modelIdentifier: String(body?.model || model),
    };
  }

  async transcribeAudio(model: string, req: SttTranscriptionRequest): Promise<SttTranscriptionResponse> {
    const started = Date.now();
    const form = new FormData();
    form.append("model", model);
    form.append("language", req.language || "en");
    form.append("file", new Blob([new Uint8Array(req.audioBuffer)], { type: req.mimeType }), "audio-input");
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, any>;
    if (!response.ok) throw new Error(`Transcription failed (${response.status}).`);
    return {
      transcript: String(body.text || body.transcript || ""),
      durationSec: Number(body.duration || 0),
      latencyMs: Date.now() - started,
    };
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    const started = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      return {
        ok: response.ok,
        latencyMs: Date.now() - started,
        error: response.ok ? undefined : `Provider returned HTTP ${response.status}.`,
      };
    } catch {
      return { ok: false, latencyMs: Date.now() - started, error: "Provider could not be reached." };
    }
  }
}
