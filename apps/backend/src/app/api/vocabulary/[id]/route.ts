import { prisma } from "@/lib/prisma";
import { authenticateRequest, errorResponse, successResponse } from "../../_helpers";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401);
  const { id } = await params;
  const result = await prisma.savedWord.deleteMany({ where: { id, userId: auth.userId } });
  if (result.count === 0) return errorResponse("NOT_FOUND", "Saved word not found", 404);
  return successResponse({ deleted: true });
}
