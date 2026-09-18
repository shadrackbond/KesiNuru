import "server-only";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";

export async function listOwnedCases() {
  const ownerSessionId = await requireSessionId();
  return prisma.case.findMany({
    where: { ownerSessionId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      stage: true,
      progress: true,
      updatedAt: true,
      _count: { select: { evidenceFiles: true, checks: true } },
    },
  });
}

export async function getOwnedCase(caseId: string) {
  const ownerSessionId = await requireSessionId();
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    include: { _count: { select: { evidenceFiles: true, checks: true, events: true } } },
  });
  if (!item) notFound();
  return item;
}
