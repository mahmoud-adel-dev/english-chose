import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { AiTaskRouter } from "@/lib/ai/task-router";

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const contentType = request.headers.get("content-type") || "";

    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return errorResponse("VALIDATION_ERROR", "No audio file provided in 'audio' field", 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || "audio/webm";
    } else {
      const body = await request.json().catch(() => ({}));
      const base64Data = body.audioBase64;
      if (!base64Data) {
        return errorResponse("VALIDATION_ERROR", "Missing audioBase64 or multipart audio file", 400);
      }
      audioBuffer = Buffer.from(base64Data, "base64");
      mimeType = body.mimeType || "audio/webm";
    }

    if (audioBuffer.length === 0) {
      return errorResponse("VALIDATION_ERROR", "Audio payload is empty", 400);
    }

    const result = await AiTaskRouter.executeAudioTranscription(
      {
        audioBuffer,
        mimeType,
        language: "en",
      },
      { userId: auth.userId }
    );

    return successResponse(
      {
        transcript: result.transcript,
        confidence: result.confidence ?? 0.95,
        durationSec: result.durationSec,
      },
      200
    );
  } catch (error) {
    console.error("Audio transcription error:", error);
    return errorResponse("SERVER_ERROR", "Failed to transcribe audio", 500);
  }
}

