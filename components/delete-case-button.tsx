"use client";

import { Trash2 } from "lucide-react";
import { deleteCase } from "@/actions/cases";
import { SubmitButton } from "@/components/submit-button";

export function DeleteCaseButton({ caseId, title }: { caseId: string; title: string }) {
  return (
    <form action={deleteCase} onSubmit={(event) => { if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) event.preventDefault(); }}>
      <input type="hidden" name="caseId" value={caseId} />
      <SubmitButton pendingText="Deleting…" className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-4" />Delete</SubmitButton>
    </form>
  );
}
