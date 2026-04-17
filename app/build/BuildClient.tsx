"use client";

import { useState } from "react";
import { useSession } from "@/lib/cv/store";
import { useDbSync } from "@/lib/cv/db-sync";
import { CVUpload } from "@/components/upload/CVUpload";
import { ManualEntry } from "@/components/upload/ManualEntry";
import { ExtractConfirm } from "@/components/extract/ExtractConfirm";
import { ScoreCard } from "@/components/score/ScoreCard";
import { Workspace } from "@/components/workspace/Workspace";

export function BuildClient() {
  useDbSync();

  const phase = useSession((s) => s.phase);
  const isWorkspace =
    phase === "define" ||
    phase === "refine" ||
    phase === "polish" ||
    phase === "export";

  return isWorkspace ? <Workspace /> : <FullWidthFlow phase={phase} />;
}

function FullWidthFlow({ phase }: { phase: string }) {
  const [manualMode, setManualMode] = useState<
    false | "image-only" | "no-file"
  >(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12 sm:px-8">
      <header className="mb-10">
        <div className="text-sm font-medium text-zinc-500 tracking-wide">
          AI CV Builder
        </div>
      </header>

      <div className="flex-1">
        {phase === "upload" && !manualMode && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Let&apos;s start with what you&apos;ve got.
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Upload your current CV as a PDF or DOCX. We&apos;ll extract the
                content and guide you through improving it.
              </p>
            </div>
            <CVUpload onImageOnlyPdf={() => setManualMode("image-only")} />
            <div className="text-sm text-zinc-500">
              Don&apos;t have a CV yet?{" "}
              <button
                type="button"
                onClick={() => setManualMode("no-file")}
                className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Type it in manually
              </button>
              .
            </div>
          </div>
        )}

        {phase === "upload" && manualMode && (
          <ManualEntry
            reason={manualMode === "image-only" ? "image-only" : undefined}
            onBack={() => setManualMode(false)}
          />
        )}

        {phase === "extract-confirm" && <ExtractConfirm />}
        {phase === "score" && <ScoreCard />}
      </div>
    </main>
  );
}
