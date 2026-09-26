import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Link2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmCasePack, generateCasePack } from "@/actions/casepack";
import { PrintButton } from "@/components/print-button";
import { casePackContentSchema } from "@/lib/casepack";
import { getOwnedCase } from "@/lib/cases";
import { formatCategory, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { objectIdSchema } from "@/lib/validation";

function readableBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function CasePackPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{
    generated?: string;
    confirmed?: string;
    documentId?: string;
    error?: string;
  }>;
}) {
  const { caseId } = await params;
  if (!caseId) notFound();
  const query = await searchParams;
  await getOwnedCase(caseId);
  const requestedId = query.documentId ? objectIdSchema.safeParse(query.documentId) : null;
  const document = await prisma.generatedDocument.findFirst({
    where: {
      caseId,
      documentType: "CASEPACK",
      ...(requestedId?.success ? { id: requestedId.data } : {}),
    },
    orderBy: { version: "desc" },
  });
  const parsed = document ? casePackContentSchema.safeParse(document.content) : null;
  const pack = parsed?.success ? parsed.data : null;
  const openChecks = pack?.nuruChecks.filter((check) => check.status === "OPEN") ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="no-print">
        <Link
          href={`/cases/${caseId}/action-path`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
        >
          <ArrowLeft className="size-4" /> Back to Action Path
        </Link>
        <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">CasePack</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">
              A reviewable case bundle
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-ink/55">
              Generate a snapshot of reviewed facts, the evidence-linked timeline, open checks,
              evidence metadata and official sources. Uploaded file contents are not embedded.
            </p>
          </div>
          <form action={generateCasePack}>
            <input type="hidden" name="caseId" value={caseId} />
            <button className="button-primary" type="submit">
              {document ? <RefreshCw className="size-4" /> : <FileArchive className="size-4" />}
              {document ? "Generate new version" : "Generate CasePack"}
            </button>
          </form>
        </div>

        {query.generated ? (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          >
            A new CasePack snapshot was generated from the current case record.
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
        {query.confirmed ? (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          >
            CasePack confirmed. Generate a new version if the underlying case record changes.
          </div>
        ) : null}
      </div>

      {!document ? (
        <section className="surface mt-8 px-6 py-16 text-center">
          <FileText className="mx-auto size-11 text-ink/25" />
          <h2 className="mt-4 text-2xl font-bold">No CasePack generated yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink/50">
            Prepare the Action Path first so its official sources are included, then generate the
            first version. Open gaps will remain visible rather than being silently omitted.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="button-secondary" href={`/cases/${caseId}/action-path`}>
              Review Action Path
            </Link>
            <form action={generateCasePack}>
              <input type="hidden" name="caseId" value={caseId} />
              <button className="button-primary" type="submit">
                Generate draft
              </button>
            </form>
          </div>
        </section>
      ) : !pack ? (
        <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-bold text-red-900">This CasePack version cannot be displayed</h2>
          <p className="mt-2 text-sm text-red-800">
            Its stored structure did not pass validation. Generate a new version from the current
            case record.
          </p>
        </section>
      ) : (
        <article className="casepack-print mt-8 rounded-3xl border border-forest/10 bg-white shadow-soft">
          <header className="border-b border-forest/10 p-6 sm:p-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-leaf">KesiNuru CasePack</p>
                <h1 className="mt-3 font-[var(--font-display)] text-4xl tracking-tight">{pack.case.title}</h1>
                <p className="mt-2 text-sm text-ink/50">
                  {formatCategory(pack.case.category)} · {pack.case.jurisdiction}
                </p>
              </div>
              <div className="text-left text-sm sm:text-right">
                <p className="font-bold">Version {document.version}</p>
                <p className="mt-1 text-ink/45">Generated {formatDate(new Date(pack.generatedAt))}</p>
                <p className={`mt-2 font-semibold ${document.confirmedAt ? "text-green-700" : "text-amber-700"}`}>
                  {document.confirmedAt ? `Confirmed ${formatDate(document.confirmedAt)}` : "Draft — not confirmed"}
                </p>
              </div>
            </div>
            <div className="no-print mt-6 flex flex-wrap gap-3">
              <PrintButton />
              <a
                className="button-secondary"
                href={`/cases/${caseId}/casepack/download?documentId=${document.id}`}
              >
                <Download className="size-4" /> Download JSON
              </a>
              {!document.confirmedAt ? (
                <form action={confirmCasePack}>
                  <input type="hidden" name="caseId" value={caseId} />
                  <input type="hidden" name="documentId" value={document.id} />
                  <button className="button-primary" type="submit">
                    <ShieldCheck className="size-4" /> Confirm this version
                  </button>
                </form>
              ) : null}
            </div>
          </header>

          <div className="space-y-10 p-6 sm:p-9">
            {openChecks.length ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <AlertTriangle className="size-6 shrink-0 text-amber-700" />
                  <div>
                    <h2 className="font-bold">{openChecks.length} open quality check{openChecks.length === 1 ? "" : "s"}</h2>
                    <p className="mt-1 text-sm text-ink/60">
                      These gaps were open when this snapshot was generated.
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {openChecks.map((check) => (
                    <li key={check.checkType} className="text-sm leading-6 text-ink/65">
                      <strong>{check.severity}:</strong> {check.description}
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="flex items-center gap-2 font-bold text-green-800">
                  <CheckCircle2 className="size-5" /> No open Nuru Checks in this snapshot
                </p>
              </section>
            )}

            <section>
              <h2 className="casepack-heading">1. Case summary</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ["Employer", pack.summary.employer],
                  ["Amount claimed", pack.summary.amountClaimed],
                  ["Issue", pack.summary.issue],
                  ["Desired outcome", pack.summary.desiredOutcome],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-cream p-4">
                    <dt className="text-xs font-bold uppercase tracking-[.1em] text-ink/45">{label}</dt>
                    <dd className="mt-2 text-sm leading-6 text-ink/70">{value || "Not recorded"}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h2 className="casepack-heading">2. Reviewed facts</h2>
              {pack.reviewedFacts.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-forest/15 text-xs uppercase tracking-[.08em] text-ink/45">
                        <th className="p-3">Fact</th><th className="p-3">Value</th><th className="p-3">Source</th><th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pack.reviewedFacts.map((fact) => (
                        <tr key={fact.id} className="border-b border-forest/10 align-top">
                          <td className="p-3 font-semibold">{formatCategory(fact.factType)}</td>
                          <td className="p-3">{fact.value || "Not recorded"}</td>
                          <td className="p-3">{fact.evidenceFilename}{fact.page ? `, p. ${fact.page}` : ""}</td>
                          <td className="p-3">{formatCategory(fact.verificationStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-3 text-sm text-ink/50">No reviewed extracted facts were available.</p>}
            </section>

            <section>
              <h2 className="casepack-heading">3. Evidence-linked timeline</h2>
              <ol className="mt-5 space-y-4">
                {pack.timeline.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-forest/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-bold">{formatCategory(event.eventType)}</p>
                      <p className="text-sm font-semibold text-ink/50">
                        {event.eventDate ? formatDate(new Date(event.eventDate)) : event.approximateDate || "Date not confirmed"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{event.description}</p>
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink/45">
                      <Link2 className="size-3.5" />
                      {event.evidenceLinks.length
                        ? event.evidenceLinks.map((link) => link.evidenceFilename).join(", ")
                        : "User-stated — no evidence link"}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="casepack-heading">4. Evidence index</h2>
              <ul className="mt-4 divide-y divide-forest/10 rounded-2xl border border-forest/10">
                {pack.evidenceIndex.map((evidence) => (
                  <li key={evidence.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{evidence.filename}</p>
                      <p className="mt-1 text-xs text-ink/45">{evidence.documentType} · {readableBytes(evidence.sizeBytes)}</p>
                    </div>
                    <p className="text-xs font-semibold text-forest">{evidence.reviewedFactCount} reviewed facts</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="casepack-heading">5. Source-backed information</h2>
              <ul className="mt-4 space-y-4">
                {pack.actionSources.map((source) => (
                  <li key={`${source.url}-${source.provision}`} className="rounded-2xl border border-forest/10 p-4">
                    <a className="font-bold text-forest underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <p className="mt-1 text-xs text-ink/45">{source.issuingBody} · {source.provision}</p>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{source.explanation}</p>
                  </li>
                ))}
              </ul>
            </section>

            <footer className="border-t border-forest/15 pt-6 text-xs leading-5 text-ink/50">
              <p>{pack.disclaimer}</p>
              <p className="mt-2">Case ID: {pack.case.id} · Snapshot generated {new Date(pack.generatedAt).toISOString()}</p>
            </footer>
          </div>
        </article>
      )}
    </div>
  );
}
