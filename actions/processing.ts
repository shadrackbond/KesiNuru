"use server";

import { CaseStage, ProcessingStatus, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { candidateValue, displayDocumentType, factTypes } from "@/lib/document-analysis";
import { analyseDocument } from "@/lib/document-processing";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { objectIdSchema } from "@/lib/validation";

async function requireOwnedEvidence(caseId: string, evidenceId: string) {
  const ownerSessionId = await requireSessionId();
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, caseId, case: { ownerSessionId } },
    include: { facts: { select: { verificationStatus: true } } },
  });
  if (!evidence) throw new Error("Evidence file not found.");
  return evidence;
}

function reviewPath(caseId: string, evidenceId: string) {
  return `/cases/${caseId}/evidence/${evidenceId}/review`;
}

export async function processEvidence(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const evidenceId = objectIdSchema.parse(formData.get("evidenceId"));
  const evidence = await requireOwnedEvidence(caseId, evidenceId);
  const processingIsFresh =
    evidence.processingStartedAt &&
    Date.now() - evidence.processingStartedAt.getTime() < 2 * 60 * 1000;
  if (evidence.processingStatus === ProcessingStatus.PROCESSING && processingIsFresh) {
    redirect(`${reviewPath(caseId, evidenceId)}?error=Processing%20is%20already%20running`);
  }
  if (
    evidence.facts.some(
      (fact) =>
        fact.verificationStatus === VerificationStatus.CONFIRMED ||
        fact.verificationStatus === VerificationStatus.CORRECTED,
    )
  ) {
    redirect(
      `${reviewPath(caseId, evidenceId)}?error=Reviewed%20facts%20cannot%20be%20overwritten`,
    );
  }

  await prisma.evidenceFile.update({
    where: { id: evidenceId },
    data: {
      processingStatus: ProcessingStatus.PROCESSING,
      processingStartedAt: new Date(),
      processingError: null,
      processingWarning: null,
    },
  });
  revalidatePath(`/cases/${caseId}/evidence`);

  try {
    const { analysis, model } = await analyseDocument({
      content: evidence.content,
      mimeType: evidence.mimeType,
    });
    const warning = [
      ...(analysis.promptInjectionDetected ? ["Potential prompt-injection text detected."] : []),
      ...analysis.warnings,
    ].join(" ");
    await prisma.$transaction(async (tx) => {
      await tx.extractedFact.deleteMany({
        where: { evidenceFileId: evidenceId, verificationStatus: VerificationStatus.CANDIDATE },
      });
      if (analysis.facts.length > 0) {
        await tx.extractedFact.createMany({
          data: analysis.facts.map((fact) => ({
            evidenceFileId: evidenceId,
            factType: fact.factType,
            candidateValue: candidateValue(fact),
            page: fact.page,
            excerpt: fact.excerpt,
            confidence: fact.confidence,
            verificationStatus: VerificationStatus.CANDIDATE,
          })),
        });
      }
      await tx.evidenceFile.update({
        where: { id: evidenceId },
        data: {
          documentType: displayDocumentType(analysis.documentType),
          processingSummary: analysis.summary,
          processingWarning: warning || null,
          processingError: null,
          processingStatus:
            analysis.facts.length > 0 && !analysis.promptInjectionDetected
              ? ProcessingStatus.READY
              : ProcessingStatus.NEEDS_ATTENTION,
          processingStartedAt: null,
          modelVersion: model,
          processedAt: new Date(),
        },
      });
      await tx.case.update({
        where: { id: caseId },
        data: { stage: CaseStage.FACT_REVIEW, progress: 45 },
      });
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 300) : "Unknown processing error";
    const storedError = detail.includes("GEMINI_API_KEY")
      ? detail
      : "Processing failed. Retry or add facts manually.";
    await prisma.evidenceFile.update({
      where: { id: evidenceId },
      data: {
        processingStatus: ProcessingStatus.FAILED,
        processingStartedAt: null,
        processingError: storedError,
      },
    });
    revalidatePath(`/cases/${caseId}/evidence`);
    const publicMessage = detail.includes("GEMINI_API_KEY")
      ? detail
      : "Document processing failed. Retry or add facts manually.";
    redirect(`${reviewPath(caseId, evidenceId)}?error=${encodeURIComponent(publicMessage)}`);
  }
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/evidence`);
  redirect(`${reviewPath(caseId, evidenceId)}?processed=1`);
}

export async function addManualFact(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const evidenceId = objectIdSchema.parse(formData.get("evidenceId"));
  await requireOwnedEvidence(caseId, evidenceId);
  const factType = z.enum(factTypes).parse(formData.get("factType"));
  const value = z.string().trim().min(1).max(500).parse(formData.get("value"));
  const excerpt = z
    .string()
    .trim()
    .max(500)
    .parse(formData.get("excerpt") ?? "");
  const pageValue = z
    .string()
    .trim()
    .parse(formData.get("page") ?? "");
  const page = pageValue ? z.coerce.number().int().min(1).max(1000).parse(pageValue) : null;
  await prisma.extractedFact.create({
    data: {
      evidenceFileId: evidenceId,
      factType,
      candidateValue: { value },
      excerpt: excerpt || null,
      page,
      verificationStatus: VerificationStatus.USER_STATED,
    },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { stage: CaseStage.FACT_REVIEW, progress: 45 },
  });
  revalidatePath(reviewPath(caseId, evidenceId));
  redirect(`${reviewPath(caseId, evidenceId)}?manual=1`);
}

export async function reviewFact(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const evidenceId = objectIdSchema.parse(formData.get("evidenceId"));
  const factId = objectIdSchema.parse(formData.get("factId"));
  const decision = z.enum(["confirm", "correct", "reject"]).parse(formData.get("decision"));
  const ownerSessionId = await requireSessionId();
  const fact = await prisma.extractedFact.findFirst({
    where: {
      id: factId,
      evidenceFileId: evidenceId,
      evidenceFile: { caseId, case: { ownerSessionId } },
    },
    select: { id: true },
  });
  if (!fact) throw new Error("Extracted fact not found.");
  if (decision === "correct") {
    const corrected = z.string().trim().min(1).max(500).parse(formData.get("correctedValue"));
    await prisma.extractedFact.update({
      where: { id: factId },
      data: {
        verificationStatus: VerificationStatus.CORRECTED,
        correctedValue: { value: corrected },
      },
    });
  } else {
    await prisma.extractedFact.update({
      where: { id: factId },
      data: {
        verificationStatus:
          decision === "confirm" ? VerificationStatus.CONFIRMED : VerificationStatus.REJECTED,
      },
    });
  }
  const remaining = await prisma.extractedFact.count({
    where: { evidenceFileId: evidenceId, verificationStatus: VerificationStatus.CANDIDATE },
  });
  if (remaining === 0) {
    await prisma.case.update({ where: { id: caseId }, data: { progress: 50 } });
  }
  revalidatePath(reviewPath(caseId, evidenceId));
  revalidatePath(`/cases/${caseId}`);
  redirect(`${reviewPath(caseId, evidenceId)}#fact-${factId}`);
}
