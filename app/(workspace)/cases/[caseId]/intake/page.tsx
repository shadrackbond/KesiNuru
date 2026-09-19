import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { completeIntake, saveEligibility, saveIntakeStep } from "@/actions/intake";
import { getOwnedCase } from "@/lib/cases";
import { intakeSteps } from "@/lib/intake";
import { prisma } from "@/lib/prisma";

type Answer = Record<string, string | boolean>;

function answerRecord(value: unknown): Answer {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Answer) : {};
}

function Field({
  field,
  answer,
}: {
  field: (typeof intakeSteps)[number]["fields"][number];
  answer: Answer;
}) {
  const value = answer[field.name];
  if (field.type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-forest/15 p-4 text-sm font-semibold hover:bg-mint/30">
        <input
          className="mt-1 size-4 accent-forest"
          type="checkbox"
          name={field.name}
          defaultChecked={value === true}
        />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === "select" && "options" in field) {
    return (
      <label className="block text-sm font-bold">
        {field.label}
        <select
          className="field"
          name={field.name}
          required={field.required}
          defaultValue={typeof value === "string" ? value : ""}
        >
          <option value="" disabled>
            Select an answer
          </option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <label className="block text-sm font-bold">
        {field.label}
        <textarea
          className="field min-h-32 py-3"
          name={field.name}
          required={field.required}
          maxLength={2000}
          defaultValue={typeof value === "string" ? value : ""}
        />
      </label>
    );
  }
  return (
    <label className="block text-sm font-bold">
      {field.label}
      <input
        className="field"
        name={field.name}
        type={field.type}
        required={field.required}
        min={field.type === "number" ? 0 : undefined}
        step={field.type === "number" ? "0.01" : undefined}
        defaultValue={typeof value === "string" ? value : ""}
      />
    </label>
  );
}

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ step?: string; status?: string; error?: string }>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  if (!caseId) notFound();
  const item = await getOwnedCase(caseId);
  const responses = await prisma.intakeResponse.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
  });
  const responseMap = new Map(
    responses.map((response) => [response.questionKey, answerRecord(response.answer)]),
  );
  const eligibility = responseMap.get("eligibility") ?? {};
  const eligibilityPassed =
    eligibility.ageConfirmed === "yes" &&
    eligibility.jurisdiction === "Kenya" &&
    eligibility.emergency === "no" &&
    eligibility.processingConsent === "yes";
  const isReview = query.step === "review";
  const stepNumber = Math.min(
    Math.max(Number(query.step ?? (eligibilityPassed ? 1 : 0)) || 0, 0),
    intakeSteps.length,
  );
  const activeStep = stepNumber > 0 ? intakeSteps[stepNumber - 1] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        Back to case
      </Link>
      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Guided intake</p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">{item.title}</h1>
          <p className="mt-3 text-ink/55">
            Your answers save after every step and can be edited before evidence upload.
          </p>
        </div>
        {stepNumber > 0 && !isReview ? (
          <p className="text-sm font-bold text-forest">
            Step {stepNumber} of {intakeSteps.length}
          </p>
        ) : null}
      </div>
      {stepNumber > 0 && !isReview ? (
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-forest/10">
          <div
            className="h-full rounded-full bg-leaf transition-all"
            style={{ width: `${(stepNumber / intakeSteps.length) * 100}%` }}
          />
        </div>
      ) : null}
      {query.error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {query.error}
        </div>
      ) : null}

      {query.status === "paused" ? (
        <section className="surface mt-8 p-6 sm:p-8">
          <div className="flex gap-4">
            <AlertTriangle className="mt-1 size-6 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-2xl font-bold">The normal intake has been paused</h2>
              <p className="mt-3 leading-7 text-ink/60">
                KesiNuru currently supports adults organising Kenyan employment matters that are not
                emergencies. It cannot provide urgent or legal assistance. If anyone is in immediate
                danger, contact local emergency services or a qualified support organisation.
              </p>
              <Link href={`/cases/${caseId}/intake`} className="button-secondary mt-6">
                Review eligibility answers
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {!query.status && stepNumber === 0 && !isReview ? (
        <form action={saveEligibility} className="surface mt-8 space-y-6 p-6 sm:p-8">
          <input type="hidden" name="caseId" value={caseId} />
          <div className="flex gap-3 rounded-2xl bg-mint/50 p-4 text-sm leading-6 text-forest">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p>
              KesiNuru organises information; it does not determine legal validity, predict outcomes
              or replace a lawyer.
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-bold">Are you 18 years or older?</legend>
            <div className="mt-3 flex gap-5">
              <label>
                <input
                  className="mr-2 accent-forest"
                  type="radio"
                  name="ageConfirmed"
                  value="yes"
                  required
                  defaultChecked={eligibility.ageConfirmed === "yes"}
                />
                Yes
              </label>
              <label>
                <input
                  className="mr-2 accent-forest"
                  type="radio"
                  name="ageConfirmed"
                  value="no"
                  defaultChecked={eligibility.ageConfirmed === "no"}
                />
                No
              </label>
            </div>
          </fieldset>
          <label className="block text-sm font-bold">
            Where did the employment take place?
            <select
              className="field"
              name="jurisdiction"
              required
              defaultValue={
                typeof eligibility.jurisdiction === "string" ? eligibility.jurisdiction : ""
              }
            >
              <option value="" disabled>
                Select jurisdiction
              </option>
              <option value="Kenya">Kenya</option>
              <option value="Outside Kenya">Outside Kenya</option>
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-bold">
              Is anyone in immediate danger or requiring urgent emergency help?
            </legend>
            <div className="mt-3 flex gap-5">
              <label>
                <input
                  className="mr-2 accent-forest"
                  type="radio"
                  name="emergency"
                  value="no"
                  required
                  defaultChecked={eligibility.emergency === "no"}
                />
                No
              </label>
              <label>
                <input
                  className="mr-2 accent-forest"
                  type="radio"
                  name="emergency"
                  value="yes"
                  defaultChecked={eligibility.emergency === "yes"}
                />
                Yes
              </label>
            </div>
          </fieldset>
          <label className="flex items-start gap-3 rounded-2xl border border-forest/15 p-4 text-sm leading-6">
            <input
              className="mt-1 size-4 accent-forest"
              type="checkbox"
              name="processingConsent"
              value="yes"
              required
              defaultChecked={eligibility.processingConsent === "yes"}
            />
            <span>
              I consent to KesiNuru storing and processing the information I provide for this case.
            </span>
          </label>
          <div className="flex justify-end">
            <button className="button-primary" type="submit">
              Continue to intake
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      ) : null}

      {!query.status && activeStep && !isReview ? (
        <form action={saveIntakeStep} className="surface mt-8 space-y-6 p-6 sm:p-8">
          <input type="hidden" name="caseId" value={caseId} />
          <input type="hidden" name="stepIndex" value={stepNumber - 1} />
          <div>
            <h2 className="text-2xl font-bold">{activeStep.title}</h2>
            <p className="mt-2 text-ink/55">{activeStep.description}</p>
          </div>
          {activeStep.fields.map((field) => (
            <Field
              key={field.name}
              field={field}
              answer={responseMap.get(`intake.${activeStep.key}`) ?? {}}
            />
          ))}
          <div className="flex flex-col-reverse gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:justify-between">
            <Link
              href={
                stepNumber === 1
                  ? `/cases/${caseId}/intake`
                  : `/cases/${caseId}/intake?step=${stepNumber - 1}`
              }
              className="button-secondary"
            >
              Back
            </Link>
            <button className="button-primary" type="submit">
              Save and continue
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      ) : null}

      {isReview ? (
        <section className="surface mt-8 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 size-6 shrink-0 text-leaf" />
            <div>
              <h2 className="text-2xl font-bold">Review your answers</h2>
              <p className="mt-2 text-ink/55">
                Edit anything that is incomplete or inaccurate before continuing.
              </p>
            </div>
          </div>
          <div className="mt-7 space-y-4">
            {intakeSteps.map((step, index) => {
              const answer = responseMap.get(`intake.${step.key}`);
              return (
                <div key={step.key} className="rounded-2xl border border-forest/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold">
                      {index + 1}. {step.title}
                    </h3>
                    <Link
                      className="text-sm font-bold text-leaf hover:underline"
                      href={`/cases/${caseId}/intake?step=${index + 1}`}
                    >
                      Edit
                    </Link>
                  </div>
                  {answer ? (
                    <dl className="mt-3 grid gap-2 text-sm text-ink/60 sm:grid-cols-2">
                      {step.fields.map((field) => (
                        <div key={field.name}>
                          <dt className="font-semibold text-ink/45">{field.label}</dt>
                          <dd>
                            {typeof answer[field.name] === "boolean"
                              ? answer[field.name]
                                ? "Yes"
                                : "No"
                              : answer[field.name] || "Not provided"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-amber-700">Not completed</p>
                  )}
                </div>
              );
            })}
          </div>
          <form action={completeIntake} className="mt-7 flex justify-end">
            <input type="hidden" name="caseId" value={caseId} />
            <button className="button-primary" type="submit">
              Continue to evidence
              <ArrowRight className="size-4" />
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
