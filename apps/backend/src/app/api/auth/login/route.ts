import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { LoginRequestSchema, AuthResponseData } from "@english-coach/contracts";
import { successResponse, errorResponse } from "../../_helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid login data", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    let profile = user.profile;
    if (!profile) {
      profile = await prisma.learningProfile.create({
        data: {
          userId: user.id,
          currentLevel: "A1",
          targetLevel: "B2",
        },
      });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const authData: AuthResponseData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      profile: {
        userId: profile.userId,
        currentLevel: profile.currentLevel,
        targetLevel: profile.targetLevel,
        overallScore: profile.overallScore,
        grammarScore: profile.grammarScore,
        vocabularyScore: profile.vocabularyScore,
        fluencyScore: profile.fluencyScore,
        pronunciationScore: profile.pronunciationScore,
        dailyStreak: profile.dailyStreak,
        lastTrainedDate: profile.lastTrainedDate ? profile.lastTrainedDate.toISOString() : null,
        recurringWeaknesses: (profile.recurringWeaknesses as string[]) || [],
      },
      token,
    };

    return successResponse(authData, 200);
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("SERVER_ERROR", "An unexpected error occurred during login", 500);
  }
}

