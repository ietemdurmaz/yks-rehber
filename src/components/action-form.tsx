"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/lib/format";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel: string;
  variant?: "primary" | "danger";
  inline?: boolean;
};

export function ActionForm({ action, children, submitLabel, variant = "primary", inline = false }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={inline ? "inline" : undefined}>
      {children}
      <button type="submit" disabled={pending} className={variant === "danger" ? "danger" : undefined}>
        {submitLabel}
      </button>
      {state.error ? <p className="msg-error" role="alert">{state.error}</p> : null}
      {state.message ? <p className="msg-ok" role="status">{state.message}</p> : null}
    </form>
  );
}
