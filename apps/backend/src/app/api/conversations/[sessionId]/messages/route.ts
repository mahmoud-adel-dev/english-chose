import { prisma } from "@/lib/prisma";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { AiTaskType } from "@prisma/client";
import { authenticateRequest, successResponse, errorResponse } from "../../../_helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const { sessionId } = await params;
    const session = await prisma.conversationSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session || session.userId !== auth.userId) {
      return errorResponse("NOT_FOUND", "Conversation session not found", 404);
    }

    if (session.status !== "ACTIVE") {
      return errorResponse("SESSION_CLOSED", "This conversation session has already ended", 400);
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl : null;

    if (!content) {
      return errorResponse("VALIDATION_ERROR", "Message content is required", 400);
    }

    // Save user message
    const userMessage = await prisma.conversationMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content,
        audioUrl,
      },
    });

    // Build conversation history for the AI model
    const recentMessages = session.messages.slice(-10).map((m) => `${m.role.toUpperCase()}: "${m.content}"`);
    recentMessages.push(`USER: "${content}"`);

    const systemPrompt = `You are Alex, a supportive and expert Cambridge English conversation coach having an active spoken dialogue with an Arabic-speaking student.
Learner's Target CEFR Level: ${session.targetLevel}
Topic: ${session.topic || "Self-Development & Daily Life"}

CONVERSATIONAL RULES:
1. Respond naturally and encouragingly in native conversational English suited for CEFR ${session.targetLevel}.
2. Keep your response concise (2-3 sentences), and always end with an open-ended question or thought to invite the student to speak more.
3. Check the student's latest message for grammar, vocabulary, or word order mistakes.
4. If there is a mistake, formulate an instant coaching tip in "correctionTip":
   "💡 Coach Tip: '[wrong phrase]' → Say '[correct phrase]' ([brief friendly Arabic explanation])"
   If the student's English has no mistakes, set "correctionTip" to null.
5. If the student speaks Arabic or nonsense letters, kindly remind them in English to speak or write in English.

Return ONLY a valid JSON object:
{
  "reply": "string (the natural English conversational reply)",
  "correctionTip": "string or null",
  "detectedErrors": [
    {
      "wrongSnippet": "string",
      "correctSnippet": "string",
      "explanation": "string (in Arabic)"
    }
  ]
}`;

    const userPrompt = `Conversation History:
${recentMessages.join("\n")}

Respond to the student's latest message now according to your instructions.`;

    let assistantReply = "That's great! Tell me more about that.";
    let correctionTip: string | null = null;

    try {
      const aiResponse = await AiTaskRouter.executeCompletion(
        AiTaskType.CONVERSATION_CHAT,
        {
          systemPrompt,
          userPrompt,
          temperature: 0.7,
          maxTokens: 1024,
          jsonSchema: { type: "object" },
        },
        { userId: auth.userId }
      );

      if (aiResponse.parsedJson && typeof aiResponse.parsedJson === "object") {
        const parsed = aiResponse.parsedJson as any;
        assistantReply = parsed.reply || assistantReply;
        correctionTip = parsed.correctionTip || null;
      } else {
        const text = aiResponse.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          assistantReply = parsed.reply || assistantReply;
          correctionTip = parsed.correctionTip || null;
        } else {
          assistantReply = text;
        }
      }
    } catch (aiErr) {
      console.warn("[ConversationChat] AI completion fallback:", aiErr);
      assistantReply = "That's very interesting! Can you give me an example or tell me more about how you feel about that?";
    }

    // Save assistant message with any correction tip attached to the user turn
    const assistantMessage = await prisma.conversationMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: assistantReply,
        correctionTip,
      },
    });

    return successResponse(
      {
        userMessage,
        assistantMessage,
        correctionTip,
      },
      201
    );
  } catch (error) {
    console.error("Failed to post conversation message:", error);
    return errorResponse("SERVER_ERROR", "Failed to process message", 500);
  }
}

