import { prisma } from "@/lib/prisma";
import { successResponse } from "../../../_helpers";

export async function GET() {
  const config = await prisma.googleAuthConfig.findUnique({ where: { id: "google" } });
  const enabled = Boolean(config?.enabled && config.webClientId);
  return successResponse(
    { enabled, webClientId: enabled ? config!.webClientId : null },
    200
  );
}
