import { answerMap, factNormalizedValue, factValue, type TimelineFact } from "@/lib/timeline";

export type NuruCheckResult = {
  checkType: string;
  severity: "INFO" | "ATTENTION" | "BLOCKING";
  description: string;
};

type CheckInput = {
  responses: Array<{ questionKey: string; answer: unknown }>;
  facts: TimelineFact[];
  candidateCount: number;
  evidence: Array<{ documentType: string }>;
  events: Array<{ eventDate: Date | null; evidenceLinks: unknown[] }>;
};

function answerText(
  answers: Map<string, Record<string, unknown>>,
  question: string,
  field: string,
) {
  const value = answers.get(question)?.[field];
  return typeof value === "string" ? value.trim() : "";
}

export function evaluateNuruChecks(input: CheckInput): NuruCheckResult[] {
  const checks: NuruCheckResult[] = [];
  const answers = answerMap(input.responses);
  const types = new Set(input.facts.map((fact) => fact.factType));

  if (!input.evidence.length) {
    checks.push({
      checkType: "NO_EVIDENCE",
      severity: "BLOCKING",
      description:
        "No supporting evidence has been uploaded. Add a document or clearly label the case as user-stated only.",
    });
  }
  if (input.candidateCount > 0) {
    checks.push({
      checkType: "UNREVIEWED_FACTS",
      severity: "BLOCKING",
      description: `${input.candidateCount} extracted fact${input.candidateCount === 1 ? " is" : "s are"} still awaiting confirmation, correction or rejection.`,
    });
  }
  if (!input.events.length) {
    checks.push({
      checkType: "EMPTY_TIMELINE",
      severity: "BLOCKING",
      description:
        "The case has no timeline events. Generate or add at least one event before preparing the CasePack.",
    });
  } else if (!input.events.some((event) => event.eventDate)) {
    checks.push({
      checkType: "MISSING_EXACT_DATE",
      severity: "ATTENTION",
      description:
        "No timeline event has an exact date. Confirm at least one date or keep the uncertainty visible.",
    });
  }

  const employerFromIntake = answerText(answers, "intake.employer", "employerName");
  if (!employerFromIntake && !types.has("EMPLOYER_NAME")) {
    checks.push({
      checkType: "MISSING_EMPLOYER",
      severity: "ATTENTION",
      description: "The employer or organisation name is missing.",
    });
  }

  const amountOwed = answerText(answers, "intake.issue", "amountOwed");
  const outstandingFacts = input.facts.filter((fact) => fact.factType === "OUTSTANDING_AMOUNT");
  if (!amountOwed && outstandingFacts.length === 0) {
    checks.push({
      checkType: "MISSING_OUTSTANDING_AMOUNT",
      severity: "ATTENTION",
      description: "The amount allegedly outstanding has not been recorded or verified.",
    });
  }
  if (amountOwed && outstandingFacts.length) {
    const documented = Number(factNormalizedValue(outstandingFacts[0]).replaceAll(",", ""));
    const stated = Number(amountOwed.replaceAll(",", ""));
    if (Number.isFinite(documented) && Number.isFinite(stated) && documented !== stated) {
      checks.push({
        checkType: "OUTSTANDING_AMOUNT_MISMATCH",
        severity: "ATTENTION",
        description: `The user-stated amount (${amountOwed}) differs from the evidence-supported amount (${factValue(outstandingFacts[0])}). Review the discrepancy.`,
      });
    }
  }

  const hasPaymentEvidence = input.evidence.some((item) => /pay|payment/i.test(item.documentType));
  if (!hasPaymentEvidence && !types.has("AMOUNT_PAID") && !types.has("OUTSTANDING_AMOUNT")) {
    checks.push({
      checkType: "MISSING_PAYMENT_EVIDENCE",
      severity: "ATTENTION",
      description: "No payment record, payslip or verified payment amount supports the wage issue.",
    });
  }

  const raised = answerText(answers, "intake.communications", "raisedWithEmployer");
  const hasCommunicationEvidence = input.evidence.some((item) =>
    /message|email|letter/i.test(item.documentType),
  );
  if (raised === "Yes" && !hasCommunicationEvidence) {
    checks.push({
      checkType: "MISSING_COMMUNICATION_EVIDENCE",
      severity: "INFO",
      description:
        "The issue was reportedly raised with the employer, but no message, email or letter is attached.",
    });
  }

  const unlinkedCount = input.events.filter((event) => event.evidenceLinks.length === 0).length;
  if (unlinkedCount > 0) {
    checks.push({
      checkType: "UNLINKED_EVENTS",
      severity: "INFO",
      description: `${unlinkedCount} timeline event${unlinkedCount === 1 ? " is" : "s are"} based only on the user's account and should remain labelled user-stated.`,
    });
  }

  return checks;
}
