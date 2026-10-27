import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { verifyToken, extractBearerToken, TokenPayload } from "@/lib/auth/jwt";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export async function authenticateRequest(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get("Authorization");
  const token = extractBearerToken(authHeader);
  if (!token) return null;
  return verifyToken(token);
}

export async function authenticateAdminRequest(request: Request): Promise<TokenPayload | null> {
  const payload = await authenticateRequest(request);
  if (!payload) return null;
  if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
    return payload;
  }
  return null;
}

