import {
  ArrowLeft,
  Check,
  Circle,
  FileUp,
  ListChecks,
  MapPinned,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnedCase } from "@/lib/cases";
import { formatCategory, formatDate } from "@/lib/format";

const stages = [
  { label: "Guided intake", icon: ListChecks, available: true },
  { label: "Evidence upload", icon: FileUp, available: true },
  { label: "Fact review", icon: Check, available: false },
  { label: "Timeline", icon: MapPinned, available: false },
  { label: "Nuru Check", icon: Sparkles, available: false },
  { label: "Action Path", icon: Route, available: false },
];

export default async function CaseWorkspacePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  if (!caseId) notFound();
  const item = await getOwnedCase(caseId);
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        All cases
      </Link>
      <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest">
            {formatCategory(item.stage)}
          </span>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-tight sm:text-5xl">
            {item.title}
          </h1>
          <p className="mt-2 text-sm text-ink/50">
            {formatCategory(item.category)} · Updated {formatDate(item.updatedAt)}
          </p>
        </div>
        <button className="button-secondary" disabled>
          Export CasePack
        </button>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Current step</p>
          <h2 className="mt-3 text-2xl font-bold">Build the case record</h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink/55">
            Complete the guided intake, review every answer, then add the documents that support the
            record.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="button-primary" href={`/cases/${item.id}/intake`}>
              {item.stage === "INTAKE" ? "Begin intake" : "Review intake"}
            </Link>
            <Link className="button-secondary" href={`/cases/${item.id}/evidence`}>
              Upload evidence
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-2xl font-bold">{item._count.evidenceFiles}</p>
              <p className="mt-1 text-sm text-ink/50">Evidence files</p>
            </div>
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-2xl font-bold">{item._count.events}</p>
              <p className="mt-1 text-sm text-ink/50">Timeline events</p>
            </div>
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-2xl font-bold">{item._count.checks}</p>
              <p className="mt-1 text-sm text-ink/50">Open checks</p>
            </div>
          </div>
        </section>
        <aside className="surface p-5">
          <h2 className="font-bold">Preparation path</h2>
          <ol className="mt-5 space-y-4">
            {stages.map(({ label, icon: Icon, available }, index) => (
              <li
                key={label}
                className={`flex items-center gap-3 ${available ? "text-forest" : "text-ink/35"}`}
              >
                <span
                  className={`grid size-9 place-items-center rounded-xl ${available ? "bg-mint" : "bg-cream"}`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs">{available ? "Available" : "Upcoming milestone"}</p>
                </div>
                {(item.stage === "INTAKE" ? index === 0 : index === 1) ? (
                  <Circle className="size-3 fill-leaf text-leaf" />
                ) : null}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
