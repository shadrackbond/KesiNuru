import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileSearch,
  PencilLine,
  RotateCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addManualFact, processEvidence, reviewFact } from "@/actions/processing";
import { SubmitButton } from "@/components/submit-button";
import { factTypes } from "@/lib/document-analysis";
import { prisma } from "@/lib/prisma";
import { requireSessionId } from "@/lib/session";

function jsonValue(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    const result = (value as { value?: unknown }).value;
    return typeof result === "string" || typeof result === "number" ? String(result) : "";
  }
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function factLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function FactReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string; evidenceId: string }>;
  searchParams: Promise<{ error?: string; processed?: string; manual?: string; reviewed?: string }>;
}) {
  const { caseId, evidenceId } = await params;
  const query = await searchParams;
  const ownerSessionId = await requireSessionId();
  const evidence = await prisma.evidenceFile.findFirst({
    where: { id: evidenceId, caseId, case: { ownerSessionId } },
    select: {
      id: true,
      filename: true,
      documentType: true,
      processingStatus: true,
      processingSummary: true,
      processingWarning: true,
      processingError: true,
      modelVersion: true,
      processedAt: true,
      facts: { orderBy: [{ page: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!evidence) notFound();
  const candidateCount = evidence.facts.filter(
    (fact) => fact.verificationStatus === "CANDIDATE",
  ).length;
  const reviewedCount = evidence.facts.filter((fact) =>
    ["CONFIRMED", "CORRECTED", "REJECTED", "USER_STATED"].includes(fact.verificationStatus),
  ).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/cases/${caseId}/evidence`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        Back to evidence
      </Link>
      <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Fact review</p>
          <h1 className="mt-2 truncate font-[var(--font-display)] text-4xl tracking-tight">
            {evidence.filename}
          </h1>
          <p className="mt-3 text-sm text-ink/50">
            {evidence.documentType} · {evidence.processingStatus.replaceAll("_", " ")}
            {evidence.modelVersion ? ` · ${evidence.modelVersion}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="button-secondary"
            href={`/cases/${caseId}/evidence/${evidence.id}`}
            target="_blank"
          >
            <Eye className="size-4" />
            Source
          </Link>
          <form action={processEvidence}>
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="evidenceId" value={evidence.id} />
            <SubmitButton className="button-primary" pendingText="Processing document…">
              {evidence.processingStatus === "WAITING" ? (
                <FileSearch className="size-4" />
              ) : (
                <RotateCw className="size-4" />
              )}
              {evidence.processingStatus === "WAITING" ? "Process document" : "Process again"}
            </SubmitButton>
          </form>
        </div>
      </div>
      {query.reviewed ? (
        <div role="status" className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Fact review saved.
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
      {query.processed ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          Document processed. Review every candidate before using it downstream.
        </div>
      ) : null}
      {query.manual ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          User-stated fact added.
        </div>
      ) : null}
      {evidence.processingWarning ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          <p>{evidence.processingWarning}</p>
        </div>
      ) : null}
      {evidence.processingError ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-bold">Last processing attempt failed</p>
            <p>{evidence.processingError}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Extracted facts</h2>
                <p className="mt-1 text-sm text-ink/50">
                  {candidateCount} awaiting review · {reviewedCount} reviewed
                </p>
              </div>
              {candidateCount === 0 && evidence.facts.length > 0 ? (
                <CheckCircle2 className="size-6 text-leaf" />
              ) : null}
            </div>
            {evidence.processingSummary ? (
              <p className="mt-4 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/65">
                {evidence.processingSummary}
              </p>
            ) : null}
          </div>

          {evidence.facts.length === 0 ? (
            <div className="surface px-6 py-12 text-center">
              <FileSearch className="mx-auto size-8 text-ink/25" />
              <p className="mt-4 font-bold">No extracted facts yet</p>
              <p className="mt-2 text-sm text-ink/50">
                Process the document or add a user-stated fact manually.
              </p>
            </div>
          ) : (
            evidence.facts.map((fact) => {
              const candidate = jsonValue(fact.candidateValue);
              const corrected = jsonValue(fact.correctedValue);
              return (
                <article id={`fact-${fact.id}`} key={fact.id} className="surface p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.12em] text-leaf">
                        {factLabel(fact.factType)}
                      </p>
                      <p className="mt-2 text-xl font-bold">{corrected || candidate}</p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${fact.verificationStatus === "CANDIDATE" ? "bg-amber-100 text-amber-800" : fact.verificationStatus === "REJECTED" ? "bg-red-100 text-red-800" : "bg-mint text-forest"}`}
                    >
                      {fact.verificationStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/60">
                    <p>“{fact.excerpt || "User-entered fact; no document excerpt supplied."}”</p>
                    <p className="mt-2 text-xs font-semibold text-ink/40">
                      {fact.page ? `Page ${fact.page}` : "No page supplied"}
                      {fact.confidence !== null
                        ? ` · ${Math.round(fact.confidence * 100)}% extraction confidence`
                        : ""}
                    </p>
                  </div>
                  {fact.verificationStatus === "CANDIDATE" ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <form action={reviewFact}>
                          <input type="hidden" name="caseId" value={caseId} />
                          <input type="hidden" name="evidenceId" value={evidence.id} />
                          <input type="hidden" name="factId" value={fact.id} />
                          <SubmitButton
                            className="button-primary min-h-9 px-4 py-1 text-xs"
                            name="decision"
                            value="confirm"
                            pendingText="Confirming…"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Confirm
                          </SubmitButton>
                        </form>
                        <form action={reviewFact}>
                          <input type="hidden" name="caseId" value={caseId} />
                          <input type="hidden" name="evidenceId" value={evidence.id} />
                          <input type="hidden" name="factId" value={fact.id} />
                          <SubmitButton
                            className="button-secondary min-h-9 px-4 py-1 text-xs text-red-700"
                            name="decision"
                            value="reject"
                            pendingText="Rejecting…"
                          >
                            <XCircle className="size-3.5" />
                            Reject
                          </SubmitButton>
                        </form>
                      </div>
                      <form
                        action={reviewFact}
                        className="flex flex-col gap-2 rounded-2xl border border-forest/10 p-3 sm:flex-row"
                      >
                        <input type="hidden" name="caseId" value={caseId} />
                        <input type="hidden" name="evidenceId" value={evidence.id} />
                        <input type="hidden" name="factId" value={fact.id} />
                        <input
                          className="field mt-0 min-h-10 flex-1"
                          name="correctedValue"
                          defaultValue={candidate}
                          maxLength={500}
                          required
                        />
                        <SubmitButton
                          className="button-secondary min-h-10 shrink-0"
                          name="decision"
                          value="correct"
                          pendingText="Saving correction…"
                        >
                          <PencilLine className="size-3.5" />
                          Save correction
                        </SubmitButton>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </section>

        <aside className="surface h-fit p-5">
          <h2 className="font-bold">Manual fallback</h2>
          <p className="mt-2 text-sm leading-6 text-ink/50">
            Add a clearly labelled user-stated fact when OCR is incomplete or the source is
            unavailable.
          </p>
          <form action={addManualFact} className="mt-5 space-y-4">
            <input type="hidden" name="caseId" value={caseId} />
            <input type="hidden" name="evidenceId" value={evidence.id} />
            <label className="block text-xs font-bold">
              Fact type
              <select className="field min-h-10 text-sm" name="factType" required defaultValue="">
                <option value="" disabled>
                  Select type
                </option>
                {factTypes.map((type) => (
                  <option key={type} value={type}>
                    {factLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold">
              Value
              <input className="field min-h-10 text-sm" name="value" required maxLength={500} />
            </label>
            <label className="block text-xs font-bold">
              Page, if known
              <input
                className="field min-h-10 text-sm"
                name="page"
                type="number"
                min={1}
                max={1000}
              />
            </label>
            <label className="block text-xs font-bold">
              Supporting excerpt
              <textarea className="field min-h-24 py-3 text-sm" name="excerpt" maxLength={500} />
            </label>
            <SubmitButton className="button-secondary w-full" pendingText="Adding fact…">
              Add user-stated fact
            </SubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
