import { PrismaClient, UserRole, CefrLevel, AiTaskType, ProviderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting English Coach database seed...");

  // 1. Quota Tiers
  const freeTier = await prisma.quotaTier.upsert({
    where: { name: "FREE" },
    update: {},
    create: {
      name: "FREE",
      maxDailyQuestions: 15,
      maxDailySessions: 2,
      maxAudioMinutesDay: 10.0,
      maxAttemptsPerItem: 3,
      requestsPerMinute: 20
    }
  });

  const premiumTier = await prisma.quotaTier.upsert({
    where: { name: "PREMIUM" },
    update: {},
    create: {
      name: "PREMIUM",
      maxDailyQuestions: 100,
      maxDailySessions: 10,
      maxAudioMinutesDay: 60.0,
      maxAttemptsPerItem: 5,
      requestsPerMinute: 60
    }
  });

  console.log("✅ Quota tiers seeded (FREE, PREMIUM).");

  // 2. AI Providers
  const mockProvider = await prisma.aiProvider.upsert({
    where: { identifier: "mock-provider" },
    update: { status: ProviderStatus.ACTIVE },
    create: {
      identifier: "mock-provider",
      name: "Deterministic Mock Provider (Testing)",
      apiKeySecretKey: "MOCK_KEY",
      status: ProviderStatus.ACTIVE,
      priorityOrder: 999,
      maxRpm: 1000
    }
  });

  const geminiProvider = await prisma.aiProvider.upsert({
    where: { identifier: "google-gemini" },
    update: { status: ProviderStatus.ACTIVE },
    create: {
      identifier: "google-gemini",
      name: "Google Gemini",
      apiKeySecretKey: "GEMINI_API_KEY",
      status: ProviderStatus.ACTIVE,
      priorityOrder: 1,
      maxRpm: 60
    }
  });

  console.log("✅ AI Providers seeded.");

  // 3. AI Models
  const mockModel = await prisma.aiModel.upsert({
    where: {
      providerId_modelIdentifier: {
        providerId: mockProvider.id,
        modelIdentifier: "mock-model-v1"
      }
    },
    update: { isActive: true },
    create: {
      providerId: mockProvider.id,
      modelIdentifier: "mock-model-v1",
      displayName: "Mock Evaluator & Generator",
      contextWindow: 32000,
      supportsJsonMode: true,
      costPerInput1k: 0.0,
      costPerOutput1k: 0.0,
      isActive: true
    }
  });

  const geminiFlashModel = await prisma.aiModel.upsert({
    where: {
      providerId_modelIdentifier: {
        providerId: geminiProvider.id,
        modelIdentifier: "gemini-2.0-flash"
      }
    },
    update: { isActive: true },
    create: {
      providerId: geminiProvider.id,
      modelIdentifier: "gemini-2.0-flash",
      displayName: "Gemini 2.0 Flash (Fast & Low Cost)",
      contextWindow: 1048576,
      supportsVision: true,
      supportsAudioIn: true,
      supportsJsonMode: true,
      costPerInput1k: 0.0001,
      costPerOutput1k: 0.0004,
      isActive: true
    }
  });

  console.log("✅ AI Models seeded.");

  // 4. Default AI Task Routings
  const tasksToRoute: Array<{ task: AiTaskType; prompt: string; temp: number }> = [
    {
      task: AiTaskType.QUESTION_GENERATION,
      prompt: "You are an expert Cambridge CEFR English examiner. Generate targeted spoken English practice exercises.",
      temp: 0.7
    },
    {
      task: AiTaskType.ANSWER_EVALUATION,
      prompt: "You are an empathetic, precise English language evaluator. Evaluate meaning accuracy, grammar, vocabulary, and provide actionable feedback.",
      temp: 0.2
    },
    {
      task: AiTaskType.CEFR_ASSESSMENT,
      prompt: "Evaluate the learner's spoken response strictly against CEFR A1-C2 descriptors.",
      temp: 0.2
    },
    {
      task: AiTaskType.EDUCATIONAL_EXPLANATION,
      prompt: "Explain grammar and vocabulary mistakes simply and clearly for an English learner.",
      temp: 0.3
    },
    {
      task: AiTaskType.PROGRESS_SUMMARY,
      prompt: "Synthesize learner progress and recurring error patterns into an encouraging summary.",
      temp: 0.4
    },
    {
      task: AiTaskType.SPEECH_TO_TEXT,
      prompt: "Transcribe spoken learner audio accurately, preserving hesitation markers.",
      temp: 0.0
    }
  ];

  for (const item of tasksToRoute) {
    await prisma.aiTaskRouting.upsert({
      where: { taskType: item.task },
      update: {
        primaryModelId: geminiFlashModel.id,
        fallbackModelId: mockModel.id
      },
      create: {
        taskType: item.task,
        primaryModelId: geminiFlashModel.id,
        fallbackModelId: mockModel.id,
        systemPromptTpl: item.prompt,
        temperature: item.temp,
        maxTokens: 2048,
        timeoutMs: 15000,
        maxRetries: 2
      }
    });
  }

  console.log("✅ AI Task Routing seeded with Primary (Gemini) and Fallback (Mock).");

  // 5. Seed Initial Admin & Demo User
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@englishcoach.app" },
    update: {},
    create: {
      email: "admin@englishcoach.app",
      name: "System Administrator",
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
      profile: {
        create: {
          currentLevel: CefrLevel.C2,
          targetLevel: CefrLevel.C2,
          overallScore: 100.0
        }
      }
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student@englishcoach.app" },
    update: {},
    create: {
      email: "student@englishcoach.app",
      name: "Demo Student",
      passwordHash: defaultPasswordHash,
      role: UserRole.STUDENT,
      profile: {
        create: {
          currentLevel: CefrLevel.B1,
          targetLevel: CefrLevel.B2,
          overallScore: 68.5,
          grammarScore: 70.0,
          vocabularyScore: 65.0,
          fluencyScore: 72.0,
          dailyStreak: 3,
          recurringWeaknesses: ["past-tense-irregular", "prepositions-in-on-at"]
        }
      }
    }
  });

  console.log("✅ Users seeded: admin@englishcoach.app & student@englishcoach.app (Password: Password123!)");
  console.log("🎉 Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
