import { z } from "zod";
import { factNormalizedValue, factValue, type TimelineFact } from "@/lib/timeline";

const reviewedStatuses = new Set(["CONFIRMED", "CORRECTED", "USER_STATED"]);

type CasePackInput = {
  caseRecord: {
    id: string;
    title: string;
    category: string;
    jurisdiction: string;
    createdAt: Date;
    updatedAt: Date;
  };
  responses: Array<{ questionKey: string; answer: unknown; verificationStatus: string }>;
  evidence: Array<{
    id: string;
    filename: string;
    documentType: string;
    mimeType: string;
    sizeBytes: number;
    processingStatus: string;
    uploadedAt: Date;
    facts: Array<
      TimelineFact & { page: number | null; excerpt: string | null; confidence: number | null }
    >;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    eventDate: Date | null;
    approximateDate: string | null;
    description: string;
    verificationStatus: string;
    evidenceLinks: Array<{
      relationship: string;
      evidenceFileId: string;
      extractedFactId: string | null;
    }>;
  }>;
  checks: Array<{
    checkType: string;
    severity: string;
    description: string;
    status: string;
  }>;
  references: Array<{
    explanation: string;
    reviewRequired: boolean;
    legalSource: {
      title: string;
      issuingBody: string;
      canonicalUrl: string;
      provision: string | null;
      verifiedAt: Date;
    };
  }>;
  generatedAt?: Date;
};

function answerField(
  responses: CasePackInput["responses"],
  key: string,
  field: string,
) {
  const value = responses.find((response) => response.questionKey === key)?.answer;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const fieldValue = (value as Record<string, unknown>)[field];
  return typeof fieldValue === "string" ? fieldValue.trim() : "";
}

export function buildCasePack(input: CasePackInput) {
  const evidenceNames = new Map(input.evidence.map((file) => [file.id, file.filename]));
  const reviewedFacts = input.evidence.flatMap((file) =>
    file.facts
      .filter((fact) => reviewedStatuses.has(fact.verificationStatus))
      .map((fact) => ({
        id: fact.id,
        factType: fact.factType,
        value: factValue(fact),
        normalizedValue: factNormalizedValue(fact),
        verificationStatus: fact.verificationStatus,
        evidenceFileId: file.id,
        evidenceFilename: file.filename,
        page: fact.page,
        excerpt: fact.excerpt,
        confidence: fact.confidence,
      })),
  );

  return {
    schemaVersion: "1.0",
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    case: {
      id: input.caseRecord.id,
      title: input.caseRecord.title,
      category: input.caseRecord.category,
      jurisdiction: input.caseRecord.jurisdiction,
      createdAt: input.caseRecord.createdAt.toISOString(),
      updatedAt: input.caseRecord.updatedAt.toISOString(),
    },
    summary: {
      employer: answerField(input.responses, "intake.employer", "employerName"),
      issue: answerField(input.responses, "intake.issue", "issueSummary"),
      amountClaimed: answerField(input.responses, "intake.issue", "amountOwed"),
      desiredOutcome: answerField(input.responses, "intake.outcome", "desiredOutcome"),
    },
    reviewedFacts,
    timeline: input.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      eventDate: event.eventDate?.toISOString() ?? null,
      approximateDate: event.approximateDate,
      description: event.description,
      verificationStatus: event.verificationStatus,
      evidenceLinks: event.evidenceLinks.map((link) => ({
        evidenceFileId: link.evidenceFileId,
        evidenceFilename: evidenceNames.get(link.evidenceFileId) ?? "Unknown evidence file",
        extractedFactId: link.extractedFactId,
        relationship: link.relationship,
      })),
    })),
    evidenceIndex: input.evidence.map((file) => ({
      id: file.id,
      filename: file.filename,
      documentType: file.documentType,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      processingStatus: file.processingStatus,
      uploadedAt: file.uploadedAt.toISOString(),
      reviewedFactCount: file.facts.filter((fact) => reviewedStatuses.has(fact.verificationStatus))
        .length,
    })),
    nuruChecks: input.checks.map((check) => ({ ...check })),
    actionSources: input.references.map((reference) => ({
      title: reference.legalSource.title,
      issuingBody: reference.legalSource.issuingBody,
      url: reference.legalSource.canonicalUrl,
      provision: reference.legalSource.provision,
      explanation: reference.explanation,
      reviewRequired: reference.reviewRequired,
      verifiedAt: reference.legalSource.verifiedAt.toISOString(),
    })),
    disclaimer:
      "KesiNuru provides legal information and case-organisation support. It is not a law firm, does not provide legal representation, and this CasePack is not legal advice. Verify current law and procedure with an official source or qualified professional.",
  };
}

export type CasePackContent = ReturnType<typeof buildCasePack>;

export const casePackContentSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  case: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    jurisdiction: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  summary: z.object({
    employer: z.string(),
    issue: z.string(),
    amountClaimed: z.string(),
    desiredOutcome: z.string(),
  }),
  reviewedFacts: z.array(
    z.object({
      id: z.string(),
      factType: z.string(),
      value: z.string(),
      normalizedValue: z.string(),
      verificationStatus: z.string(),
      evidenceFileId: z.string(),
      evidenceFilename: z.string(),
      page: z.number().nullable(),
      excerpt: z.string().nullable(),
      confidence: z.number().nullable(),
    }),
  ),
  timeline: z.array(
    z.object({
      id: z.string(),
      eventType: z.string(),
      eventDate: z.string().nullable(),
      approximateDate: z.string().nullable(),
      description: z.string(),
      verificationStatus: z.string(),
      evidenceLinks: z.array(
        z.object({
          evidenceFileId: z.string(),
          evidenceFilename: z.string(),
          extractedFactId: z.string().nullable(),
          relationship: z.string(),
        }),
      ),
    }),
  ),
  evidenceIndex: z.array(
    z.object({
      id: z.string(),
      filename: z.string(),
      documentType: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number(),
      processingStatus: z.string(),
      uploadedAt: z.string(),
      reviewedFactCount: z.number(),
    }),
  ),
  nuruChecks: z.array(
    z.object({
      checkType: z.string(),
      severity: z.string(),
      description: z.string(),
      status: z.string(),
    }),
  ),
  actionSources: z.array(
    z.object({
      title: z.string(),
      issuingBody: z.string(),
      url: z.string(),
      provision: z.string().nullable(),
      explanation: z.string(),
      reviewRequired: z.boolean(),
      verifiedAt: z.string(),
    }),
  ),
  disclaimer: z.string(),
});
