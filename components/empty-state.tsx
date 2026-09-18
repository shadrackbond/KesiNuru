import { FolderPlus } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="surface grid min-h-[390px] place-items-center p-8 text-center">
      <div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-mint text-forest"><FolderPlus className="size-6" /></div><h2 className="mt-5 text-xl font-bold">Create your first case</h2><p className="mx-auto mt-2 max-w-md leading-7 text-ink/55">Start with the basic details. You can save your progress and add evidence in the next milestone.</p><Link href="/cases/new" className="button-primary mt-6">Start a case</Link></div>
    </div>
  );
}
