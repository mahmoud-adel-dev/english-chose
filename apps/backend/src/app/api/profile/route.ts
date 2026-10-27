import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../_helpers";
import { LearningProfileDto, CefrLevelEnum } from "@english-coach/contracts";

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const profile = await prisma.learningProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return errorResponse("NOT_FOUND", "Learning profile not found", 404);
    }

    const profileDto: LearningProfileDto = {
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
    };

    return successResponse(profileDto, 200);
  } catch (error) {
    console.error("Profile GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve profile", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const body = await request.json();
    const targetLevelParsed = body.targetLevel ? CefrLevelEnum.safeParse(body.targetLevel) : null;

    const updated = await prisma.learningProfile.update({
      where: { userId: auth.userId },
      data: {
        ...(targetLevelParsed?.success ? { targetLevel: targetLevelParsed.data } : {}),
      },
    });

    const profileDto: LearningProfileDto = {
      userId: updated.userId,
      currentLevel: updated.currentLevel,
      targetLevel: updated.targetLevel,
      overallScore: updated.overallScore,
      grammarScore: updated.grammarScore,
      vocabularyScore: updated.vocabularyScore,
      fluencyScore: updated.fluencyScore,
      pronunciationScore: updated.pronunciationScore,
      dailyStreak: updated.dailyStreak,
      lastTrainedDate: updated.lastTrainedDate ? updated.lastTrainedDate.toISOString() : null,
      recurringWeaknesses: (updated.recurringWeaknesses as string[]) || [],
    };

    return successResponse(profileDto, 200);
  } catch (error) {
    console.error("Profile PUT error:", error);
    return errorResponse("SERVER_ERROR", "Failed to update profile", 500);
  }
}

