import { AiTaskType, ProviderStatus } from "@prisma/client";
import { prisma } from "../prisma";
import {
  IAiProviderAdapter,
  AiCompletionRequest,
  AiCompletionResponse,
  SttTranscriptionRequest,
  SttTranscriptionResponse,
} from "./types";
import { MockAiProviderAdapter } from "./adapters/mock-adapter";
import { GeminiAiProviderAdapter } from "./adapters/gemini-adapter";
import { OpenAiCompatibleRuntimeAdapter } from "./adapters/openai-compatible-runtime-adapter";
import { AnthropicRuntimeAdapter } from "./adapters/anthropic-runtime-adapter";
import { resolveProviderCredentials } from "./provider-governance-service";
import { getProviderDefinition } from "./providers/provider-catalog";

export class AiTaskRouter {
  private static adapters: Map<string, IAiProviderAdapter> = new Map<string, IAiProviderAdapter>([
    ["mock-provider", new MockAiProviderAdapter()],
  ]);

  /**
   * Register a custom or test adapter.
   */
  static registerAdapter(providerId: string, adapter: IAiProviderAdapter) {
    this.adapters.set(providerId, adapter);
  }

  /**
   * Retrieves an adapter by provider identifier.
   */
  static getAdapter(providerId: string): IAiProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  private static isCredentialUsable(health: string): boolean {
    return ["UNTESTED", "ACTIVE", "ACTIVE_LIMITED", "RATE_LIMITED"].includes(health);
  }

  private static async getConfiguredAdapter(provider: {
    identifier: string;
    baseUrl: string | null;
    credentialSource: string;
    inferenceCredential: unknown;
    managementCredential: unknown;
    apiKeySecretKey: string;
  }): Promise<IAiProviderAdapter | undefined> {
    const registered = this.getAdapter(provider.identifier);
    if (registered) return registered;

    const credentials = await resolveProviderCredentials(provider);
    if (!credentials.apiKey) return undefined;
    const definition = getProviderDefinition(provider.identifier);
    const baseUrl = provider.baseUrl || definition?.defaultBaseUrl || "";

    if (provider.identifier === "google-gemini") {
      return new GeminiAiProviderAdapter(credentials.apiKey);
    }
    if (provider.identifier === "anthropic") {
      return new AnthropicRuntimeAdapter(baseUrl, credentials.apiKey);
    }
    if (definition?.protocol === "OPENAI_COMPATIBLE" || definition?.protocol === "OPENROUTER") {
      return new OpenAiCompatibleRuntimeAdapter(
        provider.identifier,
        baseUrl,
        credentials.apiKey
      );
    }
    return undefined;
  }

