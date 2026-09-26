export type ActionPathCheck = {
  severity: "INFO" | "ATTENTION" | "BLOCKING";
  status: string;
};

export type ActionPathStep = {
  id: string;
  title: string;
  description: string;
  status: "DO_NOW" | "NEXT" | "OPTION";
  sourceKey?: "EMPLOYMENT_ACT" | "LABOUR_DISPUTES" | "ELRC";
};

export const legalSourceSeeds = {
  EMPLOYMENT_ACT: {
    title: "Employment Act, 2007",
    issuingBody: "Kenya Law",
    canonicalUrl: "https://new.kenyalaw.org/akn/ke/act/2007/11",
    provision: "Sections 17–18",
    explanation:
      "Sections 17 and 18 set out rules on paying wages and when wages become due. Check the current official text before relying on it.",
  },
  LABOUR_DISPUTES: {
    title: "Handling of Labour Disputes",
    issuingBody: "State Department for Labour and Skills Development",
    canonicalUrl: "https://www.labour.go.ke/handling-labour-disputes",
    provision: "Individual complaints and conciliation",
    explanation:
      "The State Department describes reporting an individual complaint to the area Labour Officer and the conciliation process.",
  },
  ELRC: {
    title: "Employment and Labour Relations Court",
    issuingBody: "The Judiciary of Kenya",
    canonicalUrl: "https://judiciary.go.ke/employment-and-labour-relations-court/",
    provision: "Jurisdiction and procedure overview",
    explanation:
      "The Judiciary describes the Court's employment-dispute jurisdiction. Court action should be considered only after current procedure and professional advice are checked.",
  },
} as const;

function answerText(
  responses: Array<{ questionKey: string; answer: unknown }>,
  questionKey: string,
  field: string,
) {
  const answer = responses.find((response) => response.questionKey === questionKey)?.answer;
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return "";
  const value = (answer as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

export function buildActionPath(input: {
  checks: ActionPathCheck[];
  responses: Array<{ questionKey: string; answer: unknown }>;
  evidenceCount: number;
  eventCount: number;
}) {
  const open = input.checks.filter((check) => check.status === "OPEN");
  const blockingCount = open.filter((check) => check.severity === "BLOCKING").length;
  const attentionCount = open.filter((check) => check.severity === "ATTENTION").length;
  const raisedWithEmployer = answerText(
    input.responses,
    "intake.communications",
    "raisedWithEmployer",
  );
  const steps: ActionPathStep[] = [];

  if (blockingCount || attentionCount) {
    steps.push({
      id: "resolve-gaps",
      title: "Resolve the open case gaps",
      description: `${blockingCount} blocking and ${attentionCount} attention item${blockingCount + attentionCount === 1 ? "" : "s"} remain. Return to Nuru Check, correct the underlying record, then run the checks again.`,
      status: "DO_NOW",
    });
  }

  steps.push({
    id: "preserve-records",
    title: "Preserve the case record",
    description: `Keep the reviewed timeline and ${input.evidenceCount} evidence file${input.evidenceCount === 1 ? "" : "s"} together. Do not alter originals; use the CasePack as an organised index.`,
    status: blockingCount ? "NEXT" : "DO_NOW",
  });

  if (raisedWithEmployer !== "Yes") {
    steps.push({
      id: "written-request",
      title: "Consider a clear written payment request",
      description:
        "If it is safe and appropriate, record the amount claimed, pay period, requested response date and how the message was delivered. Keep a copy and proof of delivery.",
      status: blockingCount ? "NEXT" : "DO_NOW",
      sourceKey: "EMPLOYMENT_ACT",
    });
  }

  steps.push({
    id: "labour-officer",
    title: "Check the Labour Officer complaint route",
    description:
      "Use the official State Department guidance to confirm where and how an individual complaint is reported. Bring the CasePack and ask what current documents or forms are required.",
    status: "NEXT",
    sourceKey: "LABOUR_DISPUTES",
  });
  steps.push({
    id: "qualified-review",
    title: "Get qualified review before court action",
    description:
      "A lawyer, legal-aid provider, union representative or Labour Officer can assess the facts, deadlines, forum and remedies. KesiNuru does not decide whether a claim will succeed.",
    status: "OPTION",
    sourceKey: "ELRC",
  });

  return {
    readyForCasePack: blockingCount === 0 && input.eventCount > 0,
    blockingCount,
    attentionCount,
    steps,
  };
}
