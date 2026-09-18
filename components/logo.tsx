import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-lg" aria-label="KesiNuru home">
      <span className="grid size-9 place-items-center rounded-full bg-forest text-sm font-extrabold text-white">KN</span>
      <span className="text-lg font-extrabold tracking-tight text-forest">KesiNuru</span>
    </Link>
  );
}
