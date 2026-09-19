import { NextResponse } from "next/server";
import { safeDownloadName } from "@/lib/evidence";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ caseId: string; evidenceId: string }> },
) {
  const { caseId, evidenceId } = await params;
  const ownerSessionId = await requireSessionId();
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, caseId, case: { ownerSessionId } },
    select: { filename: true, mimeType: true, content: true },
  });
  if (!evidence) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = evidence.content.buffer.slice(
    evidence.content.byteOffset,
    evidence.content.byteOffset + evidence.content.byteLength,
  ) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": evidence.mimeType,
      "Content-Length": String(evidence.content.length),
      "Content-Disposition": `inline; filename="${safeDownloadName(evidence.filename)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
