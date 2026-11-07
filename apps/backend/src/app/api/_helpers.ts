import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { verifyToken, extractBearerToken, TokenPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

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

/**
 * Verify the signed token and reload the account's current status and role.
 * This prevents a stale JWT from retaining admin access after a role change
 * or continuing to access the API after an account has been suspended.
 */
export async function authenticateRequest(request: Request): Promise<TokenPayload | null> {
  const token = extractBearerToken(request.headers.get("Authorization"));
  if (!token) return null;

  const tokenPayload = await verifyToken(token);
  if (!tokenPayload) return null;

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function authenticateAdminRequest(request: Request): Promise<TokenPayload | null> {
  const payload = await authenticateRequest(request);
  if (!payload) return null;
  if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
    return payload;
  }
  return null;
}
