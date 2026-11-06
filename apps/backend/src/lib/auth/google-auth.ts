import { OAuth2Client, TokenPayload } from "google-auth-library";

export type GoogleAuthConfigurationInput = {
  enabled?: unknown;
  webClientId?: unknown;
  androidClientId?: unknown;
  iosClientId?: unknown;
  clientSecret?: unknown;
  apiKey?: unknown;
};

export type ParsedGoogleAuthConfiguration = {
  enabled: boolean;
  webClientId: string | null;
  androidClientId: string | null;
  iosClientId: string | null;
  clientSecret: string | null;
  apiKey: string | null;
};

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parseGoogleAuthConfiguration(
  input: GoogleAuthConfigurationInput
): ParsedGoogleAuthConfiguration {
  const parsed = {
    enabled: input.enabled === true,
    webClientId: optionalString(input.webClientId),
    androidClientId: optionalString(input.androidClientId),
    iosClientId: optionalString(input.iosClientId),
    clientSecret: optionalString(input.clientSecret),
    apiKey: optionalString(input.apiKey),
  };
  if (parsed.enabled && !parsed.webClientId) {
    throw new Error("Web client ID is required before Google login can be enabled.");
  }
  if (parsed.webClientId && !parsed.webClientId.endsWith(".apps.googleusercontent.com")) {
    throw new Error("Web client ID must be a Google OAuth client ID.");
  }
  return parsed;
}

export function sanitizeGoogleAuthConfiguration(config: {
  enabled: boolean;
  webClientId: string | null;
  androidClientId: string | null;
  iosClientId: string | null;
  clientSecretLastFour: string | null;
  apiKeyLastFour: string | null;
  clientSecretCredential?: unknown;
  apiKeyCredential?: unknown;
}) {
  return {
    enabled: config.enabled,
    webClientId: config.webClientId,
    androidClientId: config.androidClientId,
    iosClientId: config.iosClientId,
    clientSecretConfigured: Boolean(config.clientSecretCredential),
    clientSecretLastFour: config.clientSecretLastFour,
    apiKeyConfigured: Boolean(config.apiKeyCredential),
    apiKeyLastFour: config.apiKeyLastFour,
  };
}

export type GoogleIdentity = {
  subject: string;
  email: string;
  name: string;
  picture: string | null;
  canLinkExistingEmail: boolean;
};

type GooglePayload = Pick<
  TokenPayload,
  "sub" | "email" | "email_verified" | "name" | "picture" | "hd"
>;
type GoogleTokenVerifier = (idToken: string, audience: string) => Promise<GooglePayload | undefined>;

async function officialGoogleVerifier(idToken: string, audience: string) {
  const ticket = await new OAuth2Client().verifyIdToken({ idToken, audience });
  return ticket.getPayload();
}

export async function verifyGoogleIdentity(
  idToken: string,
  audience: string,
  verifier: GoogleTokenVerifier = officialGoogleVerifier
): Promise<GoogleIdentity> {
  if (!idToken.trim()) throw new Error("Google ID token is required.");
  const payload = await verifier(idToken, audience);
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error("Google did not provide a verified email identity.");
  }
  return {
    subject: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || payload.email.split("@")[0],
    picture: payload.picture || null,
    canLinkExistingEmail:
      payload.email.toLowerCase().endsWith("@gmail.com") || Boolean(payload.hd),
  };
}

type AccountCandidate = { id: string; isActive: boolean; googleSubject: string | null };

export function decideGoogleAccountAction(
  bySubject: AccountCandidate | null,
  byEmail: AccountCandidate | null,
  canLinkExistingEmail = false
): { type: "USE" | "LINK"; userId: string } | { type: "CREATE" } {
  const candidate = bySubject || byEmail;
  if (candidate && !candidate.isActive) throw new Error("This account is disabled.");
  if (bySubject) return { type: "USE", userId: bySubject.id };
  if (byEmail?.googleSubject) {
    throw new Error("This email is already linked to another Google account.");
  }
  if (byEmail && !canLinkExistingEmail) {
    throw new Error(
      "Sign in with your password first before linking this external email to Google."
    );
  }
  if (byEmail) return { type: "LINK", userId: byEmail.id };
  return { type: "CREATE" };
}
