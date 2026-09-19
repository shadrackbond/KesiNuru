import { describe, expect, it } from "vitest";
import { isEligibleAnswer, normaliseStepAnswer } from "@/lib/intake";

describe("intake validation", () => {
  it("requires every eligibility condition", () => {
    expect(
      isEligibleAnswer({
        ageConfirmed: "yes",
        jurisdiction: "Kenya",
        emergency: "no",
        processingConsent: "yes",
      }),
    ).toBe(true);
    expect(
      isEligibleAnswer({
        ageConfirmed: "yes",
        jurisdiction: "Kenya",
        emergency: "yes",
        processingConsent: "yes",
      }),
    ).toBe(false);
  });

  it("normalises and validates an intake step", () => {
    const data = new FormData();
    data.set("jobTitle", "Software developer");
    data.set("startDate", "2025-01-10");
    data.set("employmentStatus", "Still employed");
    expect(normaliseStepAnswer(data, 0)).toEqual({
      questionKey: "intake.employment",
      answer: {
        jobTitle: "Software developer",
        startDate: "2025-01-10",
        employmentStatus: "Still employed",
      },
    });
  });
});
