/**
 * Ground-truth top-3 gaps per CV sample.
 *
 * Authored by hand after reading each extracted CV. The Stage-1 gap-detection
 * prompt must rank these as its top 3 for the sample to "hit."
 *
 * Scoring semantics (M5a):
 *   hit@3(sample) = |model_top3 ∩ truth_top3| / 3
 *   overall hit-rate = mean over samples
 *   M5b gate: overall ≥ 0.70
 */

export const GAP_TYPES = [
  "missing_summary",
  "weak_quantification", // bullets lack numbers/outcomes
  "missing_projects_section", // no projects section at all
  "missing_project_context", // projects present but without description or stack
  "weak_skills_grouping", // skills listed flat vs. categorized
  "missing_links", // no LinkedIn / GitHub / portfolio
  "thin_experience", // 0–1 experience items (or 1 with 1 weak bullet)
  "no_impact_in_bullets", // action described but no result/why-it-mattered; or filler "Technologies used" bullets
  "missing_dates", // experience/education without date ranges
  "weak_education_details", // no CGPA / honors / coursework bullets
  "bullet_phrasing", // grammar, verbs, concision, first-person issues
  "redundant_content", // duplication, 10th/12th on a college CV, filler bullets
  "missing_leadership_or_scope", // scale/team/ownership signals missing
  "weak_location_or_availability", // no location; remote status unclear
  "format_inconsistency", // inconsistent date/section formatting
] as const;

export type GapType = (typeof GAP_TYPES)[number];

export type Annotation = {
  id: string; // sample id (matches samples/<id>.json)
  notes?: string; // author's note explaining the annotation
  top_gaps: readonly GapType[]; // ranked, top 3+
};

/**
 * Annotations authored to be filled in after `prepare` extracts each CV.
 * The IDs here must match files in samples/. If the scorer sees a sample
 * without an annotation it is skipped (with a warning).
 */
export const ANNOTATIONS: Annotation[] = [
  {
    id: "candidate-01",
    notes:
      "Strong tech CV. Main weaknesses are section-level (no summary, education has no CGPA/honors/coursework) and some filler 'Technologies used' bullets without impact.",
    top_gaps: [
      "missing_summary",
      "weak_education_details",
      "no_impact_in_bullets",
    ],
  },
  {
    id: "candidate-02",
    notes:
      "Early draft. Only 1 experience item with a single weak bullet. First-person 'During this period I worked in...' phrasing. No metrics anywhere.",
    top_gaps: [
      "thin_experience",
      "bullet_phrasing",
      "weak_quantification",
    ],
  },
  {
    id: "candidate-03",
    notes:
      "Full 3-item experience section but ZERO projects and education has no CGPA/coursework bullets. No summary.",
    top_gaps: [
      "missing_projects_section",
      "weak_education_details",
      "missing_summary",
    ],
  },
  {
    id: "candidate-04",
    notes:
      "Decent structure but only 1 project. Education has no bullets. No summary. 'Technologies used' and 'Project, Commits...' filler bullets dilute impact.",
    top_gaps: [
      "missing_summary",
      "weak_education_details",
      "no_impact_in_bullets",
    ],
  },
  {
    id: "candidate-05",
    notes:
      "Experience item 2 is 'Open Source Contributor' with a bare list of project names and no context. Skills 'Spoken Languages' category mixes proficiency labels. No summary.",
    top_gaps: [
      "missing_summary",
      "bullet_phrasing",
      "weak_education_details",
    ],
  },
  {
    id: "candidate-06",
    notes:
      "Canonical version but ZERO projects despite strong OSS experience. Includes SSC 10th-standard row which is filler on a college CV. No summary.",
    top_gaps: [
      "missing_projects_section",
      "missing_summary",
      "redundant_content",
    ],
  },
  {
    id: "candidate-07",
    notes:
      "Latest draft. Similar pattern to candidate-04: only 1 project, education has no details, no summary, 'Technologies used' filler bullets.",
    top_gaps: [
      "missing_summary",
      "weak_education_details",
      "no_impact_in_bullets",
    ],
  },
];
