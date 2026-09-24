import { describe, expect, it } from "vitest";
import { evaluateNuruChecks } from "@/lib/nuru-check";

describe("Nuru Check", () => {
  it("reports blocking gaps in an incomplete case", () => {
    const checks = evaluateNuruChecks({
      responses: [],
      facts: [],
      candidateCount: 2,
      evidence: [],
      events: [],
    });
    expect(
      checks.filter((check) => check.severity === "BLOCKING").map((check) => check.checkType),
    ).toEqual(expect.arrayContaining(["NO_EVIDENCE", "UNREVIEWED_FACTS", "EMPTY_TIMELINE"]));
  });

  it("does not flag the core Kazi Hub payment record as unsupported", () => {
    const checks = evaluateNuruChecks({
      responses: [
        { questionKey: "intake.employer", answer: { employerName: "Kazi Hub" } },
        { questionKey: "intake.issue", answer: { amountOwed: "16000" } },
      ],
      facts: [
        {
          id: "fact-1",
          evidenceFileId: "evidence-1",
          factType: "OUTSTANDING_AMOUNT",
          candidateValue: { value: "KES 16,000", normalizedValue: "16000" },
          correctedValue: null,
          verificationStatus: "CONFIRMED",
        },
      ],
      candidateCount: 0,
      evidence: [{ documentType: "Payment Record" }],
      events: [{ eventDate: new Date("2026-09-01T00:00:00.000Z"), evidenceLinks: [{}] }],
    });
    expect(checks.map((check) => check.checkType)).not.toContain("MISSING_PAYMENT_EVIDENCE");
    expect(checks.map((check) => check.checkType)).not.toContain("OUTSTANDING_AMOUNT_MISMATCH");
    expect(checks.filter((check) => check.severity === "BLOCKING")).toHaveLength(0);
  });
});
