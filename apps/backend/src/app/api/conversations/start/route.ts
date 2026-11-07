import { prisma } from "@/lib/prisma";
import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { CefrLevel } from "@prisma/client";

function getOpeningGreeting(targetLevel: CefrLevel, topic?: string): string {
  if (topic) {
    return `Hello! I'm Alex, your English speaking partner. Today let's talk about "${topic}". To get us started, what are your initial thoughts or experiences with this?`;
  }

  switch (targetLevel) {
    case "A1":
      return "Hello! I'm Alex, your English Coach. I'm very happy to practice with you today! What is your name, and how are you feeling today?";
    case "A2":
      return "Hi there! I'm Alex, your conversation partner. It's great to chat with you! What did you do today, or what are your plans for this weekend?";
    case "B1":
      return "Hello! I'm Alex, your English speaking partner. Practicing real conversation is the fastest way to become fluent. What is something exciting or interesting that happened to you recently?";
    case "B2":
      return "Welcome! I'm Alex, your conversation coach. Let's dive into an engaging discussion. If you could travel anywhere in the world right now or master any new skill overnight, what would you choose and why?";
    case "C1":
    case "C2":
      return "Greetings! I'm Alex. Let's delve into an intellectually stimulating topic today—perhaps recent technological advancements, cultural shifts, or personal career ambitions. What topic would you like to explore?";
    default:
      return "Hi there! I'm Alex, your English conversation coach. What would you like to chat about today?";
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const body = await request.json().catch(() => ({}));
    const requestedLevel = (body.targetLevel as CefrLevel) || undefined;
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 200) : undefined;

    // Resolve user's target level from profile if not provided
    let targetLevel: CefrLevel = requestedLevel || CefrLevel.B1;
    if (!requestedLevel) {
      const profile = await prisma.learningProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (profile?.targetLevel) {
        targetLevel = profile.targetLevel;
      } else if (profile?.currentLevel) {
        targetLevel = profile.currentLevel;
      }
    }

    // Check for an existing active conversation session
    let session = await prisma.conversationSession.findFirst({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // If an active session exists and user didn't ask for a new topic/level, reuse it
    if (session && !topic && !requestedLevel) {
      return successResponse(session, 200);
    }

    // Otherwise, close any existing active sessions or create a new one
    if (session) {
      await prisma.conversationSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    const openingContent = getOpeningGreeting(targetLevel, topic);

    session = await prisma.conversationSession.create({
      data: {
        userId: auth.userId,
        targetLevel,
        status: "ACTIVE",
        topic: topic || "Everyday Self-Development & Conversational Practice",
        messages: {
          create: {
            role: "assistant",
            content: openingContent,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return successResponse(session, 201);
  } catch (error) {
    console.error("Failed to start conversation session:", error);
    return errorResponse("SERVER_ERROR", "Failed to start conversation session", 500);
  }
}

