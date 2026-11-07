import { SignJWT, jwtVerify } from "jose";

const DEVELOPMENT_ONLY_SECRET =
  "local-development-only-secret-change-before-deploying-english-coach";
const TEST_ONLY_SECRET = "english-coach-vitest-only-secret-never-use-in-production";
const ALLOWED_ROLES = new Set(["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"]);

function getSecretKey(): Uint8Array {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "test") {
      return new TextEncoder().encode(TEST_ONLY_SECRET);
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET is required in production and must contain at least 32 characters.");
    }
    return new TextEncoder().encode(DEVELOPMENT_ONLY_SECRET);
  }

  if (Buffer.byteLength(configuredSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes.");
  }

  return new TextEncoder().encode(configuredSecret);
}


export function assertJwtConfiguration(): void {
  // Validate before any account mutation so a missing production secret cannot
  // leave a newly-created account without a usable authentication token.
  getSecretKey();
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signToken(
  payload: TokenPayload,
  expiresIn: string = "7d"
): Promise<string> {
  if (!payload.userId || !payload.email || !ALLOWED_ROLES.has(payload.role)) {
    throw new Error("Cannot issue a token with an invalid user identity or role.");
  }

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  if (!token || token.length > 8192) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const userId = typeof payload.sub === "string" ? payload.sub : payload.userId;
    const email = payload.email;
    const role = payload.role;

    if (
      typeof userId !== "string" ||
      !userId ||
      typeof email !== "string" ||
      !email ||
      typeof role !== "string" ||
      !ALLOWED_ROLES.has(role)
    ) {
      return null;
    }

    return { userId, email, role };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || authHeader.length > 8300) return null;
  const match = authHeader.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}
