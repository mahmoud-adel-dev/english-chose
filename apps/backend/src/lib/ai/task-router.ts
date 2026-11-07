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

  private static async getConfiguredAdapter(
    provider: {
      identifier: string;
      baseUrl: string | null;
      credentialSource: string;
      inferenceCredential: unknown;
      managementCredential: unknown;
      apiKeySecretKey: string;
    },
    taskType: AiTaskType
  ): Promise<IAiProviderAdapter | undefined> {
    // The deterministic adapter is a development/test fixture, never a production provider.
    if (provider.identifier === "mock-provider" && !isMockAdapterEnabled(taskType)) {
      return undefined;
    }

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
      try {
        const adapter = await this.getConfiguredAdapter(primary.provider, taskType);
        if (adapter) {
          const res = requireAllowedResult(taskType, await this.executeWithTimeout(
            () => adapter.generateCompletion(primary.modelIdentifier, mergedReq),
            timeoutMs
          ));

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
        }
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

    // 3. Attempt with Fallback Model
    const fallback = routing?.fallbackModel;
    if (
      fallback &&
      fallback.isActive &&
      fallback.isAvailable &&
      fallback.provider.status === ProviderStatus.ACTIVE &&
      this.isCredentialUsable(fallback.provider.credentialHealth)
    ) {
      try {
        const fallbackAdapter = await this.getConfiguredAdapter(fallback.provider, taskType);
        if (fallbackAdapter) {
          const res = requireAllowedResult(taskType, await this.executeWithTimeout(
            () => fallbackAdapter.generateCompletion(fallback.modelIdentifier, mergedReq),
            timeoutMs
          ));

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
        }
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

    // 4. Built-in Server Environment Gemini Fallback
    const envGeminiKey = process.env.GEMINI_API_KEY;
    if (envGeminiKey) {
      const workingModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
      const geminiAdapter = new GeminiAiProviderAdapter(envGeminiKey);
      for (const modelId of workingModels) {
        try {
          const res = requireAllowedResult(taskType, await this.executeWithTimeout(
            () => geminiAdapter.generateCompletion(modelId, mergedReq),
            timeoutMs
          ));
          return res;
        } catch (geminiErr) {
          console.warn(`[AiTaskRouter] Server environment Gemini fallback (${modelId}) encountered error:`, geminiErr);
        }
      }
    }

    // 5. Deterministic mock output is permitted only for explicitly non-evaluative
    // development/test flows. It must never create learner scores or placement results.
    if (isMockAdapterEnabled(taskType)) {
      console.warn(`[AiTaskRouter] Using development/test mock adapter for ${taskType}`);
      const mockAdapter = this.getAdapter("mock-provider") || new MockAiProviderAdapter();
      return await mockAdapter.generateCompletion("mock-default", mergedReq);
    }

    throw new Error(`No trustworthy AI provider is available for ${taskType}. Configure an active primary or fallback provider.`);
  }

  /**
   * Dispatches speech-to-text audio transcription.
   */
  static async executeAudioTranscription(
    req: SttTranscriptionRequest,
    context?: { userId?: string }
  ): Promise<SttTranscriptionResponse> {
    let routing: any = null;
    try {
      routing = await prisma.aiTaskRouting.findUnique({
        where: { taskType: AiTaskType.SPEECH_TO_TEXT },
        include: {
          primaryModel: { include: { provider: true } },
          fallbackModel: { include: { provider: true } },
        },
      });
    } catch (error) {
      console.warn("[AiTaskRouter] Could not fetch speech-to-text routing:", error);
    }

    const candidates = [routing?.primaryModel, routing?.fallbackModel].filter(Boolean);
    for (const model of candidates) {
      if (
        !model.isActive ||
        !model.isAvailable ||
        model.provider.status !== ProviderStatus.ACTIVE ||
        !this.isCredentialUsable(model.provider.credentialHealth)
      ) {
        continue;
      }

      try {
        const adapter = await this.getConfiguredAdapter(model.provider, AiTaskType.SPEECH_TO_TEXT);
        if (!adapter) continue;
        const result = await this.executeWithTimeout(
          () => adapter.transcribeAudio(model.modelIdentifier, req),
          routing?.timeoutMs ?? 60_000
        );
        if (!result.transcript.trim()) {
          throw new Error("Speech provider returned an empty transcript.");
        }
        return result;
      } catch (error) {
        console.warn(
          `[AiTaskRouter] Speech model ${model.modelIdentifier} failed:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Environment-level Gemini fallback is a real provider, not a mock transcript.
    const envGeminiKey = process.env.GEMINI_API_KEY;
    if (envGeminiKey) {
      try {
        const geminiAdapter = new GeminiAiProviderAdapter(envGeminiKey);
        const result = await geminiAdapter.transcribeAudio("gemini-2.5-flash", req);
        if (!result.transcript.trim()) {
          throw new Error("Speech provider returned an empty transcript.");
        }
        return result;
      } catch (error) {
        console.warn("[AiTaskRouter] Gemini speech fallback failed:", error);
      }
    }

    throw new Error("No real speech-to-text provider is available. Configure an active speech provider and try again.");
  }

  private static async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    const safeTimeoutMs = Number.isFinite(timeoutMs)
      ? Math.max(1_000, Math.min(timeoutMs, 120_000))
      : 30_000;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`AI request timed out after ${safeTimeoutMs}ms`)),
        safeTimeoutMs
      );

      Promise.resolve().then(fn).then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
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
export function allowsMockFallback(taskType: AiTaskType): boolean {
  const realEvaluationTasks: AiTaskType[] = [
    AiTaskType.ANSWER_EVALUATION,
    AiTaskType.CEFR_ASSESSMENT,
    AiTaskType.PRONUNCIATION_ASSESSMENT,
  ];
  return !realEvaluationTasks.includes(taskType);
}

/**
 * Mock completions are test fixtures, or an explicitly opted-in local-development
 * convenience. They are never enabled in production and never used for speech
 * transcription or any task that produces a learner evaluation.
 */
export function isMockAdapterEnabled(
  taskType: AiTaskType,
  environment = process.env.NODE_ENV,
  explicitOptIn = process.env.ALLOW_MOCK_AI
): boolean {
  if (!allowsMockFallback(taskType) || taskType === AiTaskType.SPEECH_TO_TEXT) {
    return false;
  }
  if (environment === "test") return true;
  return environment !== "production" && explicitOptIn === "true";
}

function requireAllowedResult(taskType: AiTaskType, result: AiCompletionResponse) {
  if (result.modelIdentifier.toLowerCase().startsWith("mock-") && !isMockAdapterEnabled(taskType)) {
    throw new Error(`A real AI provider is required for ${taskType}; mock results are disabled in this environment.`);
  }
  return result;
}
