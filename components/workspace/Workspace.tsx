"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/lib/cv/store";
import { PhaseIndicator } from "./PhaseIndicator";
import { ChatPane } from "./ChatPane";
import { CVPreview } from "@/components/cv/CVPreview";
import { PrintGuidanceOverlay } from "@/components/export/PrintGuidanceOverlay";
import { track } from "@/lib/funnel";

export function Workspace() {
  const score = useSession((s) => s.score);
  const name = useSession((s) => s.cv.personal.name);
  const phase = useSession((s) => s.phase);
  const setPhase = useSession((s) => s.setPhase);
  const advancePhase = useSession((s) => s.advancePhase);
  const reset = useSession((s) => s.reset);

  // No "Export →" advance label: the real Export PDF button *is* the
  // transition out of Polish (see handleContinueExport below). Having two
  // buttons labelled "Export…" was misleading.
  const nextPhaseLabel: Record<string, string | null> = {
    define: "Refine →",
    refine: "Polish →",
  };
  const advanceLabel = nextPhaseLabel[phase] ?? null;
  const [exportOpen, setExportOpen] = useState(false);

  function handleStartOver() {
    if (
      window.confirm(
        "Start over? Your current CV, score, and chat will be cleared."
      )
    ) {
      track("session_reset", { from: "workspace", phase });
      reset();
    }
  }

  function handleExport() {
    track("export_clicked", { phase });
    setExportOpen(true);
  }

  function handleContinueExport() {
    track("export_continued", { phase });
    setExportOpen(false);
    // Give React a tick to unmount the overlay before the blocking print
    // dialog opens — otherwise the overlay can briefly appear in the preview.
    setTimeout(() => window.print(), 50);
  }

  function handleAdvance() {
    track("phase_advanced", { from: phase, manual: true });
    advancePhase();
  }

  return (
    <div className="cv-print-root flex h-screen flex-col">
      <header className="no-print flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3 text-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            AI CV Builder
          </Link>
          {name && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-zinc-600 dark:text-zinc-400">{name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          {score && (
            <>
              <span>
                Score:{" "}
                <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                  {score.total}/100
                </span>
              </span>
              <span>
                Complete:{" "}
                <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                  {score.completeness}%
                </span>
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
            </>
          )}
          <button
            type="button"
            onClick={() => setPhase("score")}
            className="hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Score
          </button>
          {advanceLabel && (
            <button
              type="button"
              onClick={handleAdvance}
              className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {advanceLabel}
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-zinc-900 dark:bg-zinc-50 px-2.5 py-1 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleStartOver}
            className="hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Start over
          </button>
        </div>
      </header>

      <PrintGuidanceOverlay
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onContinue={handleContinueExport}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="no-print flex w-[30%] min-w-[340px] max-w-[440px] flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <PhaseIndicator />
          <ChatPane />
        </aside>
        <main className="cv-print-body flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-8">
          <CVPreview />
        </main>
      </div>
    </div>
  );
}
