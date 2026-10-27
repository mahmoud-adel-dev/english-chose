import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { AuthResponseData } from "@english-coach/contracts";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      return errorResponse("NOT_FOUND", "User not found or inactive", 404);
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

    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

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
    console.error("Auth me error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve current user", 500);
  }
}

