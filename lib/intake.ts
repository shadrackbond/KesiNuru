import { z } from "zod";

export const intakeSteps = [
  {
    key: "employment",
    title: "Employment details",
    description: "Tell us about the work arrangement.",
    fields: [
      { name: "jobTitle", label: "Job title or type of work", type: "text", required: true },
      { name: "startDate", label: "Employment start date", type: "date", required: false },
      {
        name: "employmentStatus",
        label: "Employment status",
        type: "select",
        required: true,
        options: ["Still employed", "Employment ended", "I do not know"],
      },
    ],
  },
  {
    key: "employer",
    title: "Employer details",
    description: "Use only the details needed to organise this case.",
    fields: [
      {
        name: "employerName",
        label: "Employer or organisation name",
        type: "text",
        required: true,
      },
      { name: "workLocation", label: "Town or county of work", type: "text", required: false },
      {
        name: "contactKnown",
        label: "Do you have an employer contact?",
        type: "select",
        required: true,
        options: ["Yes", "No", "I do not know"],
      },
    ],
  },
  {
    key: "pay",
    title: "Pay arrangement",
    description: "Approximate figures are acceptable and will be labelled as user-stated.",
    fields: [
      { name: "payAmount", label: "Usual pay amount in KES", type: "number", required: false },
      {
        name: "payFrequency",
        label: "How often were you paid?",
        type: "select",
        required: true,
        options: ["Daily", "Weekly", "Monthly", "Other", "I do not know"],
      },
      {
        name: "paymentMethod",
        label: "Usual payment method",
        type: "select",
        required: true,
        options: ["Bank", "Mobile money", "Cash", "Mixed", "I do not know"],
      },
    ],
  },
  {
    key: "issue",
    title: "What happened",
    description: "Describe the main issue in your own words.",
    fields: [
      { name: "issueSummary", label: "Issue summary", type: "textarea", required: true },
      {
        name: "amountOwed",
        label: "Estimated amount owed in KES",
        type: "number",
        required: false,
      },
      {
        name: "amountUnknown",
        label: "I do not know the amount",
        type: "checkbox",
        required: false,
      },
    ],
  },
  {
    key: "dates",
    title: "Important dates",
    description: "Dates help build a reliable timeline later.",
    fields: [
      { name: "issueStartDate", label: "When did the issue begin?", type: "date", required: false },
      {
        name: "lastWorkedDate",
        label: "Last day worked, if applicable",
        type: "date",
        required: false,
      },
      {
        name: "datesUnknown",
        label: "I do not know the exact dates",
        type: "checkbox",
        required: false,
      },
    ],
  },
  {
    key: "communications",
    title: "Communication",
    description: "Record whether you raised the issue and what followed.",
    fields: [
      {
        name: "raisedWithEmployer",
        label: "Did you raise the issue with the employer?",
        type: "select",
        required: true,
        options: ["Yes", "No", "I do not know"],
      },
      {
        name: "responseSummary",
        label: "What response did you receive?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    key: "documents",
    title: "Documents available",
    description: "Select what you may be able to upload next.",
    fields: [
      {
        name: "contract",
        label: "Employment contract or appointment letter",
        type: "checkbox",
        required: false,
      },
      { name: "payslips", label: "Payslips or payment records", type: "checkbox", required: false },
      { name: "messages", label: "Messages, emails or letters", type: "checkbox", required: false },
      { name: "noDocuments", label: "I do not have documents", type: "checkbox", required: false },
    ],
  },
  {
    key: "outcome",
    title: "What you need",
    description: "This does not select a legal remedy; it helps organise the CasePack.",
    fields: [
      {
        name: "desiredOutcome",
        label: "What would you like help organising?",
        type: "textarea",
        required: true,
      },
      {
        name: "additionalNotes",
        label: "Anything else we should record?",
        type: "textarea",
        required: false,
      },
    ],
  },
] as const;

export const eligibilitySchema = z.object({
  ageConfirmed: z.literal("yes"),
  jurisdiction: z.literal("Kenya"),
  emergency: z.literal("no"),
  processingConsent: z.literal("yes"),
});

export function isEligibleAnswer(value: unknown) {
  return eligibilitySchema.safeParse(value).success;
}

export function normaliseStepAnswer(formData: FormData, stepIndex: number) {
  const step = intakeSteps[stepIndex];
  if (!step) throw new Error("Invalid intake step.");
  const answer: Record<string, string | boolean> = {};
  for (const field of step.fields) {
    const value = formData.get(field.name);
    if (field.type === "checkbox") {
      answer[field.name] = value === "on";
      continue;
    }
    const text = typeof value === "string" ? value.trim() : "";
    if (field.required && !text) throw new Error(`${field.label} is required.`);
    if (text.length > 2000) throw new Error(`${field.label} is too long.`);
    if (field.type === "number" && text && (!Number.isFinite(Number(text)) || Number(text) < 0)) {
      throw new Error(`${field.label} must be a valid positive number.`);
    }
    answer[field.name] = text;
  }
  return { questionKey: `intake.${step.key}`, answer };
}
