import {
  AlertOctagon,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Info,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveNuruCheck, runNuruCheck } from "@/actions/timeline";
import { getOwnedCase } from "@/lib/cases";
import { formatCategory } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const severityStyle = {
  BLOCKING: { icon: AlertOctagon, box: "border-red-200 bg-red-50", text: "text-red-800" },
  ATTENTION: { icon: CircleAlert, box: "border-amber-200 bg-amber-50", text: "text-amber-900" },
  INFO: { icon: Info, box: "border-blue-200 bg-blue-50", text: "text-blue-900" },
} as const;

export default async function NuruCheckPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ checked?: string; resolved?: string }>;
}) {
  const { caseId } = await params;
  if (!caseId) notFound();
  const query = await searchParams;
  const item = await getOwnedCase(caseId);
  const checks = await prisma.nuruCheck.findMany({
    where: { caseId },
    orderBy: [{ status: "desc" }, { severity: "asc" }, { createdAt: "asc" }],
  });
  const open = checks.filter((check) => check.status === "OPEN");
  const blocking = open.filter((check) => check.severity === "BLOCKING").length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/cases/${caseId}/timeline`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" /> Back to timeline
      </Link>
      <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Nuru Check</p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">
            Review gaps before export
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/55">
            Deterministic checks identify missing, conflicting or unsupported information. They do
            not decide the legal merits of {item.title}.
          </p>
        </div>
        <form action={runNuruCheck}>
          <input type="hidden" name="caseId" value={caseId} />
          <button className="button-secondary" type="submit">
            <RefreshCw className="size-4" /> Run again
          </button>
        </form>
      </div>

      {query.checked ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          Nuru Check completed against the current case record.
        </div>
      ) : null}
      {query.resolved ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          Check marked as resolved. Run Nuru Check again after changing the underlying case data.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-3xl font-bold">{open.length}</p>
          <p className="mt-1 text-sm text-ink/50">Open checks</p>
        </div>
        <div className="surface p-5">
          <p className="text-3xl font-bold text-red-700">{blocking}</p>
          <p className="mt-1 text-sm text-ink/50">Blocking checks</p>
        </div>
        <div className="surface p-5">
          <p className="text-3xl font-bold text-leaf">{checks.length - open.length}</p>
          <p className="mt-1 text-sm text-ink/50">Resolved checks</p>
        </div>
      </div>

      {checks.length === 0 ? (
        <div className="surface mt-6 px-6 py-14 text-center">
          <ShieldCheck className="mx-auto size-10 text-leaf" />
          <h2 className="mt-4 text-xl font-bold">No checks recorded yet</h2>
          <p className="mt-2 text-sm text-ink/50">
            Run Nuru Check to inspect the timeline, evidence and reviewed facts.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {checks.map((check) => {
            const style = severityStyle[check.severity];
            const Icon = style.icon;
            return (
              <article
                id={`check-${check.id}`}
                key={check.id}
                className={`rounded-3xl border p-5 ${check.status === "RESOLVED" ? "border-forest/10 bg-white opacity-60" : style.box}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <Icon className={`mt-0.5 size-6 shrink-0 ${style.text}`} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{formatCategory(check.checkType)}</h2>
                      <span
                        className={`rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold ${style.text}`}
                      >
                        {check.severity}
                      </span>
                      {check.status === "RESOLVED" ? (
                        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-forest">
                          RESOLVED
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{check.description}</p>
                  </div>
                  {check.status === "OPEN" ? (
                    <form action={resolveNuruCheck}>
                      <input type="hidden" name="caseId" value={caseId} />
                      <input type="hidden" name="checkId" value={check.id} />
                      <button className="button-secondary min-h-9 px-3 py-1 text-xs" type="submit">
                        <CheckCircle2 className="size-3.5" /> Mark resolved
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button-secondary" href={`/cases/${caseId}/timeline`}>
          Review timeline
        </Link>
        <Link className="button-primary" href={`/cases/${caseId}`}>
          Return to case workspace
        </Link>
      </div>
      <p className="mt-6 text-xs leading-5 text-ink/45">
        Nuru Check is an organisational quality check, not legal advice, a legal conclusion or a
        prediction of case outcome.
      </p>
    </div>
  );
}
