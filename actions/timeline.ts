"use server";

import { CaseStage, RelationshipType, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { evaluateNuruChecks } from "@/lib/nuru-check";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";
import { buildTimelineSeeds, type TimelineFact } from "@/lib/timeline";
import { objectIdSchema } from "@/lib/validation";

function timelinePath(caseId: string) {
  return `/cases/${caseId}/timeline`;
}

async function requireOwnedCaseId(caseId: string) {
  const ownerSessionId = await requireSessionId();
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: { id: true },
  });
  if (!item) throw new Error("Case not found.");
  return ownerSessionId;
}

function parseDate(value: FormDataEntryValue | null) {
  const text = z
    .string()
    .trim()
    .parse(value ?? "");
  return text ? new Date(`${z.string().date().parse(text)}T00:00:00.000Z`) : null;
}

const eventTypeSchema = z.string().trim().min(1).max(80);
const descriptionSchema = z.string().trim().min(1).max(2000);

export async function generateTimeline(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const ownerSessionId = await requireOwnedCaseId(caseId);
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: {
      intakeResponses: { select: { questionKey: true, answer: true } },
      events: { select: { id: true }, take: 1 },
      evidenceFiles: {
        select: {
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
            },
          },
        },
      },
    },
  });
  if (!item) throw new Error("Case not found.");
  if (item.events.length) {
    redirect(
      `${timelinePath(caseId)}?error=Timeline%20already%20exists.%20Edit%20the%20events%20instead.`,
    );
  }
  const facts = item.evidenceFiles.flatMap((file) => file.facts) as TimelineFact[];
  const seeds = buildTimelineSeeds(item.intakeResponses, facts);
  if (!seeds.length) {
    redirect(
      `${timelinePath(caseId)}?error=No%20reviewed%20facts%20or%20intake%20details%20can%20form%20a%20timeline.`,
    );
  }
  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  await prisma.$transaction(async (tx) => {
    for (const seed of seeds) {
      const event = await tx.caseEvent.create({
        data: {
          caseId,
          eventType: seed.eventType,
          eventDate: seed.eventDate ? new Date(`${seed.eventDate}T00:00:00.000Z`) : null,
          approximateDate: seed.approximateDate,
          description: seed.description,
          verificationStatus: seed.verificationStatus,
        },
      });
      const linkData = seed.factIds
        .map((factId) => factsById.get(factId))
        .filter((fact): fact is TimelineFact => Boolean(fact))
        .map((fact) => ({
          eventId: event.id,
          evidenceFileId: fact.evidenceFileId,
          extractedFactId: fact.id,
          relationship: RelationshipType.SUPPORTS,
        }));
      if (linkData.length) await tx.evidenceLink.createMany({ data: linkData });
    }
    await tx.case.update({
      where: { id: caseId },
      data: { stage: CaseStage.TIMELINE, progress: 60 },
    });
  });
  revalidatePath(`/cases/${caseId}`);
  redirect(`${timelinePath(caseId)}?generated=1`);
}

export async function addTimelineEvent(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  await requireOwnedCaseId(caseId);
  await prisma.caseEvent.create({
    data: {
      caseId,
      eventType: eventTypeSchema.parse(formData.get("eventType")),
      eventDate: parseDate(formData.get("eventDate")),
      approximateDate:
        z
          .string()
          .trim()
          .max(120)
          .parse(formData.get("approximateDate") ?? "") || null,
      description: descriptionSchema.parse(formData.get("description")),
      verificationStatus: VerificationStatus.USER_STATED,
    },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { stage: CaseStage.TIMELINE, progress: 60 },
  });
  revalidatePath(timelinePath(caseId));
  redirect(`${timelinePath(caseId)}?added=1`);
}

