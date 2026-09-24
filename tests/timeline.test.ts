import { describe, expect, it } from "vitest";
import { buildTimelineSeeds, type TimelineFact } from "@/lib/timeline";

const responses = [
  { questionKey: "intake.employment", answer: { jobTitle: "Developer", startDate: "2026-08-01" } },
  { questionKey: "intake.issue", answer: { issueSummary: "Two weeks of wages were not paid." } },
  { questionKey: "intake.dates", answer: { issueStartDate: "2026-09-01" } },
];

const facts: TimelineFact[] = [
  {
    id: "fact-wage",
    evidenceFileId: "evidence-1",
    factType: "WEEKLY_WAGE",
    candidateValue: { value: "KES 8,000", normalizedValue: "8000" },
    correctedValue: null,
    verificationStatus: "CONFIRMED",
  },
  {
    id: "fact-outstanding",
    evidenceFileId: "evidence-1",
    factType: "OUTSTANDING_AMOUNT",
    candidateValue: { value: "KES 16,000", normalizedValue: "16000" },
    correctedValue: null,
    verificationStatus: "CONFIRMED",
  },
  {
    id: "fact-duration",
    evidenceFileId: "evidence-1",
    factType: "UNPAID_DURATION",
    candidateValue: { value: "Two weeks" },
    correctedValue: null,
    verificationStatus: "CONFIRMED",
  },
];

describe("timeline generation", () => {
  it("builds an evidence-linked payment event for the Kazi Hub scenario", () => {
    const timeline = buildTimelineSeeds(responses, facts);
    const payment = timeline.find((event) => event.eventType === "PAYMENT_DISPUTE");
    expect(payment?.description).toContain("KES 8,000");
    expect(payment?.description).toContain("KES 16,000");
    expect(payment?.factIds).toEqual(["fact-wage", "fact-outstanding", "fact-duration"]);
    expect(payment?.verificationStatus).toBe("CONFIRMED");
  });

  it("keeps intake-derived events labelled as user-stated", () => {
    const timeline = buildTimelineSeeds(responses, facts);
    expect(timeline.find((event) => event.eventType === "ISSUE_REPORTED")?.verificationStatus).toBe(
      "USER_STATED",
    );
  });
});
