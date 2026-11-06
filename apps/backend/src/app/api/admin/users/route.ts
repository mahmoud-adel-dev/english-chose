import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, successResponse, errorResponse } from "../../_helpers";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) {
      return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    }

    const [users, freeTier] = await Promise.all([
      prisma.user.findMany({
        include: {
          profile: true,
          quotaTier: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quotaTier.findUnique({ where: { name: "FREE" } }),
    ]);

    return successResponse(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        quotaTierId: u.quotaTierId ?? freeTier?.id ?? null,
        quotaTier: u.quotaTier ?? freeTier,
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
