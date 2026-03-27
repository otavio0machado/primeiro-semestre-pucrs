"use client";

import type { ReactNode } from "react";

export function AiActionModal({
  eyebrow,
  title,
  description,
  confirmLabel,
  loading,
  canSubmit,
  onClose,
  onSubmit,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  canSubmit: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-border-default bg-bg-primary p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-fg-muted">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-fg-primary">
            {title}
          </h2>
          <p className="text-sm leading-6 text-fg-secondary">{description}</p>
        </div>

        <div className="mt-6 space-y-4">{children}</div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border-default px-4 py-2 text-sm text-fg-secondary transition-colors hover:bg-bg-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={onSubmit}
            className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Gerando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
