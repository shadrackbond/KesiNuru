import { describe, expect, it } from "vitest";
import { buildActionPath } from "@/lib/action-path";

describe("Action Path", () => {
  it("puts unresolved blocking gaps first", () => {
    const path = buildActionPath({
      checks: [
        { severity: "BLOCKING", status: "OPEN" },
        { severity: "ATTENTION", status: "OPEN" },
      ],
      responses: [],
      evidenceCount: 1,
      eventCount: 1,
    });
    expect(path.readyForCasePack).toBe(false);
    expect(path.steps[0]?.id).toBe("resolve-gaps");
    expect(path.blockingCount).toBe(1);
  });

  it("uses cautious options without predicting a legal result", () => {
    const path = buildActionPath({
      checks: [],
      responses: [
        {
          questionKey: "intake.communications",
          answer: { raisedWithEmployer: "Yes" },
        },
      ],
      evidenceCount: 2,
      eventCount: 2,
    });
    const text = path.steps.map((step) => `${step.title} ${step.description}`).join(" ");
    expect(path.readyForCasePack).toBe(true);
    expect(path.steps.map((step) => step.id)).not.toContain("written-request");
    expect(text.toLowerCase()).not.toMatch(/will win|guaranteed|entitled to damages/);
    expect(text).toContain("does not decide whether a claim will succeed");
  });
});
