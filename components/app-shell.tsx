import { BriefcaseBusiness, CircleHelp, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { href: "/dashboard", label: "Cases", icon: LayoutDashboard },
  { href: "/cases/new", label: "New case", icon: Plus },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-forest/10 bg-white p-6 lg:flex lg:flex-col">
        <Logo href="/dashboard" />
        <nav className="mt-10 space-y-2" aria-label="Workspace navigation">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-ink/65 hover:bg-mint/50 hover:text-forest"><Icon className="size-4" />{label}</Link>)}
        </nav>
        <div className="mt-auto rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/60"><CircleHelp className="mb-2 size-5 text-leaf" />KesiNuru provides case organisation and legal information, not legal representation.</div>
      </aside>
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-forest/10 bg-white/95 px-5 backdrop-blur lg:ml-64 lg:px-8">
        <div className="lg:hidden"><Logo href="/dashboard" /></div>
        <div className="hidden items-center gap-2 text-sm font-semibold text-ink/55 lg:flex"><BriefcaseBusiness className="size-4" />Private case workspace</div>
        <Link href="/cases/new" className="button-primary !min-h-9 !px-4"><Plus className="size-4" />New case</Link>
      </header>
      <main className="px-5 py-8 pb-28 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-forest/10 bg-white p-2 lg:hidden" aria-label="Mobile navigation">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold text-ink/60 hover:bg-mint/50"><Icon className="size-5" />{label}</Link>)}
      </nav>
    </div>
  );
}
