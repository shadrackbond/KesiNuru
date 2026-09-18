import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { createCase } from "@/actions/cases";

const options = [
  ["UNPAID_WAGES", "Unpaid or partially paid wages"],
  ["DELAYED_WAGES", "Delayed wages"],
  ["FINAL_PAY", "Missing final payment"],
  ["TERMINATION_DOCUMENTATION", "Termination documentation"],
  ["NOTICE_REVIEW", "Notice-related information"],
];

export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/55 hover:text-forest"><ArrowLeft className="size-4" />Back to cases</Link>
      <div className="mt-7"><p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">New case</p><h1 className="mt-2 font-[var(--font-display)] text-4xl tracking-tight sm:text-5xl">Start with the basics</h1><p className="mt-3 max-w-xl leading-7 text-ink/55">Give this case a private, recognisable title. Avoid including unnecessary personal identifiers.</p></div>
      <form action={createCase} className="surface mt-8 space-y-6 p-6 sm:p-8">
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}
        <label className="block text-sm font-bold text-ink">Case title<input className="field" name="title" minLength={3} maxLength={100} required placeholder="e.g. July and August wage records" autoFocus /><span className="mt-2 block text-xs font-normal text-ink/45">Visible only inside this session.</span></label>
        <label className="block text-sm font-bold text-ink">What do you mainly want to organise?<select className="field" name="category" required defaultValue=""><option value="" disabled>Select a category</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="flex gap-3 rounded-2xl bg-mint/50 p-4 text-sm leading-6 text-forest"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p>KesiNuru will organise information and evidence. It will not decide whether your case is legally valid or likely to succeed.</p></div>
        <div className="flex flex-col-reverse gap-3 border-t border-forest/10 pt-6 sm:flex-row sm:justify-end"><Link href="/dashboard" className="button-secondary">Cancel</Link><button type="submit" className="button-primary">Create case</button></div>
      </form>
    </div>
  );
}