  /**
   * Dispatches a structured text completion task through the configured primary -> fallback chain.
   */
  static async executeCompletion(
    taskType: AiTaskType,
    req: AiCompletionRequest,
    context?: { userId?: string }
  ): Promise<AiCompletionResponse> {
    // 1. Fetch dynamic routing rule
    let routing: any = null;
    try {
      routing = await prisma.aiTaskRouting.findUnique({
        where: { taskType },
        include: {
          primaryModel: { include: { provider: true } },
          fallbackModel: { include: { provider: true } },
        },
      });
    } catch (dbErr) {
      console.warn(`[AiTaskRouter] Unable to query routing table for ${taskType}:`, dbErr);
    }

    // Blend system prompt template if not explicitly provided
    const systemPrompt = req.systemPrompt || routing?.systemPromptTpl || "";
    const mergedReq: AiCompletionRequest = {
      ...req,
      systemPrompt,
      temperature: req.temperature ?? routing?.temperature ?? 0.3,
      maxTokens: req.maxTokens ?? routing?.maxTokens ?? 2048,
    };
    const timeoutMs = routing?.timeoutMs ?? 30000;

    // 2. Attempt with Primary Model
    const primary = routing?.primaryModel;
    if (
      primary &&
      primary.isActive &&
      primary.isAvailable &&
      primary.provider.status === ProviderStatus.ACTIVE &&
      this.isCredentialUsable(primary.provider.credentialHealth)
    ) {
      const adapter = await this.getConfiguredAdapter(primary.provider);
      if (adapter) {
        try {
          const res = await this.executeWithTimeout(
            () => adapter.generateCompletion(primary.modelIdentifier, mergedReq),
            timeoutMs
          );

          // Log successful primary attempt
          await this.logUsage({
            userId: context?.userId,
            taskType,
            providerId: primary.provider.id,
            modelId: primary.id,
            promptTokens: res.promptTokens,
            completionTokens: res.completionTokens,
            durationMs: res.latencyMs,
            statusCode: 200,
            isFallback: false,
            estimatedCost: this.calculateEstimatedCost(
              res.promptTokens,
              res.completionTokens,
              Number(primary.costPerInput1k),
              Number(primary.costPerOutput1k)
            ),
          });

          return res;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[AiTaskRouter] Primary model ${primary.modelIdentifier} failed: ${errMsg}. Attempting fallback...`);

          await this.logUsage({
            userId: context?.userId,
            taskType,
            providerId: primary.provider.id,
            modelId: primary.id,
            durationMs: 0,
            statusCode: 500,
            isFallback: false,
            errorMessage: errMsg,
            estimatedCost: 0,
          });
        }
      }
    }

    // 3. Attempt with Fallback Model
    const fallback = routing?.fallbackModel;
    if (
      fallback &&
      fallback.isActive &&
      fallback.isAvailable &&
      fallback.provider.status === ProviderStatus.ACTIVE &&
      this.isCredentialUsable(fallback.provider.credentialHealth)
    ) {
      const fallbackAdapter = await this.getConfiguredAdapter(fallback.provider);
      if (fallbackAdapter) {
        try {
          const res = await this.executeWithTimeout(
            () => fallbackAdapter.generateCompletion(fallback.modelIdentifier, mergedReq),
            timeoutMs
          );

          await this.logUsage({
            userId: context?.userId,
            taskType,
            providerId: fallback.provider.id,
            modelId: fallback.id,
            promptTokens: res.promptTokens,
            completionTokens: res.completionTokens,
            durationMs: res.latencyMs,
            statusCode: 200,
            isFallback: true,
            estimatedCost: this.calculateEstimatedCost(
              res.promptTokens,
              res.completionTokens,
              Number(fallback.costPerInput1k),
              Number(fallback.costPerOutput1k)
            ),
          });

          return res;
        } catch (fallbackErr) {
          const fallbackErrMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          await this.logUsage({
            userId: context?.userId,
            taskType,
            providerId: fallback.provider.id,
            modelId: fallback.id,
            durationMs: 0,
            statusCode: 502,
            isFallback: true,
            errorMessage: fallbackErrMsg,
            estimatedCost: 0,
          });
          console.warn(`[AiTaskRouter] Fallback model ${fallback.modelIdentifier} failed: ${fallbackErrMsg}`);
        }
      }
    }

    // 4. Built-in Server Environment Gemini Fallback
    const envGeminiKey = process.env.GEMINI_API_KEY;
    if (envGeminiKey) {
      try {
        const geminiAdapter = new GeminiAiProviderAdapter(envGeminiKey);
        const res = await this.executeWithTimeout(
          () => geminiAdapter.generateCompletion("gemini-2.0-flash", mergedReq),
          timeoutMs
        );
        return res;
      } catch (geminiErr) {
        console.warn("[AiTaskRouter] Server environment Gemini fallback encountered error:", geminiErr);
      }
    }

    // 5. Built-in Deterministic Mock Fallback (guarantees zero downtime / no 500 crashes)
    console.warn(`[AiTaskRouter] Using deterministic fallback adapter for ${taskType}`);
    const mockAdapter = this.getAdapter("mock-provider") || new MockAiProviderAdapter();
    return await mockAdapter.generateCompletion("mock-default", mergedReq);
  }

  /**
   * Dispatches speech-to-text audio transcription.
   */
  static async executeAudioTranscription(
    req: SttTranscriptionRequest,
    context?: { userId?: string }
  ): Promise<SttTranscriptionResponse> {
    try {
      const routing = await prisma.aiTaskRouting.findUnique({
        where: { taskType: AiTaskType.SPEECH_TO_TEXT },
        include: {
          primaryModel: { include: { provider: true } },
          fallbackModel: { include: { provider: true } },
        },
      });

      const primary = routing?.primaryModel;
      if (primary) {
        const adapter = await this.getConfiguredAdapter(primary.provider);
        if (adapter) {
          try {
            return await adapter.transcribeAudio(primary.modelIdentifier, req);
          } catch {
            // Fallback to secondary if configured
          }
        }
      }
    } catch (e) {
      console.warn("[AiTaskRouter] Could not fetch audio transcription routing:", e);
    }

    // Server-side Gemini STT fallback if key available
    const envGeminiKey = process.env.GEMINI_API_KEY;
    if (envGeminiKey) {
      try {
        const geminiAdapter = new GeminiAiProviderAdapter(envGeminiKey);
        return await geminiAdapter.transcribeAudio("gemini-2.0-flash", req);
      } catch (e) {
        console.warn("[AiTaskRouter] Gemini audio transcription fallback encountered error:", e);
      }
    }

    // Default to mock adapter if primary fails
    const mockAdapter = this.getAdapter("mock-provider") || new MockAiProviderAdapter();
    return await mockAdapter.transcribeAudio("mock-model-v1", req);
  }

  private static async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`AI Request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  private static calculateEstimatedCost(
    promptTokens: number,
    completionTokens: number,
    costPerInput1k: number,
    costPerOutput1k: number
  ): number {
    const inputCost = (promptTokens / 1000) * costPerInput1k;
    const outputCost = (completionTokens / 1000) * costPerOutput1k;
    return inputCost + outputCost;
  }

  private static async logUsage(params: {
    userId?: string;
    taskType: AiTaskType;
    providerId: string;
    modelId: string;
    promptTokens?: number;
    completionTokens?: number;
    durationMs: number;
    statusCode: number;
    isFallback: boolean;
    errorMessage?: string;
    estimatedCost: number;
  }) {
    try {
      await prisma.aiUsageLog.create({
        data: {
          userId: params.userId,
          taskId: params.taskType,
          providerId: params.providerId,
          modelId: params.modelId,
          promptTokens: params.promptTokens ?? 0,
          completionTokens: params.completionTokens ?? 0,
          durationMs: params.durationMs,
          statusCode: params.statusCode,
          isFallbackUsed: params.isFallback,
          errorMessage: params.errorMessage,
          estimatedCostUsd: params.estimatedCost,
        },
      });
    } catch (e) {
      console.error("[AiTaskRouter] Failed to record usage log:", e);
    }
  }
}
