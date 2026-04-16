"use client";

/**
 * Shown before window.print() so the user knows which print-dialog settings
 * produce a clean ATS-friendly PDF. We can't control the dialog itself
 * (browser UI), so we guide them to the right options.
 *
 * Always shown on every Export click — it's only one extra click, and the
 * settings guidance is load-bearing (default Chrome settings add URL + date
 * chrome and may strip background colors).
 */

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
};

export function PrintGuidanceOverlay({ open, onCancel, onContinue }: Props) {
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) continueRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-guide-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-950 shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
        <div>
          <h2
            id="print-guide-title"
            className="text-lg font-semibold tracking-tight"
          >
            Before you export
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Your browser&apos;s print dialog is about to open. A few settings
            make the PDF look right.
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          <GuideRow label="Destination">
            Select <strong>Save as PDF</strong>.
          </GuideRow>
          <GuideRow label="Margins">
            Keep on <strong>Default</strong>.
          </GuideRow>
          <GuideRow label="Headers and footers">
            <strong>Uncheck</strong> this — it adds the URL and date which
            you don&apos;t want on your CV.
          </GuideRow>
          <GuideRow label="Background graphics">
            <strong>Enable</strong> this under More settings — keeps any subtle
            styling we use.
          </GuideRow>
        </ul>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            ref={continueRef}
            type="button"
            onClick={onContinue}
            className="h-9 px-4 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Open print dialog
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider pt-0.5">
        {label}
      </span>
      <span className="text-zinc-700 dark:text-zinc-300">{children}</span>
    </li>
  );
}
