import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const users = await prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        profile: u.profile
          ? {
              currentLevel: u.profile.currentLevel,
              targetLevel: u.profile.targetLevel,
              overallScore: u.profile.overallScore,
              dailyStreak: u.profile.dailyStreak,
              lastTrainedDate: u.profile.lastTrainedDate?.toISOString() || null,
            }
          : null,
      })),
      200
    );
  } catch (error) {
    console.error("Admin users GET error:", error);
    return errorResponse("SERVER_ERROR", "Failed to retrieve users", 500);
  }
}

