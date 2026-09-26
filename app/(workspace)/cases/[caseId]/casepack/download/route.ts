import { NextRequest } from "next/server";
import { casePackContentSchema } from "@/lib/casepack";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { objectIdSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId: rawCaseId } = await params;
  const caseId = objectIdSchema.safeParse(rawCaseId);
  const documentId = objectIdSchema.safeParse(request.nextUrl.searchParams.get("documentId"));
  if (!caseId.success || !documentId.success) {
    return Response.json({ error: "Invalid CasePack request." }, { status: 400 });
  }
  const ownerSessionId = await requireSessionId();
  const document = await prisma.generatedDocument.findFirst({
    where: {
      id: documentId.data,
      caseId: caseId.data,
      documentType: "CASEPACK",
      case: { ownerSessionId },
    },
    select: { version: true, content: true },
  });
  if (!document) return Response.json({ error: "CasePack not found." }, { status: 404 });
  const parsed = casePackContentSchema.safeParse(document.content);
  if (!parsed.success) {
    return Response.json({ error: "Stored CasePack is invalid." }, { status: 422 });
  }
  return new Response(JSON.stringify(parsed.data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kesinuru-casepack-v${document.version}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
