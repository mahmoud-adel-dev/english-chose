import { prisma } from "@/lib/prisma";
import { parseQuotaTierInput } from "@/lib/quotas/tier-input";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../../_helpers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);

  try {
    const { id } = await params;
    const existing = await prisma.quotaTier.findUnique({ where: { id } });
    if (!existing) return errorResponse("NOT_FOUND", "Package not found", 404);

    const input = parseQuotaTierInput(await request.json());
    if (existing.name === "FREE" && input.name !== "FREE") {
      return errorResponse("VALIDATION_ERROR", "The FREE package name cannot be changed", 400);
    }

    const tier = await prisma.quotaTier.update({ where: { id }, data: input });
    return successResponse(tier, 200);
  } catch (error) {
    console.error("Admin quota tier PUT error:", error);
    return errorResponse("VALIDATION_ERROR", "Invalid or duplicate package values", 400);
  }
}
