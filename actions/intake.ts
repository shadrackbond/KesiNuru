"use server";

import { CaseStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { intakeSteps, isEligibleAnswer, normaliseStepAnswer } from "@/lib/intake";
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
  return item;
}

async function requirePassedEligibility(caseId: string) {
  const response = await prisma.intakeResponse.findUnique({
    where: { caseId_questionKey: { caseId, questionKey: "eligibility" } },
    select: { answer: true },
  });
  if (!isEligibleAnswer(response?.answer)) redirect(`/cases/${caseId}/intake`);
}

export async function saveEligibility(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  await requireOwnedCase(caseId);
  const answer = {
    ageConfirmed: String(formData.get("ageConfirmed") ?? ""),
    jurisdiction: String(formData.get("jurisdiction") ?? ""),
    emergency: String(formData.get("emergency") ?? ""),
    processingConsent: String(formData.get("processingConsent") ?? ""),
  };
  await prisma.intakeResponse.upsert({
    where: { caseId_questionKey: { caseId, questionKey: "eligibility" } },
    create: { caseId, questionKey: "eligibility", answer },
    update: { answer },
  });
  const eligible =
    answer.ageConfirmed === "yes" &&
    answer.jurisdiction === "Kenya" &&
    answer.emergency === "no" &&
    answer.processingConsent === "yes";
  revalidatePath(`/cases/${caseId}/intake`);
  redirect(eligible ? `/cases/${caseId}/intake?step=1` : `/cases/${caseId}/intake?status=paused`);
}

export async function saveIntakeStep(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const stepIndex = z.coerce
    .number()
    .int()
    .min(0)
    .max(intakeSteps.length - 1)
    .parse(formData.get("stepIndex"));
  await requireOwnedCase(caseId);
  await requirePassedEligibility(caseId);
  let parsed: ReturnType<typeof normaliseStepAnswer>;
  try {
    parsed = normaliseStepAnswer(formData, stepIndex);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Please check the answers.";
    redirect(`/cases/${caseId}/intake?step=${stepIndex + 1}&error=${encodeURIComponent(message)}`);
  }
  await prisma.intakeResponse.upsert({
    where: { caseId_questionKey: { caseId, questionKey: parsed.questionKey } },
    create: { caseId, ...parsed },
    update: { answer: parsed.answer },
  });
  const nextStep = stepIndex + 2;
  if (nextStep <= intakeSteps.length) redirect(`/cases/${caseId}/intake?step=${nextStep}`);
  await prisma.case.update({
    where: { id: caseId },
    data: { stage: CaseStage.EVIDENCE, progress: 25 },
  });
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/intake?step=review`);
}

export async function completeIntake(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  await requireOwnedCase(caseId);
  await requirePassedEligibility(caseId);
  const count = await prisma.intakeResponse.count({
    where: { caseId, questionKey: { startsWith: "intake." } },
  });
  if (count !== intakeSteps.length)
    redirect(`/cases/${caseId}/intake?error=Complete%20all%20intake%20steps`);
  await prisma.case.update({
    where: { id: caseId },
    data: { stage: CaseStage.EVIDENCE, progress: 30 },
  });
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/evidence`);
}
