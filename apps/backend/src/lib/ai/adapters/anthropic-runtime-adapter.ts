import {
  AiCompletionRequest,
  AiCompletionResponse,
  IAiProviderAdapter,
  ProviderConnectionTestResult,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
} from "../types";

export class AnthropicRuntimeAdapter implements IAiProviderAdapter {
  readonly providerId = "anthropic";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  private headers() {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      Accept: "application/json",
    };
  }

  async generateCompletion(model: string, req: AiCompletionRequest): Promise<AiCompletionResponse> {
    const started = Date.now();
    const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/messages`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model,
        system: req.systemPrompt || undefined,
        messages: [{ role: "user", content: req.userPrompt }],
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 2048,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, any>;
    if (!response.ok) throw new Error(`Anthropic request failed (${response.status}): ${body?.error?.type || "request_failed"}`);
    const content = (Array.isArray(body.content) ? body.content : [])
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text)
      .join("\n");
    let parsedJson: unknown;
    if (req.jsonSchema) {
      try { parsedJson = JSON.parse(content); } catch { parsedJson = undefined; }
    }
    return {
      content,
      parsedJson,
      promptTokens: Number(body?.usage?.input_tokens || 0),
      completionTokens: Number(body?.usage?.output_tokens || 0),
      latencyMs: Date.now() - started,
      modelIdentifier: String(body?.model || model),
    };
  }

  async transcribeAudio(_model: string, _req: SttTranscriptionRequest): Promise<SttTranscriptionResponse> {
    throw new Error("Anthropic does not expose speech-to-text through the Messages API.");
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    const started = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/models`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(12_000),
      });
      return { ok: response.ok, latencyMs: Date.now() - started, error: response.ok ? undefined : `Anthropic returned HTTP ${response.status}.` };
    } catch {
      return { ok: false, latencyMs: Date.now() - started, error: "Anthropic could not be reached." };
    }
  }
}
