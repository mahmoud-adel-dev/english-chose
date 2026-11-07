import { authenticateRequest, successResponse, errorResponse } from "../../_helpers";
import { AiTaskRouter } from "@/lib/ai/task-router";

const DEFAULT_MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
]);

function getMaxAudioSize(): number {
  const configured = Number(process.env.MAX_AUDIO_SIZE_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.min(configured, 25 * 1024 * 1024)
    : DEFAULT_MAX_AUDIO_SIZE_BYTES;
}

function isAllowedAudioType(value: string): boolean {
  return ALLOWED_AUDIO_TYPES.has(value.split(";")[0].trim().toLowerCase());
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Missing or invalid authorization token", 401);
    }

    const maxAudioSize = getMaxAudioSize();
    const contentLength = Number(request.headers.get("content-length"));
    // Base64 adds roughly 33% overhead; multipart adds a small boundary/header
    // overhead. Reject oversized declared bodies before buffering them.
    if (Number.isFinite(contentLength) && contentLength > maxAudioSize * 1.5 + 1024 * 1024) {
      return errorResponse("AUDIO_TOO_LARGE", "Audio request exceeds the configured size limit.", 413);
    }

    const contentType = request.headers.get("content-type") || "";
    let audioBuffer: Buffer;
    let mimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const formValue = formData.get("audio");
      if (!(formValue instanceof File)) {
        return errorResponse("VALIDATION_ERROR", "No audio file provided in 'audio' field", 400);
      }
      if (formValue.size <= 0) {
        return errorResponse("VALIDATION_ERROR", "Audio payload is empty", 400);
      }
      if (formValue.size > maxAudioSize) {
        return errorResponse("AUDIO_TOO_LARGE", `Audio must be smaller than ${Math.floor(maxAudioSize / 1024 / 1024)} MB.`, 413);
      }
      mimeType = formValue.type || "audio/webm";
      if (!isAllowedAudioType(mimeType)) {
        return errorResponse("UNSUPPORTED_AUDIO_TYPE", "The supplied audio format is not supported.", 415);
      }
      audioBuffer = Buffer.from(await formValue.arrayBuffer());
    } else if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      const base64Data = typeof body?.audioBase64 === "string" ? body.audioBase64 : "";
      mimeType = typeof body?.mimeType === "string" ? body.mimeType : "audio/webm";
      if (!base64Data) {
        return errorResponse("VALIDATION_ERROR", "Missing audioBase64 or multipart audio file", 400);
      }
      if (!isAllowedAudioType(mimeType)) {
        return errorResponse("UNSUPPORTED_AUDIO_TYPE", "The supplied audio format is not supported.", 415);
      }
      // Reject malformed base64 rather than allowing Buffer.from to silently
      // discard invalid characters and process a different payload.
      const normalizedBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalizedBase64)) {
        return errorResponse("VALIDATION_ERROR", "Audio data is not valid base64.", 400);
      }
      const estimatedSize = Math.floor((normalizedBase64.length * 3) / 4);
      if (estimatedSize <= 0) {
        return errorResponse("VALIDATION_ERROR", "Audio payload is empty", 400);
      }
      if (estimatedSize > maxAudioSize) {
        return errorResponse("AUDIO_TOO_LARGE", `Audio must be smaller than ${Math.floor(maxAudioSize / 1024 / 1024)} MB.`, 413);
      }
      audioBuffer = Buffer.from(normalizedBase64, "base64");
    } else {
      return errorResponse("UNSUPPORTED_CONTENT_TYPE", "Use multipart/form-data or application/json with audioBase64.", 415);
    }

    if (audioBuffer.length === 0) {
      return errorResponse("VALIDATION_ERROR", "Audio payload is empty", 400);
    }
    if (audioBuffer.length > maxAudioSize) {
      return errorResponse("AUDIO_TOO_LARGE", "Audio payload exceeds the configured size limit.", 413);
    }

    try {
      const result = await AiTaskRouter.executeAudioTranscription(
        { audioBuffer, mimeType, language: "en" },
        { userId: auth.userId }
      );

      return successResponse({
        transcript: result.transcript,
        ...(typeof result.confidence === "number" && Number.isFinite(result.confidence)
          ? { confidence: result.confidence }
          : {}),
        ...(typeof result.durationSec === "number" && result.durationSec > 0
          ? { durationSec: result.durationSec }
          : {}),
      }, 200);
    } catch (providerError) {
      console.warn("Speech transcription provider unavailable:", providerError);
      return errorResponse(
        "TRANSCRIPTION_UNAVAILABLE",
        "Speech recognition is temporarily unavailable. Your audio was not converted into a guessed transcript. Please try again.",
        503
      );
    }
  } catch (error) {
    console.error("Audio transcription request error:", error);
    return errorResponse("SERVER_ERROR", "Failed to process the audio request", 500);
  }
}
