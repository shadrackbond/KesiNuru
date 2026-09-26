"use server";

import { randomUUID } from "node:crypto";
import { CaseStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_FILES_PER_CASE,
  MAX_TOTAL_EVIDENCE_BYTES_PER_CASE,
  validateEvidenceFile,
} from "@/lib/evidence";
import { isEligibleAnswer } from "@/lib/intake";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { objectIdSchema } from "@/lib/validation";

const documentTypes = [
  "Contract",
  "Payslip",
  "Payment record",
  "Message or email",
  "Termination letter",
  "Other",
] as const;
export async function uploadEvidence(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const documentType = z.enum(documentTypes).parse(formData.get("documentType"));
  const ownerSessionId = await requireSessionId();
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: {
      id: true,
      intakeResponses: {
        where: { questionKey: "eligibility" },
        select: { answer: true },
        take: 1,
      },
      evidenceFiles: { select: { sizeBytes: true } },
    },
  });
  if (!item) throw new Error("Case not found.");
  if (!isEligibleAnswer(item.intakeResponses[0]?.answer)) redirect(`/cases/${caseId}/intake`);
  const file = formData.get("file");
  if (!(file instanceof File)) redirect(`/cases/${caseId}/evidence?error=Choose%20a%20file`);
  if (file.size > MAX_EVIDENCE_BYTES) {
    redirect(`/cases/${caseId}/evidence?error=Files%20must%20be%2010%20MB%20or%20smaller`);
  }
  if (item.evidenceFiles.length >= MAX_EVIDENCE_FILES_PER_CASE) {
    redirect(`/cases/${caseId}/evidence?error=This%20case%20already%20has%20the%20maximum%20number%20of%20files`);
  }
  const existingBytes = item.evidenceFiles.reduce((total, evidence) => total + evidence.sizeBytes, 0);
  if (existingBytes + file.size > MAX_TOTAL_EVIDENCE_BYTES_PER_CASE) {
    redirect(`/cases/${caseId}/evidence?error=This%20case%20has%20reached%20its%2050%20MB%20evidence%20limit`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let extension: string;
  let filename: string;
  try {
    ({ extension, filename } = validateEvidenceFile(file.name, file.type, bytes));
  } catch (error) {
    const message = error instanceof Error ? error.message : "The file could not be accepted.";
    redirect(`/cases/${caseId}/evidence?error=${encodeURIComponent(message)}`);
  }
  const storageKey = `${ownerSessionId}/${caseId}/${randomUUID()}${extension}`;
  await prisma.$transaction([
    prisma.evidenceFile.create({
      data: {
        caseId,
        filename,
        documentType,
        mimeType: file.type,
        sizeBytes: bytes.length,
        storageKey,
        content: Buffer.from(bytes),
      },
    }),
    prisma.case.update({
      where: { id: caseId },
      data: { stage: CaseStage.EVIDENCE, progress: 35 },
    }),
  ]);
  revalidatePath(`/cases/${caseId}/evidence`);
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/evidence?uploaded=1`);
}

export async function deleteEvidence(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const evidenceId = objectIdSchema.parse(formData.get("evidenceId"));
  const ownerSessionId = await requireSessionId();
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, caseId, case: { ownerSessionId } },
    select: { id: true },
  });
  if (!evidence) throw new Error("Evidence file not found.");
  await prisma.evidenceFile.delete({ where: { id: evidence.id } });
  revalidatePath(`/cases/${caseId}/evidence`);
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/evidence?deleted=1`);
}
