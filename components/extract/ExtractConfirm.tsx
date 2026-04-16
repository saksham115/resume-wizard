"use client";

import { useState } from "react";
import { useSession } from "@/lib/cv/store";
import { track } from "@/lib/funnel";

export function ExtractConfirm() {
  const cv = useSession((s) => s.cv);
  const setPhase = useSession((s) => s.setPhase);
  const reset = useSession((s) => s.reset);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Does this look right?</h2>
        <p className="text-sm text-zinc-500 mt-1">
          We extracted your CV content below. If anything&apos;s wrong, start
          over and try a cleaner upload. Otherwise, we&apos;ll score it next.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-5">
        <div>
          <div className="text-lg font-semibold">
            {cv.personal.name || "(name missing)"}
          </div>
          <div className="text-xs text-zinc-500">
            {[cv.personal.email, cv.personal.phone, cv.personal.location]
              .filter(Boolean)
              .join("  ·  ")}
          </div>
          {cv.personal.links.length > 0 && (
            <div className="text-xs text-zinc-500 mt-0.5">
              {cv.personal.links
                .map((l) => l.label ?? l.url)
                .join("  ·  ")}
            </div>
          )}
        </div>

        {cv.summary && (
          <Section title="Summary">
            <p className="text-sm">{cv.summary}</p>
          </Section>
        )}

        {cv.experience.length > 0 && (
          <Section title="Experience">
            {cv.experience.map((e) => (
              <div key={e.id} className="mt-2 first:mt-0">
                <div className="text-sm">
                  <span className="font-medium">{e.title}</span>
                  {e.company && <> · {e.company}</>}
                  {e.location && <> · {e.location}</>}
                  {(e.startDate || e.endDate) && (
                    <span className="text-zinc-500">
                      {" · "}
                      {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                {e.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 mt-1 ml-2 space-y-0.5">
                    {e.bullets.map((b) => (
                      <li key={b.id}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.education.length > 0 && (
          <Section title="Education">
            {cv.education.map((ed) => (
              <div key={ed.id} className="mt-2 first:mt-0">
                <div className="text-sm">
                  <span className="font-medium">{ed.degree}</span>
                  {ed.field && <>, {ed.field}</>}
                  {ed.institution && <> · {ed.institution}</>}
                  {(ed.startDate || ed.endDate) && (
                    <span className="text-zinc-500">
                      {" · "}
                      {[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}
                    </span>
                  )}
                </div>
                {ed.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 mt-1 ml-2 space-y-0.5">
                    {ed.bullets.map((b) => (
                      <li key={b.id}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.projects.length > 0 && (
          <Section title="Projects">
            {cv.projects.map((p) => (
              <div key={p.id} className="mt-2 first:mt-0">
                <div className="text-sm font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-zinc-500">{p.description}</div>
                )}
                {p.bullets.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 mt-1 ml-2 space-y-0.5">
                    {p.bullets.map((b) => (
                      <li key={b.id}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {cv.skills.length > 0 && (
          <Section title="Skills">
            {cv.skills.map((s, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{s.category}:</span>{" "}
                {s.items.join(", ")}
              </div>
            ))}
          </Section>
        )}

        {(cv.certifications.length > 0 || cv.awards.length > 0) && (
          <Section title="Other">
            {cv.certifications.map((c) => (
              <div key={c.id} className="text-sm">
                {c.name}
                {c.issuer && <> · {c.issuer}</>}
                {c.date && (
                  <span className="text-zinc-500"> · {c.date}</span>
                )}
              </div>
            ))}
            {cv.awards.map((a) => (
              <div key={a.id} className="text-sm">
                {a.name}
                {a.date && (
                  <span className="text-zinc-500"> · {a.date}</span>
                )}
              </div>
            ))}
          </Section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            track("extract_confirmed", {
              experience_count: cv.experience.length,
              education_count: cv.education.length,
              projects_count: cv.projects.length,
            });
            setPhase("score");
          }}
          className="h-10 px-4 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Looks good — score my CV
        </button>
        <button
          type="button"
          onClick={() => {
            track("session_reset", { from: "extract-confirm" });
            reset();
          }}
          className="h-10 px-4 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Start over
        </button>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="ml-auto text-xs text-zinc-500 underline"
        >
          {showRaw ? "Hide" : "Show"} raw JSON
        </button>
      </div>

      {showRaw && (
        <pre className="text-xs bg-zinc-100 dark:bg-zinc-900 rounded-md p-4 overflow-auto max-h-96">
          {JSON.stringify(cv, null, 2)}
        </pre>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
        {title}
      </h3>
      {children}
    </div>
  );
}
