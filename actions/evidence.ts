"use server";

import { randomUUID } from "node:crypto";
import { CaseStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { validateEvidenceFile } from "@/lib/evidence";
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
    select: { id: true },
  });
  if (!item) throw new Error("Case not found.");
  const eligibility = await prisma.intakeResponse.findUnique({
    where: { caseId_questionKey: { caseId, questionKey: "eligibility" } },
    select: { answer: true },
  });
  if (!isEligibleAnswer(eligibility?.answer)) redirect(`/cases/${caseId}/intake`);
  const file = formData.get("file");
  if (!(file instanceof File)) redirect(`/cases/${caseId}/evidence?error=Choose%20a%20file`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let extension: string;
  try {
    extension = validateEvidenceFile(file.name, file.type, bytes).extension;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The file could not be accepted.";
    redirect(`/cases/${caseId}/evidence?error=${encodeURIComponent(message)}`);
  }
  const storageKey = `${ownerSessionId}/${caseId}/${randomUUID()}${extension}`;
  await prisma.$transaction([
    prisma.evidenceFile.create({
      data: {
        caseId,
        filename: file.name,
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
}
