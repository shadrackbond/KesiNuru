"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CaseError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-soft">
      <AlertTriangle className="mx-auto size-10 text-red-700" />
      <h1 className="mt-4 text-2xl font-bold">This case view could not be completed</h1>
      <p className="mt-3 text-sm leading-6 text-ink/55">
        Your saved case data has not been deleted. Retry the request; if it fails again, return to
        the dashboard and reopen the case.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="button-primary" type="button" onClick={reset}>
          <RefreshCw className="size-4" /> Retry
        </button>
        <Link className="button-secondary" href="/dashboard">
          Return to cases
        </Link>
      </div>
    </div>
  );
}
