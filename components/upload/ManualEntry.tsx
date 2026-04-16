"use client";

import { useState } from "react";
import { useSession } from "@/lib/cv/store";

type Props = {
  onBack: () => void;
  reason?: "image-only" | "no-file";
};

const PLACEHOLDER = `e.g.

Priya Sharma
priya@example.com | +91 98765 43210 | Bengaluru

Education
B.Tech Computer Science, NIT Trichy (2020-2024)
CGPA: 8.7 / 10

Experience
Software Engineer Intern, Acme Systems (Jun 2023 - Aug 2023)
- Built internal dashboard reducing report time by 40%
- Designed API endpoints handling 10k daily requests

Projects
ML Pipeline for Feedback (2023)
- Built classifier achieving 87% accuracy

Skills
Languages: Python, Java, TypeScript
Frameworks: React, FastAPI`;

export function ManualEntry({ onBack, reason }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCv = useSession((s) => s.setCv);
  const setPhase = useSession((s) => s.setPhase);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const body = (await resp.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const { cv } = (await resp.json()) as { cv: unknown };
      setCv(cv as Parameters<typeof setCv>[0]);
      setPhase("extract-confirm");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Paste your CV content</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {reason === "image-only"
            ? "Your PDF looks image-based, so we can't extract text from it automatically. Paste or type the content of your CV below and we'll take it from there."
            : "Paste or type the content of your CV below and we'll take it from there."}
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={16}
        placeholder={PLACEHOLDER}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 p-3 text-sm bg-white dark:bg-zinc-900 font-mono"
      />
      <div className="text-xs text-zinc-500">
        {text.length < 50
          ? `${text.length} / 50 characters minimum`
          : `${text.length} characters`}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading || text.length < 50}
          className="h-10 px-4 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-50 hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {loading ? "Parsing…" : "Continue"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="h-10 px-4 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Back
        </button>
      </div>
    </div>
  );
}
