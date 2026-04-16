"use client";

/**
 * Canonical CV template.
 *
 * The right-pane preview IS the print output — same DOM, same styles.
 * @media print rules (in app/globals.css) strip screen chrome (shadow, border,
 * dark-mode colors, ghost markers) so what the user sees is what the browser's
 * "Save as PDF" produces.
 *
 * Pass a `cv` prop to render an arbitrary CV (used by /preview for debugging);
 * otherwise reads from the Zustand session store.
 *
 * "Over one page" warning (v0-scope.md Cut list: 'Auto-layout detection →
 * simple over-1-page warning'): observes the rendered sheet height and shows
 * a banner when it exceeds a one-page threshold. Stripped from print.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/cv/store";
import type { CV } from "@/lib/cv-schema";
import { Header } from "./sections/Header";
import { Summary } from "./sections/Summary";
import { Experience } from "./sections/Experience";
import { Projects } from "./sections/Projects";
import { Education } from "./sections/Education";
import { Skills } from "./sections/Skills";
import { Other } from "./sections/Other";
import { Custom } from "./sections/Custom";

// One US Letter / A4 content area ≈ 10.4in × 96dpi ≈ 1000px after margins.
// A little slack so small overages don't false-positive.
const ONE_PAGE_PX = 1040;

export function CVPreview({ cv: cvProp }: { cv?: CV } = {}) {
  const storeCv = useSession((s) => s.cv);
  const cv = cvProp ?? storeCv;
  const sheetRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => setOverflow(el.scrollHeight > ONE_PAGE_PX);
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    return () => obs.disconnect();
  }, [cv]);

  return (
    <div className="mx-auto w-full max-w-[8.5in]">
      {overflow && (
        <div className="no-print mb-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900/60 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          Your CV may run over one page. Consider cutting weaker bullets,
          tightening phrasing, or removing filler content before exporting.
        </div>
      )}
      <div ref={sheetRef} className="cv-sheet">
        <Header personal={cv.personal} />
        {cv.summary && <Summary summary={cv.summary} />}
        {cv.experience.length > 0 && <Experience items={cv.experience} />}
        {cv.projects.length > 0 && <Projects items={cv.projects} />}
        {cv.education.length > 0 && <Education items={cv.education} />}
        {cv.skills.length > 0 && <Skills items={cv.skills} />}
        <Other certifications={cv.certifications} awards={cv.awards} />
        {cv.custom.length > 0 && <Custom items={cv.custom} />}
      </div>
    </div>
  );
}
