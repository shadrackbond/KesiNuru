"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText: string;
  children: ReactNode;
};

export function SubmitButton({
  pendingText,
  children,
  className = "",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      className={`${className} ${pending ? "cursor-wait" : ""}`}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          <span role="status" aria-live="polite">{pendingText}</span>
        </>
      ) : children}
    </button>
  );
}
