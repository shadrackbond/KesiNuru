import { describe, expect, it } from "vitest";
import { buildCasePack } from "@/lib/casepack";

const baseFact = {
  evidenceFileId: "evidence-1",
  correctedValue: null,
  page: 1,
  excerpt: "Payment record excerpt",
  confidence: 0.98,
};

describe("CasePack", () => {
  it("includes reviewed facts and excludes candidates and rejected facts", () => {
    const pack = buildCasePack({
      caseRecord: {
        id: "case-1",
        title: "Kazi Hub unpaid wages",
        category: "UNPAID_WAGES",
        jurisdiction: "Kenya",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
        updatedAt: new Date("2026-09-24T00:00:00.000Z"),
      },
      responses: [
        {
          questionKey: "intake.employer",
          answer: { employerName: "Kazi Hub" },
          verificationStatus: "USER_STATED",
        },
      ],
      evidence: [
        {
          id: "evidence-1",
          filename: "kazi-hub-payment.pdf",
          documentType: "Payment Record",
          mimeType: "application/pdf",
          sizeBytes: 1200,
          processingStatus: "READY",
          uploadedAt: new Date("2026-09-20T00:00:00.000Z"),
          facts: [
            {
              ...baseFact,
              id: "confirmed",
              factType: "WEEKLY_WAGE",
              candidateValue: { value: "KES 8,000", normalizedValue: "8000" },
              verificationStatus: "CONFIRMED",
            },
            {
              ...baseFact,
              id: "corrected",
              factType: "OUTSTANDING_AMOUNT",
              candidateValue: { value: "KES 15,000" },
              correctedValue: { value: "KES 16,000", normalizedValue: "16000" },
              verificationStatus: "CORRECTED",
            },
            {
              ...baseFact,
              id: "candidate",
              factType: "PAY_PERIOD",
              candidateValue: { value: "Two weeks" },
              verificationStatus: "CANDIDATE",
            },
            {
              ...baseFact,
              id: "rejected",
              factType: "AMOUNT_PAID",
              candidateValue: { value: "KES 1" },
              verificationStatus: "REJECTED",
            },
          ],
        },
      ],
      events: [],
      checks: [],
      references: [],
      generatedAt: new Date("2026-09-25T00:00:00.000Z"),
    });
    expect(pack.reviewedFacts.map((fact) => fact.id)).toEqual(["confirmed", "corrected"]);
    expect(pack.reviewedFacts.map((fact) => fact.value)).toContain("KES 16,000");
    expect(pack.summary.employer).toBe("Kazi Hub");
  });

  it("exports evidence metadata without raw file content", () => {
    const source = buildCasePack.toString();
    expect(source).not.toContain("file.content");
    expect(source).not.toContain("evidence.content");
  });
});
