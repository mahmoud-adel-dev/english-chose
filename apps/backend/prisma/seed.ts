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
  // Keep the mock fixture inactive in production. Runtime routing also has an
  // independent production guard, so a database misconfiguration cannot turn
  // deterministic sample output into learner results.
  const mockProviderStatus = process.env.NODE_ENV === "production"
    ? ProviderStatus.INACTIVE
    : ProviderStatus.ACTIVE;
  const mockProvider = await prisma.aiProvider.upsert({
    where: { identifier: "mock-provider" },
    update: { status: mockProviderStatus },
    create: {
      identifier: "mock-provider",
      name: "Deterministic Mock Provider (Development/Test Only)",
      apiKeySecretKey: "MOCK_KEY",
      status: mockProviderStatus,
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
    update: { isActive: process.env.NODE_ENV !== "production" },
    create: {
      providerId: mockProvider.id,
      modelIdentifier: "mock-model-v1",
      displayName: "Mock Generator (Development/Test Only)",
      contextWindow: 32000,
      supportsJsonMode: true,
      costPerInput1k: 0.0,
      costPerOutput1k: 0.0,
      isActive: process.env.NODE_ENV !== "production"
    }
  });

  const geminiFlashModel = await prisma.aiModel.upsert({
    where: {
      providerId_modelIdentifier: {
        providerId: geminiProvider.id,
        modelIdentifier: "gemini-2.5-flash"
      }
    },
    update: { isActive: true },
    create: {
      providerId: geminiProvider.id,
      modelIdentifier: "gemini-2.5-flash",
      displayName: "Gemini 2.5 Flash",
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
        fallbackModelId: null
      },
      create: {
        taskType: item.task,
        primaryModelId: geminiFlashModel.id,
        fallbackModelId: null,
        systemPromptTpl: item.prompt,
        temperature: item.temp,
        maxTokens: 2048,
        timeoutMs: 15000,
        maxRetries: 2
      }
    });
  }

  console.log("✅ AI Task Routing seeded with Gemini primary models and no mock fallbacks.");

  // 5. Optional administrator bootstrap. Never create public, predictable
  // credentials such as admin@... / Password123! from a production seed.
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" && (!adminEmail || !adminPassword)) {
    throw new Error("Production seeding requires SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD so no predictable administrator account is left in service.");
  }

  if (adminEmail || adminPassword) {
    if (!adminEmail || !adminPassword || adminPassword.length < 16) {
      throw new Error("Set both SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 16 characters to bootstrap the administrator.");
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      create: {
        email: adminEmail,
        name: "System Administrator",
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        profile: {
          create: {
            currentLevel: CefrLevel.C2,
            targetLevel: CefrLevel.C2,
          }
        }
      }
    });
    if (process.env.NODE_ENV === "production") {
      // Disable the known legacy demo identities unless the administrator
      // explicitly chose the legacy admin email and rotated its password above.
      if (adminEmail !== "admin@englishcoach.app") {
        await prisma.user.updateMany({
          where: { email: "admin@englishcoach.app" },
          data: { isActive: false },
        });
      }
      await prisma.user.updateMany({
        where: { email: "student@englishcoach.app" },
        data: { isActive: false },
      });
    }
    console.log(`✅ Administrator account bootstrapped for ${adminEmail}.`);
  } else {
    console.warn("⚠️ No administrator bootstrap credentials supplied. Existing administrator accounts were left unchanged.");
  }

  // Optional demo account creation is local-only and requires explicit secrets.
  if (process.env.NODE_ENV !== "production" && process.env.SEED_DEMO_USERS === "true") {
    const demoEmail = process.env.SEED_DEMO_USER_EMAIL?.trim().toLowerCase();
    const demoPassword = process.env.SEED_DEMO_USER_PASSWORD;
    if (!demoEmail || !demoPassword || demoPassword.length < 12) {
      throw new Error("SEED_DEMO_USERS requires SEED_DEMO_USER_EMAIL and SEED_DEMO_USER_PASSWORD (at least 12 characters).");
    }
    const demoHash = await bcrypt.hash(demoPassword, 12);
    await prisma.user.upsert({
      where: { email: demoEmail },
      update: {},
      create: {
        email: demoEmail,
        name: "Demo Student",
        passwordHash: demoHash,
        role: UserRole.STUDENT,
        profile: {
          create: {
            currentLevel: CefrLevel.B1,
            targetLevel: CefrLevel.B2,
          }
        }
      }
    });
    console.log(`✅ Optional demo learner created for ${demoEmail}.`);
  }

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
