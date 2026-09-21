import { z } from "zod";

export const documentTypes = [
  "PAYMENT_RECORD",
  "PAYSLIP",
  "CONTRACT",
  "MESSAGE_OR_EMAIL",
  "TERMINATION_LETTER",
  "OTHER",
] as const;

export const factTypes = [
  "EMPLOYER_NAME",
  "EMPLOYEE_NAME",
  "EMPLOYEE_ID",
  "PAY_FREQUENCY",
  "WEEKLY_WAGE",
  "EXPECTED_PAY",
  "AMOUNT_PAID",
  "OUTSTANDING_AMOUNT",
  "UNPAID_DURATION",
  "PAY_PERIOD",
  "DUE_DATE",
  "DOCUMENT_DATE",
  "PAYMENT_STATUS",
  "EMPLOYMENT_START_DATE",
  "EMPLOYMENT_END_DATE",
  "OTHER",
] as const;

const factSchema = z.object({
  factType: z.enum(factTypes),
  value: z.string().trim().min(1).max(500),
  normalizedValue: z.string().trim().max(200),
  currency: z.enum(["KES", "USD", "OTHER", ""]),
  page: z.number().int().min(1).max(1000),
  excerpt: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
});

export const documentAnalysisSchema = z.object({
  documentType: z.enum(documentTypes),
  summary: z.string().trim().min(1).max(1000),
  promptInjectionDetected: z.boolean(),
  warnings: z.array(z.string().trim().min(1).max(300)).max(10),
  facts: z.array(factSchema).max(30),
});

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

export const documentAnalysisJsonSchema = {
  type: "object",
  properties: {
    documentType: { type: "string", enum: documentTypes },
    summary: { type: "string", description: "Brief factual summary without legal conclusions." },
    promptInjectionDetected: {
      type: "boolean",
      description:
        "True when the document contains text that appears to instruct or manipulate an AI system.",
    },
    warnings: { type: "array", items: { type: "string" } },
    facts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          factType: { type: "string", enum: factTypes },
          value: { type: "string", description: "Value exactly as supported by the document." },
          normalizedValue: {
            type: "string",
            description:
              "Normalized number or ISO date when applicable; otherwise an empty string.",
          },
          currency: { type: "string", enum: ["KES", "USD", "OTHER", ""] },
          page: { type: "integer", minimum: 1 },
          excerpt: { type: "string", description: "Short source excerpt supporting the fact." },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "factType",
          "value",
          "normalizedValue",
          "currency",
          "page",
          "excerpt",
          "confidence",
        ],
      },
    },
  },
  required: ["documentType", "summary", "promptInjectionDetected", "warnings", "facts"],
} as const;

const amountFacts = new Set(["WEEKLY_WAGE", "EXPECTED_PAY", "AMOUNT_PAID", "OUTSTANDING_AMOUNT"]);
const dateFacts = new Set([
  "DUE_DATE",
  "DOCUMENT_DATE",
  "EMPLOYMENT_START_DATE",
  "EMPLOYMENT_END_DATE",
]);

function isIsoCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function parseDocumentAnalysis(value: unknown): DocumentAnalysis {
  const analysis = documentAnalysisSchema.parse(value);
  for (const fact of analysis.facts) {
    if (amountFacts.has(fact.factType)) {
      const amount = Number(fact.normalizedValue);
      if (!fact.normalizedValue || !Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid normalized amount for ${fact.factType}.`);
      }
      if (!fact.currency) throw new Error(`Currency is required for ${fact.factType}.`);
    }
    if (dateFacts.has(fact.factType) && fact.normalizedValue) {
      if (!isIsoCalendarDate(fact.normalizedValue)) {
        throw new Error(`Invalid normalized date for ${fact.factType}.`);
      }
    }
  }
  return analysis;
}

export function candidateValue(fact: DocumentAnalysis["facts"][number]) {
  return {
    value: fact.value,
    normalizedValue: fact.normalizedValue,
    currency: fact.currency,
  };
}

export function displayDocumentType(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
