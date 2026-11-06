import { prisma } from "@/lib/prisma";
import { parseQuotaTierInput } from "@/lib/quotas/tier-input";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../_helpers";

export async function GET(request: Request) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);

  const tiers = await prisma.quotaTier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
  return successResponse(tiers, 200);
}

export async function POST(request: Request) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);

  try {
    const input = parseQuotaTierInput(await request.json());
    const tier = await prisma.quotaTier.create({ data: input });
    return successResponse(tier, 201);
  } catch (error) {
    console.error("Admin quota tier POST error:", error);
    return errorResponse("VALIDATION_ERROR", "Invalid or duplicate package values", 400);
  }
}
