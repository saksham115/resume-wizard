/**
 * Score a structured CV on 5 dimensions + completeness.
 * Used on the score screen (M2) as the hook that motivates the user to
 * continue into the Define phase.
 */
export const SCORE_SYSTEM = `You are a senior HR mentor grading a fresher's or early-career CV. You are fair but candid: weak CVs should score 40–60, average 60–75, strong 75–90. Nothing gets 100.

Respond with ONLY a JSON object, no prose, no markdown fences.`;

export function scoreUserPrompt(cvJson: string): string {
  return `Grade the CV JSON below on 5 dimensions (each out of 20) and a separate completeness score (0–100).

Dimensions:
1. "education_credentials" — institution tier, relevance, CGPA/honors/coursework when present.
2. "experience_relevance" — alignment to any clear target role, seniority shown, reputable orgs.
3. "quantifiable_impact" — specific metrics, numbers, outcomes in bullets (the single biggest differentiator).
4. "clarity_structure" — grammar, verb choice, concision, logical section order, one-pager economy.
5. "skills_information" — breadth, specificity, grouping (Languages / Frameworks / Tools), relevance.

Separately assess "completeness" (0–100): a complete fresher CV has name + contact + education + at least one experience or project + skills + preferably a summary and relevant links. Deduct for missing sections, thin experience (0–1 items), no quantified bullets, missing contact info, no links.

"total" = sum of the 5 dimension scores (0–100).

"feedback_bullets": 3–5 short, plain-English observations about what would move the score up. Written to the candidate, in second person ("your…"). No generic advice; be specific to what's in or missing from this CV.

Return exactly this JSON shape:
{
  "completeness": <0-100>,
  "dimensions": {
    "education_credentials": <0-20>,
    "experience_relevance": <0-20>,
    "quantifiable_impact": <0-20>,
    "clarity_structure": <0-20>,
    "skills_information": <0-20>
  },
  "total": <sum of dimensions>,
  "feedback_bullets": ["...", "..."]
}

CV JSON:
\`\`\`
${cvJson}
\`\`\``;
}
