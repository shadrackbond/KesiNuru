export type TimelineFact = {
  id: string;
  evidenceFileId: string;
  factType: string;
  candidateValue: unknown;
  correctedValue: unknown;
  verificationStatus: string;
};

export type TimelineSeed = {
  eventType: string;
  eventDate: string | null;
  approximateDate: string | null;
  description: string;
  verificationStatus: "CONFIRMED" | "CORRECTED" | "USER_STATED";
  factIds: string[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function textValue(value: unknown, key = "value") {
  const candidate = record(value)[key];
  return typeof candidate === "string" || typeof candidate === "number"
    ? String(candidate).trim()
    : "";
}

export function factValue(fact: TimelineFact) {
  return textValue(fact.correctedValue) || textValue(fact.candidateValue);
}

export function factNormalizedValue(fact: TimelineFact) {
  return (
    textValue(fact.correctedValue, "normalizedValue") ||
    textValue(fact.candidateValue, "normalizedValue") ||
    factValue(fact)
  );
}

export function answerMap(responses: Array<{ questionKey: string; answer: unknown }>) {
  return new Map(responses.map((response) => [response.questionKey, record(response.answer)]));
}

function answerText(
  answers: Map<string, Record<string, unknown>>,
  question: string,
  field: string,
) {
  const value = answers.get(question)?.[field];
  return typeof value === "string" ? value.trim() : "";
}

function isoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function verifiedStatus(facts: TimelineFact[]): TimelineSeed["verificationStatus"] {
  if (facts.some((fact) => fact.verificationStatus === "CORRECTED")) return "CORRECTED";
  if (facts.some((fact) => fact.verificationStatus === "USER_STATED")) return "USER_STATED";
  return "CONFIRMED";
}

export function buildTimelineSeeds(
  responses: Array<{ questionKey: string; answer: unknown }>,
  facts: TimelineFact[],
): TimelineSeed[] {
  const answers = answerMap(responses);
  const seeds: TimelineSeed[] = [];
  const employmentStart = answerText(answers, "intake.employment", "startDate");
  const jobTitle = answerText(answers, "intake.employment", "jobTitle");
  if (employmentStart) {
    seeds.push({
      eventType: "EMPLOYMENT_STARTED",
      eventDate: isoDate(employmentStart),
      approximateDate: isoDate(employmentStart) ? null : employmentStart,
      description: jobTitle ? `Employment began as ${jobTitle}.` : "Employment began.",
      verificationStatus: "USER_STATED",
      factIds: [],
    });
  }

  const issueStart = answerText(answers, "intake.dates", "issueStartDate");
  const issueSummary = answerText(answers, "intake.issue", "issueSummary");
  if (issueSummary) {
    seeds.push({
      eventType: "ISSUE_REPORTED",
      eventDate: isoDate(issueStart),
      approximateDate: issueStart && !isoDate(issueStart) ? issueStart : null,
      description: issueSummary,
      verificationStatus: "USER_STATED",
      factIds: [],
    });
  }

  const paymentTypes = new Set([
    "WEEKLY_WAGE",
    "EXPECTED_PAY",
    "AMOUNT_PAID",
    "OUTSTANDING_AMOUNT",
    "UNPAID_DURATION",
    "PAY_PERIOD",
    "PAYMENT_STATUS",
  ]);
  const paymentFacts = facts.filter((fact) => paymentTypes.has(fact.factType));
  if (paymentFacts.length) {
    const byType = new Map(paymentFacts.map((fact) => [fact.factType, factValue(fact)]));
    const details = [
      byType.get("WEEKLY_WAGE") ? `weekly wage ${byType.get("WEEKLY_WAGE")}` : "",
      byType.get("UNPAID_DURATION") ? `unpaid period ${byType.get("UNPAID_DURATION")}` : "",
      byType.get("AMOUNT_PAID") ? `amount paid ${byType.get("AMOUNT_PAID")}` : "",
      byType.get("OUTSTANDING_AMOUNT")
        ? `outstanding amount ${byType.get("OUTSTANDING_AMOUNT")}`
        : "",
    ].filter(Boolean);
    const dueDateFact = facts.find((fact) => fact.factType === "DUE_DATE");
    const eventDate = dueDateFact ? isoDate(factNormalizedValue(dueDateFact)) : isoDate(issueStart);
    seeds.push({
      eventType: "PAYMENT_DISPUTE",
      eventDate,
      approximateDate: eventDate ? null : byType.get("PAY_PERIOD") || "Date requires confirmation",
      description: details.length
        ? `Employment payment record: ${details.join(", ")}.`
        : "Employment payment issue recorded in the supporting evidence.",
      verificationStatus: verifiedStatus(paymentFacts),
      factIds: paymentFacts.map((fact) => fact.id),
    });
  }

  const raised = answerText(answers, "intake.communications", "raisedWithEmployer");
  const response = answerText(answers, "intake.communications", "responseSummary");
  if (raised === "Yes") {
    seeds.push({
      eventType: "EMPLOYER_CONTACTED",
      eventDate: null,
      approximateDate: "After the payment issue began",
      description: response
        ? `The issue was raised with the employer. Response: ${response}`
        : "The issue was raised with the employer; the response was not recorded.",
      verificationStatus: "USER_STATED",
      factIds: [],
    });
  }

  const endFacts = facts.filter((fact) => fact.factType === "EMPLOYMENT_END_DATE");
  const lastWorked = answerText(answers, "intake.dates", "lastWorkedDate");
  const endDate = endFacts[0] ? factNormalizedValue(endFacts[0]) : lastWorked;
  if (endDate) {
    seeds.push({
      eventType: "EMPLOYMENT_ENDED",
      eventDate: isoDate(endDate),
      approximateDate: isoDate(endDate) ? null : endDate,
      description: "Employment ended or the last worked date was recorded.",
      verificationStatus: endFacts.length ? verifiedStatus(endFacts) : "USER_STATED",
      factIds: endFacts.map((fact) => fact.id),
    });
  }

  return seeds.sort((left, right) => {
    if (!left.eventDate && !right.eventDate) return 0;
    if (!left.eventDate) return 1;
    if (!right.eventDate) return -1;
    return left.eventDate.localeCompare(right.eventDate);
  });
}