export async function updateTimelineEvent(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const eventId = objectIdSchema.parse(formData.get("eventId"));
  const ownerSessionId = await requireOwnedCaseId(caseId);
  const event = await prisma.caseEvent.findFirst({
    where: { id: eventId, caseId, case: { ownerSessionId } },
    select: { id: true },
  });
  if (!event) throw new Error("Timeline event not found.");
  await prisma.caseEvent.update({
    where: { id: eventId },
    data: {
      eventType: eventTypeSchema.parse(formData.get("eventType")),
      eventDate: parseDate(formData.get("eventDate")),
      approximateDate:
        z
          .string()
          .trim()
          .max(120)
          .parse(formData.get("approximateDate") ?? "") || null,
      description: descriptionSchema.parse(formData.get("description")),
      verificationStatus: VerificationStatus.CORRECTED,
    },
  });
  revalidatePath(timelinePath(caseId));
  redirect(`${timelinePath(caseId)}?updated=1#event-${eventId}`);
}

export async function deleteTimelineEvent(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const eventId = objectIdSchema.parse(formData.get("eventId"));
  const ownerSessionId = await requireOwnedCaseId(caseId);
  const event = await prisma.caseEvent.findFirst({
    where: { id: eventId, caseId, case: { ownerSessionId } },
    select: { id: true },
  });
  if (!event) throw new Error("Timeline event not found.");
  await prisma.caseEvent.delete({ where: { id: eventId } });
  revalidatePath(timelinePath(caseId));
  redirect(`${timelinePath(caseId)}?deleted=1`);
}

export async function runNuruCheck(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const ownerSessionId = await requireOwnedCaseId(caseId);
  const item = await prisma.case.findFirst({
    where: { id: caseId, ownerSessionId },
    select: {
      intakeResponses: { select: { questionKey: true, answer: true } },
      evidenceFiles: {
        select: {
          documentType: true,
          processingStatus: true,
          processingWarning: true,
          facts: {
            select: {
              id: true,
              evidenceFileId: true,
              factType: true,
              candidateValue: true,
              correctedValue: true,
              verificationStatus: true,
            },
          },
        },
      },
      events: { select: { eventDate: true, evidenceLinks: { select: { id: true } } } },
    },
  });
  if (!item) throw new Error("Case not found.");
  const allFacts = item.evidenceFiles.flatMap((file) => file.facts) as TimelineFact[];
  const reviewedFacts = allFacts.filter((fact) =>
    ["CONFIRMED", "CORRECTED", "USER_STATED"].includes(fact.verificationStatus),
  );
  const results = evaluateNuruChecks({
    responses: item.intakeResponses,
    facts: reviewedFacts,
    candidateCount: allFacts.filter((fact) => fact.verificationStatus === "CANDIDATE").length,
    evidence: item.evidenceFiles,
    events: item.events,
  });
  await prisma.$transaction(async (tx) => {
    await tx.nuruCheck.deleteMany({ where: { caseId } });
    if (results.length) {
      await tx.nuruCheck.createMany({ data: results.map((result) => ({ caseId, ...result })) });
    }
    await tx.case.update({
      where: { id: caseId },
      data: { stage: CaseStage.NURU_CHECK, progress: 70 },
    });
  });
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}/nuru-check?checked=1`);
}

export async function resolveNuruCheck(formData: FormData) {
  const caseId = objectIdSchema.parse(formData.get("caseId"));
  const checkId = objectIdSchema.parse(formData.get("checkId"));
  const ownerSessionId = await requireOwnedCaseId(caseId);
  const check = await prisma.nuruCheck.findFirst({
    where: { id: checkId, caseId, case: { ownerSessionId } },
    select: { id: true },
  });
  if (!check) throw new Error("Nuru Check item not found.");
  await prisma.nuruCheck.update({ where: { id: checkId }, data: { status: "RESOLVED" } });
  revalidatePath(`/cases/${caseId}/nuru-check`);
  redirect(`/cases/${caseId}/nuru-check?resolved=1#check-${checkId}`);
}
