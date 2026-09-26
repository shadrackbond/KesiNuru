import { LoaderCircle } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-4xl place-items-center" role="status" aria-live="polite">
      <div className="surface flex max-w-md flex-col items-center p-8 text-center">
        <LoaderCircle className="size-8 animate-spin text-leaf" aria-hidden="true" />
        <p className="mt-4 text-lg font-bold">Loading your workspace…</p>
        <p className="mt-2 text-sm leading-6 text-ink/50">
          KesiNuru is securely retrieving the latest case information.
        </p>
      </div>
    </div>
  );
}
