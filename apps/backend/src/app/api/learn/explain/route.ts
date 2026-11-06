import { AiTaskType } from "@prisma/client";
import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";
import { AiTaskRouter } from "@/lib/ai/task-router";
import { CefrLevelEnum } from "@english-coach/contracts";

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth) {
    return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  }

  try {
    const body = await request.json();
    const topic = String(body.topic || "English Grammar Rule");
    const userQuery = String(body.query || "Explain this rule with simple examples and Arabic translation.");
    const level = body.level ? CefrLevelEnum.parse(body.level) : "B1";

    const systemPrompt = "You are an expert, empathetic English language coach. Explain grammar clearly and concisely with simple examples, Arabic explanations, and common pitfalls to avoid.";
    const userPrompt = `CEFR Target Level: ${level}
Topic / Rule: ${topic}
Student Question / Focus: ${userQuery}

Provide a crystal-clear, structured explanation tailored specifically for ${level} students.
Format your answer with:
1. 💡 **Rule Summary & Formula**
2. 📖 **Practical Examples** (English sentence + Arabic translation)
3. ⚠️ **Common Mistakes to Avoid**
4. 🌟 **Quick Practice Tip**

Keep your tone engaging, precise, and supportive.`;

    const result = await AiTaskRouter.executeCompletion(
      AiTaskType.EDUCATIONAL_EXPLANATION,
      { systemPrompt, userPrompt },
      { userId: auth.userId }
    );

    const content = result.content.trim();
    if (!content) {
      return errorResponse("INVALID_AI_RESPONSE", "Empty explanation returned", 503);
    }

    return successResponse({
      topic,
      level,
      explanation: content,
      model: result.modelIdentifier
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate explanation";
    return errorResponse("EXPLANATION_FAILED", message, 500);
  }
}
