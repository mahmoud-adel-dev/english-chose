import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS, PATCH";
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Requested-With, Accept";

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): Set<string> {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const normalized = normalizeOrigin(appUrl);
    if (normalized) configured.push(normalized);
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    const normalized = normalizeOrigin(
      vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`
    );
    if (normalized) configured.push(normalized);
  }

  // The currently configured production frontend. Additional domains should
  // be explicitly listed in CORS_ALLOWED_ORIGINS.
  configured.push("https://english-chose.vercel.app");

  if (process.env.NODE_ENV !== "production") {
    configured.push(
      "http://localhost:3000",
      "http://localhost:7357",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:7357"
    );
  }

  return new Set(configured);
}

export function middleware(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  const origin = originHeader ? normalizeOrigin(originHeader) : null;
  const allowedOrigins = getAllowedOrigins();
  const originIsAllowed = !originHeader || (origin !== null && allowedOrigins.has(origin));

  if (request.method === "OPTIONS") {
    if (!originIsAllowed) {
      return new NextResponse(null, { status: 403 });
    }

    const response = new NextResponse(null, { status: 204 });
    if (origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Vary", "Origin");
    }
    response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  const response = NextResponse.next();
  if (originHeader && originIsAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  }

  if (originHeader && !originIsAllowed) {
    return NextResponse.json({ success: false, error: { code: "ORIGIN_NOT_ALLOWED", message: "This origin is not allowed to access the API." } }, { status: 403 });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
