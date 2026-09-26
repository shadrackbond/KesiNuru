import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Route,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prepareActionPath } from "@/actions/casepack";
import { buildActionPath, legalSourceSeeds } from "@/lib/action-path";
import { getOwnedCase } from "@/lib/cases";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const statusStyle = {
  DO_NOW: "bg-amber-100 text-amber-900",
  NEXT: "bg-mint text-forest",
  OPTION: "bg-blue-100 text-blue-900",
} as const;

export default async function ActionPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ prepared?: string }>;
}) {
  const { caseId } = await params;
  if (!caseId) notFound();
  const query = await searchParams;
  const item = await getOwnedCase(caseId);
  const [responses, checks, references] = await Promise.all([
    prisma.intakeResponse.findMany({
      where: { caseId },
      select: { questionKey: true, answer: true },
    }),
    prisma.nuruCheck.findMany({
      where: { caseId },
      select: { severity: true, status: true },
    }),
    prisma.actionReference.findMany({
      where: { caseId },
      include: { legalSource: true },
      orderBy: { id: "asc" },
    }),
  ]);
  const path = buildActionPath({
    checks,
    responses,
    evidenceCount: item._count.evidenceFiles,
    eventCount: item._count.events,
  });
  const sources = references.length
    ? references.map((reference) => ({
        ...reference.legalSource,
        explanation: reference.explanation,
      }))
    : Object.values(legalSourceSeeds).map((source) => ({
        ...source,
        id: source.canonicalUrl,
        versionDate: null,
        verifiedAt: null,
      }));

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/cases/${caseId}/nuru-check`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" /> Back to Nuru Check
      </Link>
      <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Action Path</p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">
            Practical next steps, with sources
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/55">
            This path organises possible steps from the current record. It does not recommend a
            legal strategy, decide a deadline or predict an outcome.
          </p>
        </div>
        <form action={prepareActionPath}>
          <input type="hidden" name="caseId" value={caseId} />
          <button className="button-secondary" type="submit">
            <Route className="size-4" /> {references.length ? "Refresh path" : "Prepare path"}
          </button>
        </form>
      </div>

      {query.prepared ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          Action Path refreshed from the current case record and official source links.
        </div>
      ) : null}

      <section
        className={`mt-8 rounded-3xl border p-6 ${path.readyForCasePack ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
      >
        <div className="flex gap-4">
          {path.readyForCasePack ? (
            <CheckCircle2 className="size-7 shrink-0 text-green-700" />
          ) : (
            <AlertTriangle className="size-7 shrink-0 text-amber-700" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {path.readyForCasePack ? "Ready to prepare a CasePack" : "Review gaps before relying on the pack"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {path.readyForCasePack
                ? "No blocking Nuru Checks remain and the case has a timeline. Attention items stay visible in the export."
                : `${path.blockingCount} blocking and ${path.attentionCount} attention item${path.blockingCount + path.attentionCount === 1 ? "" : "s"} remain. You can still generate a draft, but its gaps will be included.`}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Suggested sequence</h2>
            <span className="text-sm font-semibold text-ink/45">{path.steps.length} steps</span>
          </div>
          <ol className="mt-5 space-y-4">
            {path.steps.map((step, index) => (
              <li key={step.id} className="surface p-5 sm:p-6">
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-forest font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{step.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[step.status]}`}>
                        {step.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="button-secondary" href={`/cases/${caseId}/nuru-check`}>
              Review open checks
            </Link>
            <Link className="button-primary" href={`/cases/${caseId}/casepack`}>
              Open CasePack <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <aside className="surface h-fit p-5">
          <div className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
            <BookOpenCheck className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Official sources</h2>
          <p className="mt-2 text-sm leading-6 text-ink/50">
            Open and verify these pages before acting. Procedures and law can change.
          </p>
          <ul className="mt-5 space-y-4">
            {sources.map((source) => (
              <li key={source.id} className="border-t border-forest/10 pt-4 first:border-0 first:pt-0">
                <a
                  className="inline-flex items-start gap-2 font-bold text-forest underline decoration-forest/25 underline-offset-4"
                  href={source.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title} <ExternalLink className="mt-1 size-3.5 shrink-0" />
                </a>
                <p className="mt-1 text-xs font-semibold text-ink/45">
                  {source.issuingBody} · {source.provision}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/55">{source.explanation}</p>
                {source.verifiedAt ? (
                  <p className="mt-2 text-xs text-ink/40">Link checked {formatDate(source.verifiedAt)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <p className="mt-8 text-xs leading-5 text-ink/45">
        KesiNuru provides legal information and case-organisation support. It is not a law firm and
        does not provide legal representation or legal advice.
      </p>
    </div>
  );
}
