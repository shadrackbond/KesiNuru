import { describe, expect, it } from "vitest";
import { buildActionPath } from "@/lib/action-path";
import { buildCasePack } from "@/lib/casepack";
import { evaluateNuruChecks } from "@/lib/nuru-check";
import { buildTimelineSeeds, type TimelineFact } from "@/lib/timeline";

describe("intake-to-CasePack integration", () => {
  it("carries the reviewed Kazi Hub record through the complete workflow", () => {
    const responses = [
      { questionKey: "intake.employer", answer: { employerName: "Kazi Hub" } },
      {
        questionKey: "intake.issue",
        answer: { issueSummary: "Two weeks of wages were not paid.", amountOwed: "16000" },
      },
      { questionKey: "intake.dates", answer: { issueStartDate: "2026-09-01" } },
      { questionKey: "intake.communications", answer: { raisedWithEmployer: "Yes" } },
    ];
    const facts: TimelineFact[] = [
      {
        id: "wage",
        evidenceFileId: "evidence-1",
        factType: "WEEKLY_WAGE",
        candidateValue: { value: "KES 8,000", normalizedValue: "8000" },
        correctedValue: null,
        verificationStatus: "CONFIRMED",
      },
      {
        id: "outstanding",
        evidenceFileId: "evidence-1",
        factType: "OUTSTANDING_AMOUNT",
        candidateValue: { value: "KES 16,000", normalizedValue: "16000" },
        correctedValue: null,
        verificationStatus: "CONFIRMED",
      },
      {
        id: "due-date",
        evidenceFileId: "evidence-1",
        factType: "DUE_DATE",
        candidateValue: { value: "1 September 2026", normalizedValue: "2026-09-01" },
        correctedValue: null,
        verificationStatus: "CONFIRMED",
      },
    ];
    const seeds = buildTimelineSeeds(responses, facts);
    const events = seeds.map((seed, index) => ({
      id: `event-${index}`,
      eventType: seed.eventType,
      eventDate: seed.eventDate ? new Date(`${seed.eventDate}T00:00:00.000Z`) : null,
      approximateDate: seed.approximateDate,
      description: seed.description,
      verificationStatus: seed.verificationStatus,
      evidenceLinks: seed.factIds.map((factId) => ({
        relationship: "SUPPORTS",
        evidenceFileId: "evidence-1",
        extractedFactId: factId,
      })),
    }));
    const checks = evaluateNuruChecks({
      responses,
      facts,
      candidateCount: 0,
      evidence: [{ documentType: "Payment record", processingStatus: "READY" }],
      events: events.map((event) => ({
        eventDate: event.eventDate,
        evidenceLinks: event.evidenceLinks,
      })),
    });
    expect(checks.filter((check) => check.severity === "BLOCKING")).toHaveLength(0);
    const path = buildActionPath({
      checks: checks.map((check) => ({ ...check, status: "OPEN" })),
      responses,
      evidenceCount: 1,
      eventCount: events.length,
    });
    expect(path.readyForCasePack).toBe(true);

    const pack = buildCasePack({
      caseRecord: {
        id: "case-1",
        title: "Kazi Hub unpaid wages",
        category: "UNPAID_WAGES",
        jurisdiction: "Kenya",
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
        updatedAt: new Date("2026-09-25T00:00:00.000Z"),
      },
      responses: responses.map((response) => ({ ...response, verificationStatus: "USER_STATED" })),
      evidence: [
        {
          id: "evidence-1",
          filename: "kazi-hub-payment.pdf",
          documentType: "Payment record",
          mimeType: "application/pdf",
          sizeBytes: 2048,
          processingStatus: "READY",
          uploadedAt: new Date("2026-09-20T00:00:00.000Z"),
          facts: facts.map((fact) => ({ ...fact, page: 1, excerpt: "Supported", confidence: 0.98 })),
        },
      ],
      events,
      checks: checks.map((check) => ({ ...check, status: "OPEN" })),
      references: [],
      generatedAt: new Date("2026-09-26T00:00:00.000Z"),
    });
    expect(pack.reviewedFacts.map((fact) => fact.value)).toEqual(
      expect.arrayContaining(["KES 8,000", "KES 16,000"]),
    );
    expect(pack.timeline.some((event) => event.evidenceLinks.length > 0)).toBe(true);
    expect(pack.disclaimer).toContain("not legal advice");
  });
});
