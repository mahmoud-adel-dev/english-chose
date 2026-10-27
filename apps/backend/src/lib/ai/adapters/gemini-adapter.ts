import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IAiProviderAdapter,
  AiCompletionRequest,
  AiCompletionResponse,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
  ProviderConnectionTestResult,
} from "../types";

export class GeminiAiProviderAdapter implements IAiProviderAdapter {
  readonly providerId = "google-gemini";
  private client: GoogleGenerativeAI | null = null;

  constructor(private apiKey: string = process.env.GEMINI_API_KEY || "") {
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      const key = process.env.GEMINI_API_KEY || this.apiKey;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not configured on the server.");
      }
      this.client = new GoogleGenerativeAI(key);
    }
    return this.client;
  }

  async generateCompletion(
    model: string,
    req: AiCompletionRequest
  ): Promise<AiCompletionResponse> {
    const startTime = Date.now();
    const ai = this.getClient();
    const generativeModel = ai.getGenerativeModel({
      model: model || "gemini-flash-latest",
      generationConfig: {
        temperature: req.temperature ?? 0.3,
        maxOutputTokens: req.maxTokens ?? 2048,
        responseMimeType: req.jsonSchema ? "application/json" : "text/plain",
      },
      systemInstruction: req.systemPrompt,
    });

    const result = await generativeModel.generateContent(req.userPrompt);
    const response = await result.response;
    const text = response.text();
    const latencyMs = Date.now() - startTime;

    let parsedJson: unknown = undefined;
    if (req.jsonSchema) {
      try {
        parsedJson = JSON.parse(text);
      } catch (err) {
        // Fallback or re-throw
        parsedJson = undefined;
      }
    }

    const usage = response.usageMetadata;

    return {
      content: text,
      parsedJson,
      promptTokens: usage?.promptTokenCount ?? 0,
      completionTokens: usage?.candidatesTokenCount ?? 0,
      latencyMs,
      modelIdentifier: model,
    };
  }

  async transcribeAudio(
    model: string,
    req: SttTranscriptionRequest
  ): Promise<SttTranscriptionResponse> {
    const startTime = Date.now();
    const ai = this.getClient();
    const generativeModel = ai.getGenerativeModel({
      model: model || "gemini-flash-latest",
      generationConfig: {
        temperature: 0.0,
      },
    });

    const base64Audio = req.audioBuffer.toString("base64");
    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: req.mimeType || "audio/m4a",
      },
    };

    const prompt =
      "Transcribe the spoken English accurately word-for-word. Do not summarize or correct mistakes. Return only the raw transcript text.";

    const result = await generativeModel.generateContent([prompt, audioPart]);
    const response = await result.response;
    const transcript = response.text().trim();
    const latencyMs = Date.now() - startTime;

    return {
      transcript,
      confidence: 0.95,
      durationSec: 5.0,
      latencyMs,
    };
  }

  async testConnection(): Promise<ProviderConnectionTestResult> {
    const startTime = Date.now();
    try {
      const ai = this.getClient();
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("Respond with 'OK'");
      const text = result.response.text();
      return {
        ok: text.toLowerCase().includes("ok"),
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
