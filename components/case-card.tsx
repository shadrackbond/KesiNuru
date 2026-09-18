import { ArrowUpRight, FileText, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { DeleteCaseButton } from "@/components/delete-case-button";
import { formatCategory, formatDate } from "@/lib/format";

type CaseCardProps = {
  item: {
    id: string; title: string; category: string; stage: string; progress: number; updatedAt: Date;
    _count: { evidenceFiles: number; checks: number };
  };
};

export function CaseCard({ item }: CaseCardProps) {
  return (
    <article className="surface p-5 transition hover:-translate-y-0.5 hover:border-leaf/30">
      <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-forest">{formatCategory(item.stage)}</span><h2 className="mt-4 text-xl font-bold">{item.title}</h2><p className="mt-1 text-sm text-ink/50">{formatCategory(item.category)} · Updated {formatDate(item.updatedAt)}</p></div><Link href={`/cases/${item.id}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-forest/15 text-forest hover:bg-mint" aria-label={`Open ${item.title}`}><ArrowUpRight className="size-4" /></Link></div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-leaf" style={{ width: `${item.progress}%` }} /></div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-ink/45"><span>{item.progress}% prepared</span><span>Next: {item.stage === "INTAKE" ? "guided intake" : formatCategory(item.stage)}</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-4"><div className="flex gap-4 text-sm text-ink/55"><span className="inline-flex items-center gap-1"><FileText className="size-4" />{item._count.evidenceFiles}</span><span className="inline-flex items-center gap-1"><ShieldAlert className="size-4" />{item._count.checks}</span></div><DeleteCaseButton caseId={item.id} title={item.title} /></div>
    </article>
  );
}
