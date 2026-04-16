"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/cv/store";
import type { Score } from "@/lib/cv-schema";
import { track } from "@/lib/funnel";

const DIMENSION_LABELS: Record<keyof Score["dimensions"], string> = {
  education_credentials: "Education & Credentials",
  experience_relevance: "Experience Relevance",
  quantifiable_impact: "Quantifiable Impact",
  clarity_structure: "Clarity & Structure",
  skills_information: "Skills & Information",
};

export function ScoreCard() {
  const cv = useSession((s) => s.cv);
  const score = useSession((s) => s.score);
  const setScore = useSession((s) => s.setScore);
  const setPhase = useSession((s) => s.setPhase);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (score) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const resp = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv }),
          signal: ctrl.signal,
        });
        if (!resp.ok) {
          const body = (await resp.json()) as { error?: string };
          throw new Error(body.error ?? `HTTP ${resp.status}`);
        }
        const data = (await resp.json()) as { score: Score };
        if (!ctrl.signal.aborted) {
          setScore(data.score);
          track("score_shown", {
            total: data.score.total,
            completeness: data.score.completeness,
          });
        }
      } catch (e) {
        if (!ctrl.signal.aborted) setError((e as Error).message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [cv, score, retryKey, setScore]);

  if (loading && !score) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500">
        Scoring your CV…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-6 space-y-3">
        <div className="text-sm font-medium text-red-800 dark:text-red-200">
          Couldn&apos;t score your CV
        </div>
        <div className="text-xs text-red-700 dark:text-red-300">{error}</div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setRetryKey((k) => k + 1);
          }}
          className="h-9 px-3 rounded-md border border-red-300 dark:border-red-800 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!score) return null;

  const target = Math.min(99, Math.max(90, score.total + 10));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Your CV scores
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tabular-nums">
                {score.total}
              </span>
              <span className="text-2xl text-zinc-400 font-light">/ 100</span>
            </div>
            <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
              Let&apos;s get it to <span className="font-medium">{target}+</span>.
              Takes about 15 minutes.
            </div>
          </div>

          <div className="sm:ml-auto w-full sm:w-56">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Completeness</span>
              <span className="tabular-nums">{score.completeness}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all"
                style={{ width: `${score.completeness}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {(Object.keys(DIMENSION_LABELS) as (keyof Score["dimensions"])[]).map(
            (key) => {
              const value = score.dimensions[key];
              const pct = (value / 20) * 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {DIMENSION_LABELS[key]}
                    </span>
                    <span className="text-zinc-500 tabular-nums">
                      {value} / 20
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {score.feedback_bullets.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
          <h3 className="text-sm font-medium">What&apos;s holding you back</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {score.feedback_bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-zinc-400 shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            track("phase_advanced", { to: "define", from: "score" });
            setPhase("define");
          }}
          className="h-11 px-5 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Let&apos;s fix this — start the conversation
        </button>
        <button
          type="button"
          onClick={() => setPhase("extract-confirm")}
          className="h-11 px-4 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Back
        </button>
      </div>
    </div>
  );
}
