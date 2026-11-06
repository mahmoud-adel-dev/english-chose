import { prisma } from "@/lib/prisma";
import { authenticateAdminRequest, errorResponse, successResponse } from "../../../../_helpers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await authenticateAdminRequest(request);
  if (!admin) return errorResponse("FORBIDDEN", "Admin privileges required", 403);

  const { id } = await params;
  const body = await request.json();
  const quotaTierId = typeof body.quotaTierId === "string" ? body.quotaTierId : "";
  if (!quotaTierId) return errorResponse("VALIDATION_ERROR", "Package is required", 400);

  const tier = await prisma.quotaTier.findFirst({
    where: { id: quotaTierId, isActive: true },
  });
  if (!tier) return errorResponse("VALIDATION_ERROR", "Active package not found", 400);

  const user = await prisma.user.update({
    where: { id },
    data: { quotaTierId },
    select: { id: true, quotaTier: true },
  });
  return successResponse(user, 200);
}
