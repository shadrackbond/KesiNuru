"use server";

import { CaseStage, Prisma, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildActionPath, legalSourceSeeds } from "@/lib/action-path";
import { buildCasePack } from "@/lib/casepack";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { objectIdSchema } from "@/lib/validation";

async function requireOwnedCase(caseId: string) {
  const ownerSessionId = await requireSessionId();
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: { id: true },
  });
  if (!item) throw new Error("Case not found.");
  return ownerSessionId;
}

export async function prepareActionPath(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const ownerSessionId = await requireOwnedCase(caseId);
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: {
      intakeResponses: { select: { questionKey: true, answer: true } },
      checks: { select: { severity: true, status: true } },
      _count: { select: { evidenceFiles: true, events: true } },
    },
  });
  if (!item) throw new Error("Case not found.");

  const path = buildActionPath({
    checks: item.checks,
    responses: item.intakeResponses,
    evidenceCount: item._count.evidenceFiles,
    eventCount: item._count.events,
  });
  const sourceKeys = new Set(path.steps.flatMap((step) => (step.sourceKey ? [step.sourceKey] : [])));

  await prisma.$transaction(async (tx) => {
    await tx.actionReference.deleteMany({ where: { caseId } });
    for (const key of sourceKeys) {
      const seed = legalSourceSeeds[key];
      const { explanation, ...sourceData } = seed;
      const source = await tx.legalSource.upsert({
        where: {
          canonicalUrl_provision: {
            canonicalUrl: seed.canonicalUrl,
            provision: seed.provision,
          },
        },
        create: { ...sourceData, verifiedAt: new Date() },
        update: {
          title: seed.title,
          issuingBody: seed.issuingBody,
          verifiedAt: new Date(),
        },
      });
      await tx.actionReference.create({
        data: {
          caseId,
          legalSourceId: source.id,
          explanation,
          reviewRequired: true,
        },
      });
    }
    await tx.case.update({
      where: { id: caseId },
      data: { stage: CaseStage.ACTION_PATH, progress: 80 },
    });
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/action-path?prepared=1`);
}

export async function generateCasePack(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const ownerSessionId = await requireOwnedCase(caseId);
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    include: {
      intakeResponses: true,
      evidenceFiles: {
        orderBy: { uploadedAt: "asc" },
        select: {
          id: true,
          filename: true,
          documentType: true,
          mimeType: true,
          sizeBytes: true,
          processingStatus: true,
          uploadedAt: true,
          facts: {
            where: {
              verificationStatus: {
                in: [
                  VerificationStatus.CONFIRMED,
                  VerificationStatus.CORRECTED,
                  VerificationStatus.USER_STATED,
                ],
              },
            },
            select: {
              id: true,
              evidenceFileId: true,
              factType: true,
              candidateValue: true,
              correctedValue: true,
              verificationStatus: true,
              page: true,
              excerpt: true,
              confidence: true,
            },
          },
        },
      },
      events: {
        orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
        include: {
          evidenceLinks: {
            select: {
              relationship: true,
              evidenceFileId: true,
              extractedFactId: true,
            },
          },
        },
      },
      checks: { orderBy: [{ status: "desc" }, { severity: "asc" }] },
      actionReferences: { include: { legalSource: true } },
    },
  });
  if (!item) throw new Error("Case not found.");

  const latest = await prisma.generatedDocument.findFirst({
    where: { caseId, documentType: "CASEPACK" },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const content = buildCasePack({
    caseRecord: item,
    responses: item.intakeResponses,
    evidence: item.evidenceFiles,
    events: item.events,
    checks: item.checks,
    references: item.actionReferences,
  });
  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.generatedDocument.create({
      data: {
        caseId,
        documentType: "CASEPACK",
        version: (latest?.version ?? 0) + 1,
        content: content as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.case.update({
      where: { id: caseId },
      data: { stage: CaseStage.CASEPACK, progress: 90 },
    });
    return created;
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/casepack?generated=1&documentId=${document.id}`);
}

export async function confirmCasePack(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const documentId = objectIdSchema.parse(formData.get("documentId"));
  const ownerSessionId = await requireOwnedCase(caseId);
  const document = await prisma.generatedDocument.findFirst({
    where: { id: documentId, caseId, case: { ownerSessionId } },
    select: { id: true, version: true },
  });
  if (!document) throw new Error("CasePack not found.");
  const latest = await prisma.generatedDocument.findFirst({
    where: { caseId, documentType: "CASEPACK" },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  if (latest?.id !== document.id) {
    redirect(`/cases/${caseId}/casepack?error=Only%20the%20latest%20CasePack%20can%20be%20confirmed`);
  }
  const blockingChecks = await prisma.nuruCheck.count({
    where: { caseId, status: "OPEN", severity: "BLOCKING" },
  });
  if (blockingChecks > 0) {
    redirect(`/cases/${caseId}/casepack?error=Resolve%20blocking%20Nuru%20Checks%20before%20confirmation`);
  }
  await prisma.$transaction([
    prisma.generatedDocument.update({ where: { id: documentId }, data: { confirmedAt: new Date() } }),
    prisma.case.update({ where: { id: caseId }, data: { stage: CaseStage.COMPLETE, progress: 100 } }),
  ]);
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/casepack?confirmed=1&documentId=${documentId}`);
}
