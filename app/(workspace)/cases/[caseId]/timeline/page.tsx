import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  FileText,
  Link2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addTimelineEvent,
  deleteTimelineEvent,
  generateTimeline,
  runNuruCheck,
  updateTimelineEvent,
} from "@/actions/timeline";
import { SubmitButton } from "@/components/submit-button";
import { getOwnedCase } from "@/lib/cases";
import { formatCategory, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function TimelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { caseId } = await params;
  if (!caseId) notFound();
  const query = await searchParams;
  const item = await getOwnedCase(caseId);
  const events = (
    await prisma.caseEvent.findMany({
      where: { caseId },
      orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
      include: {
        evidenceLinks: {
          include: {
            evidenceFile: { select: { id: true, filename: true } },
            extractedFact: { select: { factType: true, page: true, excerpt: true } },
          },
        },
      },
    })
  ).sort((left, right) => {
    if (!left.eventDate && !right.eventDate)
      return left.createdAt.getTime() - right.createdAt.getTime();
    if (!left.eventDate) return 1;
    if (!right.eventDate) return -1;
    return left.eventDate.getTime() - right.eventDate.getTime();
  });
  const notice = query.generated
    ? "Timeline generated from reviewed facts and intake responses."
    : query.added
      ? "User-stated event added."
      : query.updated
        ? "Timeline event updated."
        : query.deleted
          ? "Timeline event deleted."
          : null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/cases/${caseId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"
      >
        <ArrowLeft className="size-4" />
        Back to case
      </Link>
      <div className="mt-7 flex flex-col gap-5 border-b border-forest/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Case timeline</p>
          <h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight">{item.title}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-ink/55">
            Events are ordered by date and keep their connection to the supporting evidence. Undated
            and user-stated events remain visibly labelled.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {events.length === 0 ? (
            <form action={generateTimeline}>
              <input type="hidden" name="caseId" value={caseId} />
              <SubmitButton className="button-primary" pendingText="Generating timeline…">
                <CalendarDays className="size-4" /> Generate timeline
              </SubmitButton>
            </form>
          ) : null}
          <form action={runNuruCheck}>
            <input type="hidden" name="caseId" value={caseId} />
            <SubmitButton className="button-secondary" pendingText="Running checks…">
              <Sparkles className="size-4" /> Run Nuru Check
            </SubmitButton>
          </form>
        </div>
      </div>

      {query.error ? (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
        >
          <AlertCircle className="size-5 shrink-0" /> {query.error}
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          {notice}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_330px]">
        <section>
          {events.length === 0 ? (
            <div className="surface px-6 py-14 text-center">
              <CalendarDays className="mx-auto size-9 text-ink/25" />
              <h2 className="mt-4 text-xl font-bold">No timeline events yet</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/50">
                Review the extracted facts first, then generate the timeline. You can also add a
                user-stated event manually.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-5 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-forest/15">
              {events.map((event) => (
                <li id={`event-${event.id}`} key={event.id} className="relative pl-14">
                  <span className="absolute left-2 top-6 z-10 grid size-6 place-items-center rounded-full bg-forest ring-4 ring-cream">
                    <span className="size-2 rounded-full bg-white" />
                  </span>
                  <article className="surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.12em] text-leaf">
                          {formatCategory(event.eventType)}
                        </p>
                        <p className="mt-2 font-bold">
                          {event.eventDate
                            ? formatDate(event.eventDate)
                            : event.approximateDate || "Date not confirmed"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${event.verificationStatus === "USER_STATED" ? "bg-amber-100 text-amber-800" : "bg-mint text-forest"}`}
                      >
                        {formatCategory(event.verificationStatus)}
                      </span>
                    </div>
                    <p className="mt-4 leading-7 text-ink/65">{event.description}</p>
                    {event.evidenceLinks.length ? (
                      <div className="mt-4 rounded-2xl bg-cream p-4">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-forest">
                          <Link2 className="size-3.5" /> Supporting evidence
                        </p>
                        <ul className="mt-3 space-y-2">
                          {event.evidenceLinks.map((link) => (
                            <li key={link.id} className="text-sm text-ink/60">
                              <Link
                                className="font-semibold text-forest underline decoration-forest/25 underline-offset-4"
                                href={`/cases/${caseId}/evidence/${link.evidenceFile.id}`}
                                target="_blank"
                              >
                                {link.evidenceFile.filename}
                              </Link>
                              {link.extractedFact
                                ? ` · ${formatCategory(link.extractedFact.factType)}${link.extractedFact.page ? ` · page ${link.extractedFact.page}` : ""}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-semibold text-amber-700">
                        User-stated event — no evidence link.
                      </p>
                    )}
                    <details className="mt-5 border-t border-forest/10 pt-4">
                      <summary className="cursor-pointer text-sm font-bold text-forest">
                        Edit event
                      </summary>
                      <form action={updateTimelineEvent} className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input type="hidden" name="caseId" value={caseId} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <label className="text-xs font-bold">
                          Event type
                          <input
                            className="field min-h-10 text-sm"
                            name="eventType"
                            defaultValue={event.eventType}
                            required
                          />
                        </label>
                        <label className="text-xs font-bold">
                          Exact date
                          <input
                            className="field min-h-10 text-sm"
                            name="eventDate"
                            type="date"
                            defaultValue={event.eventDate?.toISOString().slice(0, 10) || ""}
                          />
                        </label>
                        <label className="text-xs font-bold sm:col-span-2">
                          Approximate date
                          <input
                            className="field min-h-10 text-sm"
                            name="approximateDate"
                            defaultValue={event.approximateDate || ""}
                          />
                        </label>
                        <label className="text-xs font-bold sm:col-span-2">
                          Description
                          <textarea
                            className="field min-h-28 py-3 text-sm"
                            name="description"
                            defaultValue={event.description}
                            required
                          />
                        </label>
                        <SubmitButton className="button-secondary sm:col-span-2" pendingText="Saving correction…">
                          Save corrected event
                        </SubmitButton>
                      </form>
                    </details>
                    <form action={deleteTimelineEvent} className="mt-3">
                      <input type="hidden" name="caseId" value={caseId} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <SubmitButton
                        className="inline-flex items-center gap-2 text-xs font-bold text-red-700"
                        pendingText="Deleting…"
                      >
                        <Trash2 className="size-3.5" /> Delete event
                      </SubmitButton>
                    </form>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="surface h-fit p-5">
          <div className="grid size-11 place-items-center rounded-2xl bg-mint text-forest">
            <Plus className="size-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Add an event</h2>
          <p className="mt-2 text-sm leading-6 text-ink/50">
            Manual events are labelled user-stated until supporting evidence is linked.
          </p>
          <form action={addTimelineEvent} className="mt-5 space-y-4">
            <input type="hidden" name="caseId" value={caseId} />
            <label className="block text-xs font-bold">
              Event type
              <input
                className="field min-h-10 text-sm"
                name="eventType"
                placeholder="e.g. PAYMENT_REQUESTED"
                required
              />
            </label>
            <label className="block text-xs font-bold">
              Exact date
              <input className="field min-h-10 text-sm" name="eventDate" type="date" />
            </label>
            <label className="block text-xs font-bold">
              Approximate date
              <input
                className="field min-h-10 text-sm"
                name="approximateDate"
                placeholder="e.g. Mid-September"
              />
            </label>
            <label className="block text-xs font-bold">
              Description
              <textarea
                className="field min-h-28 py-3 text-sm"
                name="description"
                maxLength={2000}
                required
              />
            </label>
            <SubmitButton className="button-primary w-full" pendingText="Adding event…">
              <FileText className="size-4" /> Add event
            </SubmitButton>
          </form>
        </aside>
      </div>
    </div>
  );
}
