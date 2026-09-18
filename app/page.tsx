import { ArrowRight, CheckCircle2, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const steps = [
  { icon: FileSearch, title: "Tell your story", text: "A guided interview helps organise the important people, dates, payments and events." },
  { icon: CheckCircle2, title: "Verify the facts", text: "Review every extracted fact and see exactly which document or statement supports it." },
  { icon: Sparkles, title: "Prepare your CasePack", text: "Create a clear timeline and evidence index to take to a qualified professional." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-ink/70 md:flex" aria-label="Main navigation">
          <a href="#how-it-works" className="hover:text-forest">How it works</a>
          <a href="#safety" className="hover:text-forest">Safety</a>
        </nav>
        <Link className="button-secondary" href="/dashboard">Open workspace</Link>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-mint/60 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-forest">
            <ShieldCheck className="size-4" /> Evidence-first employment support
          </div>
          <h1 className="max-w-3xl font-[var(--font-display)] text-5xl font-medium leading-[.98] tracking-[-.04em] text-ink sm:text-6xl lg:text-7xl">
            From scattered records to a <span className="text-leaf">clear case file.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink/65">
            KesiNuru helps Kenyan employees organise workplace evidence, verify key facts and prepare a reviewable CasePack before seeking professional help.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary" href="/cases/new">Start organising my case <ArrowRight className="size-4" /></Link>
            <a className="button-secondary" href="#how-it-works">See how it works</a>
          </div>
          <p className="mt-5 text-sm text-ink/50">Legal information and case organisation—not legal representation or emergency support.</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-16 -z-10 rounded-full bg-mint/60 blur-3xl" />
          <div className="surface overflow-hidden p-4 sm:p-6">
            <div className="rounded-2xl bg-forest p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-mint">Case preparation</p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl">Amina’s wage record</h2>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-2/3 rounded-full bg-[#b9d8cc]" /></div>
              <p className="mt-2 text-sm text-white/70">Evidence review · 67% prepared</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-forest/10 p-5"><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Evidence</p><p className="mt-2 text-2xl font-bold">4 files</p><p className="mt-1 text-sm text-ink/55">Contract, payslip and records</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-amber-800/70">Nuru Check</p><p className="mt-2 text-2xl font-bold">2 items</p><p className="mt-1 text-sm text-amber-900/60">One conflict needs review</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-forest/10 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-leaf">How it works</p>
          <h2 className="mt-3 max-w-2xl font-[var(--font-display)] text-4xl tracking-tight sm:text-5xl">Clarity without pretending certainty.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="rounded-3xl border border-forest/10 bg-cream/50 p-7">
                <div className="flex items-center justify-between"><Icon className="size-6 text-leaf" /><span className="text-sm font-bold text-ink/30">0{index + 1}</span></div>
                <h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-ink/60">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
        <ShieldCheck className="mx-auto size-8 text-leaf" />
        <h2 className="mt-5 font-[var(--font-display)] text-4xl">Your evidence stays yours.</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-ink/60">KesiNuru separates user statements from document-supported facts, makes uncertainty visible and never predicts whether a case will succeed.</p>
      </section>
    </main>
  );
}
