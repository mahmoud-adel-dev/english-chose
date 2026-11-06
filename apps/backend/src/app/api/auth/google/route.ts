import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { decideGoogleAccountAction, verifyGoogleIdentity } from "@/lib/auth/google-auth";
import { errorResponse, successResponse } from "../../_helpers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = typeof body.idToken === "string" ? body.idToken : "";
    const config = await prisma.googleAuthConfig.findUnique({ where: { id: "google" } });
    if (!config?.enabled || !config.webClientId) {
      return errorResponse("GOOGLE_AUTH_DISABLED", "Google sign-in is not configured", 503);
    }

    const identity = await verifyGoogleIdentity(idToken, config.webClientId);
    const user = await prisma.$transaction(async (tx) => {
      const [bySubject, byEmail] = await Promise.all([
        tx.user.findUnique({ where: { googleSubject: identity.subject } }),
        tx.user.findUnique({ where: { email: identity.email } }),
      ]);
      const action = decideGoogleAccountAction(
        bySubject,
        byEmail,
        identity.canLinkExistingEmail
      );
      if (action.type === "USE") {
        return tx.user.findUniqueOrThrow({ where: { id: action.userId }, include: { profile: true } });
      }
      if (action.type === "LINK") {
        return tx.user.update({
          where: { id: action.userId },
          data: { googleSubject: identity.subject, authProvider: "PASSWORD_GOOGLE" },
          include: { profile: true },
        });
      }
      const passwordHash = await hashPassword(randomBytes(32).toString("hex"));
      return tx.user.create({
        data: {
          email: identity.email,
          name: identity.name,
          passwordHash,
          googleSubject: identity.subject,
          authProvider: "GOOGLE",
          role: "STUDENT",
          profile: { create: { currentLevel: "A1", targetLevel: "B2" } },
        },
        include: { profile: true },
      });
    });

    const profile = user.profile ?? await prisma.learningProfile.create({
      data: { userId: user.id, currentLevel: "A1", targetLevel: "B2" },
    });
    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    return successResponse({
      token,
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
        lastTrainedDate: profile.lastTrainedDate?.toISOString() ?? null,
        recurringWeaknesses: (profile.recurringWeaknesses as string[]) || [],
      },
    }, 200);
  } catch (error) {
    console.error("Google login error:", error);
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    return errorResponse("INVALID_GOOGLE_IDENTITY", message, 401);
  }
}
