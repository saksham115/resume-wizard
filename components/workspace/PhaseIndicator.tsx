"use client";

import { useSession } from "@/lib/cv/store";
import type { Phase } from "@/lib/cv-schema";

type WorkspacePhase = Extract<Phase, "define" | "refine" | "polish">;

const PHASES: { key: WorkspacePhase; label: string; description: string }[] = [
  { key: "define", label: "Define", description: "Fill in the gaps" },
  { key: "refine", label: "Refine", description: "Tighten the language" },
  { key: "polish", label: "Polish", description: "Final formatting" },
];

export function PhaseIndicator() {
  const phase = useSession((s) => s.phase);
  const current = PHASES.findIndex((p) => p.key === phase);
  const activeIdx = current >= 0 ? current : 0;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
      <div className="flex items-center gap-2">
        {PHASES.map((p, i) => {
          const state: "done" | "current" | "upcoming" =
            i < activeIdx ? "done" : i === activeIdx ? "current" : "upcoming";
          return (
            <div key={p.key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    state === "current"
                      ? "bg-zinc-900 dark:bg-zinc-100"
                      : state === "done"
                        ? "bg-zinc-400 dark:bg-zinc-600"
                        : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    state === "current"
                      ? "text-zinc-900 dark:text-zinc-100"
                      : state === "done"
                        ? "text-zinc-500"
                        : "text-zinc-400 dark:text-zinc-600"
                  }`}
                >
                  {p.label}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800" />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        {PHASES[activeIdx]?.description}
      </div>
    </div>
  );
}
