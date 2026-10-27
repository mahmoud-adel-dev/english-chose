import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { RegisterRequestSchema, AuthResponseData } from "@english-coach/contracts";
import { successResponse, errorResponse } from "../../_helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid registration data", 400, parsed.error.format());
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse("USER_EXISTS", "A user with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "STUDENT",
        },
      });

      const profile = await tx.learningProfile.create({
        data: {
          userId: user.id,
          currentLevel: "A1",
          targetLevel: "B2",
          overallScore: 0.0,
          grammarScore: 0.0,
          vocabularyScore: 0.0,
          fluencyScore: 0.0,
          pronunciationScore: 0.0,
          dailyStreak: 0,
          recurringWeaknesses: [],
        },
      });

      return { user, profile };
    });

    const token = await signToken({
      userId: newUser.user.id,
      email: newUser.user.email,
      role: newUser.user.role,
    });

    const authData: AuthResponseData = {
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        name: newUser.user.name,
        role: newUser.user.role,
        createdAt: newUser.user.createdAt.toISOString(),
      },
      profile: {
        userId: newUser.profile.userId,
        currentLevel: newUser.profile.currentLevel,
        targetLevel: newUser.profile.targetLevel,
        overallScore: newUser.profile.overallScore,
        grammarScore: newUser.profile.grammarScore,
        vocabularyScore: newUser.profile.vocabularyScore,
        fluencyScore: newUser.profile.fluencyScore,
        pronunciationScore: newUser.profile.pronunciationScore,
        dailyStreak: newUser.profile.dailyStreak,
        lastTrainedDate: newUser.profile.lastTrainedDate ? newUser.profile.lastTrainedDate.toISOString() : null,
        recurringWeaknesses: (newUser.profile.recurringWeaknesses as string[]) || [],
      },
      token,
    };

    return successResponse(authData, 201);
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("SERVER_ERROR", "An unexpected error occurred during registration", 500);
  }
}

