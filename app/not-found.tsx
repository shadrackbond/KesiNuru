import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-cream p-5"><div className="surface max-w-lg p-9 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-leaf">Not found</p><h1 className="mt-3 font-[var(--font-display)] text-4xl">This case is unavailable.</h1><p className="mt-4 leading-7 text-ink/55">It may have been deleted, or it does not belong to your current private session.</p><Link className="button-primary mt-7" href="/dashboard">Return to cases</Link></div></main>;
}
