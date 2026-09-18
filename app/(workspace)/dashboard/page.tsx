import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { CaseCard } from "@/components/case-card";
import { EmptyState } from "@/components/empty-state";
import { listOwnedCases } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cases = await listOwnedCases();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Your workspace</p><h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight sm:text-5xl">Your cases</h1><p className="mt-3 max-w-xl leading-7 text-ink/55">Continue a saved case or organise a new employment matter.</p></div><Link href="/cases/new" className="button-primary">Create new case <ArrowRight className="size-4" /></Link></div>
      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-leaf/15 bg-mint/50 px-4 py-3 text-sm text-forest"><LockKeyhole className="size-4 shrink-0" /><span>This demo workspace is isolated by a secure browser session. Do not upload real documents yet.</span></div>
      <div className="mt-8">{cases.length === 0 ? <EmptyState /> : <div className="grid gap-5 md:grid-cols-2">{cases.map((item) => <CaseCard key={item.id} item={item} />)}</div>}</div>
    </div>
  );
}
