"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button className="button-secondary" type="button" onClick={() => window.print()}>
      <Printer className="size-4" /> Print or save PDF
    </button>
  );
}
