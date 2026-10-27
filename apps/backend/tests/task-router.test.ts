import { describe, it, expect, beforeAll } from "vitest";
import { AiTaskRouter } from "../src/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { IAiProviderAdapter, AiCompletionRequest, AiCompletionResponse } from "../src/lib/ai/types";

describe("AI Task Routing & Fallback Mechanism", () => {
  beforeAll(async () => {
    // Ensure routing rule exists for ANSWER_EVALUATION
    const mockModel = await prisma.aiModel.findFirst({
      where: { modelIdentifier: "mock-model-v1" },
    });

    if (mockModel) {
      await prisma.aiTaskRouting.upsert({
        where: { taskType: AiTaskType.ANSWER_EVALUATION },
        update: {
          primaryModelId: mockModel.id,
        },
        create: {
          taskType: AiTaskType.ANSWER_EVALUATION,
          primaryModelId: mockModel.id,
          systemPromptTpl: "You are an English evaluator.",
          temperature: 0.2,
          maxTokens: 1024,
        },
      });
    }
  });

  it("executes completion successfully using the configured model", async () => {
    const res = await AiTaskRouter.executeCompletion(
      AiTaskType.ANSWER_EVALUATION,
      {
        systemPrompt: "Evaluate the answer.",
        userPrompt: "I go to store yesterday.",
        jsonSchema: { type: "object" },
      }
    );

    expect(res).toBeDefined();
    expect(res.parsedJson).toBeDefined();
    expect((res.parsedJson as any).isMeaningAccurate).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);
  });

  it("automatically falls back to secondary model when primary fails", async () => {
    // Register a failing mock adapter for test-failing-provider
    class FailingAdapter implements IAiProviderAdapter {
      readonly providerId = "failing-provider";
      async generateCompletion(): Promise<AiCompletionResponse> {
        throw new Error("Simulated primary provider 503 Outage");
      }
      async transcribeAudio(): Promise<any> {
        throw new Error("Simulated STT 503");
      }
      async testConnection(): Promise<any> {
        return { ok: false, latencyMs: 0 };
      }
    }

    AiTaskRouter.registerAdapter("failing-provider", new FailingAdapter());

    // Create a temporary failing provider and model in DB
    const failingProvider = await prisma.aiProvider.upsert({
      where: { identifier: "failing-provider" },
      update: {},
      create: {
        identifier: "failing-provider",
        name: "Failing Test Provider",
        apiKeySecretKey: "NONE",
      },
    });

    const failingModel = await prisma.aiModel.upsert({
      where: {
        providerId_modelIdentifier: {
          providerId: failingProvider.id,
          modelIdentifier: "failing-model",
        },
      },
      update: {},
      create: {
        providerId: failingProvider.id,
        modelIdentifier: "failing-model",
        displayName: "Failing Model",
      },
    });

    const fallbackModel = await prisma.aiModel.findFirst({
      where: { modelIdentifier: "mock-model-v1" },
    });

    // Configure QUESTION_GENERATION with failing primary and working fallback
    await prisma.aiTaskRouting.update({
      where: { taskType: AiTaskType.QUESTION_GENERATION },
      data: {
        primaryModelId: failingModel.id,
        fallbackModelId: fallbackModel!.id,
      },
    });

    // Execute task: should automatically recover via fallback
    const result = await AiTaskRouter.executeCompletion(
      AiTaskType.QUESTION_GENERATION,
      {
        systemPrompt: "Generate a question",
        userPrompt: "Topic: Travel",
      }
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();

    // Verify usage log recorded fallback usage
    const log = await prisma.aiUsageLog.findFirst({
      where: {
        taskId: AiTaskType.QUESTION_GENERATION,
        isFallbackUsed: true,
      },
      orderBy: { createdAt: "desc" },
    });

    expect(log).not.toBeNull();
    expect(log?.statusCode).toBe(200);
  });
});
