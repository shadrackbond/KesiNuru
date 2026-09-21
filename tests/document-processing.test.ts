import { describe, expect, it } from "vitest";
import { parseDocumentAnalysis } from "@/lib/document-analysis";

const kaziHubAnalysis = {
  documentType: "PAYMENT_RECORD",
  summary: "Kazi Hub owes two weeks of unpaid wages.",
  promptInjectionDetected: false,
  warnings: [],
  facts: [
    {
      factType: "EMPLOYER_NAME",
      value: "Kazi Hub",
      normalizedValue: "",
      currency: "",
      page: 1,
      excerpt: "Employer: Kazi Hub",
      confidence: 0.99,
    },
    {
      factType: "WEEKLY_WAGE",
      value: "KES 8,000",
      normalizedValue: "8000",
      currency: "KES",
      page: 1,
      excerpt: "Weekly wage: KES 8,000",
      confidence: 0.98,
    },
    {
      factType: "OUTSTANDING_AMOUNT",
      value: "KES 16,000",
      normalizedValue: "16000",
      currency: "KES",
      page: 1,
      excerpt: "Outstanding amount: KES 16,000",
      confidence: 0.98,
    },
  ],
} as const;

describe("structured document analysis", () => {
  it("accepts the expected Kazi Hub payment facts", () => {
    const result = parseDocumentAnalysis(kaziHubAnalysis);
    expect(result.documentType).toBe("PAYMENT_RECORD");
    expect(result.facts.map((fact) => fact.normalizedValue)).toContain("8000");
    expect(result.facts.map((fact) => fact.normalizedValue)).toContain("16000");
  });

  it("rejects invalid normalized monetary amounts", () => {
    const invalid = JSON.parse(JSON.stringify(kaziHubAnalysis)) as {
      facts: Array<Record<string, unknown>>;
    };
    invalid.facts[1].normalizedValue = "-8000";
    expect(() => parseDocumentAnalysis(invalid)).toThrow(/Invalid normalized amount/);
  });

  it("rejects invalid normalized dates", () => {
    const invalid = JSON.parse(JSON.stringify(kaziHubAnalysis)) as {
      facts: Array<Record<string, unknown>>;
    };
    invalid.facts.push({
      factType: "DUE_DATE",
      value: "31 September 2026",
      normalizedValue: "2026-09-31",
      currency: "",
      page: 1,
      excerpt: "Due: 31 September 2026",
      confidence: 0.7,
    });
    expect(() => parseDocumentAnalysis(invalid)).toThrow(/Invalid normalized date/);
  });
});
