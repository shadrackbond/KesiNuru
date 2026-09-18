"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="surface mx-auto max-w-xl p-8 text-center"><AlertTriangle className="mx-auto size-8 text-amber-700" /><h1 className="mt-4 text-2xl font-bold">We could not load your cases</h1><p className="mt-2 text-ink/55">Your data has not been changed. Check the database connection and try again.</p><button onClick={reset} className="button-primary mt-6">Try again</button></div>;
}
