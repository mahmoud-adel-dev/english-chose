import { Prisma } from "@prisma/client";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../../_helpers";
import { prisma } from "@/lib/prisma";
import {
  parseGoogleAuthConfiguration,
  sanitizeGoogleAuthConfiguration,
} from "@/lib/auth/google-auth";
import { encryptCredential } from "@/lib/ai/provider-credentials";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function GET(request: Request) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);
  const config = await prisma.googleAuthConfig.findUnique({ where: { id: "google" } });
  return successResponse(
    config
      ? sanitizeGoogleAuthConfiguration(config)
      : {
          enabled: false,
          webClientId: null,
          androidClientId: null,
          iosClientId: null,
          clientSecretConfigured: false,
          clientSecretLastFour: null,
          apiKeyConfigured: false,
          apiKeyLastFour: null,
        },
    200
  );
}

export async function PUT(request: Request) {
  try {
    const admin = await authenticateAdminRequest(request);
    if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);
    const parsed = parseGoogleAuthConfiguration(await request.json());
    const clientSecret = parsed.clientSecret ? encryptCredential(parsed.clientSecret) : null;
    const apiKey = parsed.apiKey ? encryptCredential(parsed.apiKey) : null;
    const config = await prisma.googleAuthConfig.upsert({
      where: { id: "google" },
      create: {
        id: "google",
        enabled: parsed.enabled,
        webClientId: parsed.webClientId,
        androidClientId: parsed.androidClientId,
        iosClientId: parsed.iosClientId,
        clientSecretCredential: clientSecret ? asJson(clientSecret) : undefined,
        clientSecretLastFour: clientSecret?.lastFour,
        apiKeyCredential: apiKey ? asJson(apiKey) : undefined,
        apiKeyLastFour: apiKey?.lastFour,
        updatedById: admin.userId,
      },
      update: {
        enabled: parsed.enabled,
        webClientId: parsed.webClientId,
        androidClientId: parsed.androidClientId,
        iosClientId: parsed.iosClientId,
        ...(clientSecret
          ? {
              clientSecretCredential: asJson(clientSecret),
              clientSecretLastFour: clientSecret.lastFour,
            }
          : {}),
        ...(apiKey
          ? { apiKeyCredential: asJson(apiKey), apiKeyLastFour: apiKey.lastFour }
          : {}),
        updatedById: admin.userId,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "GOOGLE_AUTH_CONFIG_UPDATED",
        resource: "GoogleAuthConfig",
        detailsJson: { enabled: parsed.enabled },
      },
    });
    return successResponse(sanitizeGoogleAuthConfiguration(config), 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Google configuration";
    return errorResponse("GOOGLE_AUTH_CONFIGURATION_ERROR", message, 400);
  }
}
