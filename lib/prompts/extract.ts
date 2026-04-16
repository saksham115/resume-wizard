/**
 * Extract a raw CV (text) into the app's structured JSON shape.
 *
 * Hallucination guardrail (plan §Key decision 4): the parser MUST NOT invent
 * content. Every bullet's text is preserved verbatim, status="original",
 * grounded_in=<its own id>.
 */
export const EXTRACT_SYSTEM = `You are a careful CV parser. You extract the content of a CV into a structured JSON shape.

STRICT RULES:
1. Do NOT invent any information. If a field isn't in the CV, omit it or use an empty array.
2. Do NOT rephrase, paraphrase, or "clean up" the user's bullet text — preserve it verbatim.
3. Every bullet's "status" MUST be "original".
4. Every bullet's "grounded_in" MUST equal its own "id" (original content is self-grounded).
5. Generate stable ids: "exp_<n>" for experience, "edu_<n>", "prj_<n>", "cert_<n>", "awd_<n>", "cus_<n>" for other sections; bullets "<parent_id>_b_<n>".
6. Preserve dates as written in the CV. Use "Present" for current roles. If a date is not present in the source CV, OMIT the field entirely — never fabricate dates.
7. Skills: group similar items into categories ("Programming Languages", "Frameworks", "Tools", "Spoken Languages", etc.).

Respond with ONLY the JSON object. No prose, no markdown fences.`;

export function extractUserPrompt(cvText: string): string {
  return `Extract the CV below into a JSON object matching this schema:

{
  "personal": {
    "name": string,
    "email"?: string,
    "phone"?: string,
    "location"?: string,
    "links": [{"type": "linkedin"|"github"|"portfolio"|"twitter"|"other", "url": string, "label"?: string}]
  },
  "summary"?: string,
  "experience": [{
    "id": string, "company": string, "title": string, "location"?: string,
    "startDate": string, "endDate": string,
    "bullets": [{"id": string, "text": string, "status": "original", "grounded_in": "<same as id>"}]
  }],
  "education": [{
    "id": string, "institution": string, "degree": string, "field"?: string,
    "startDate": string, "endDate": string, "bullets": [...same shape]
  }],
  "projects": [{"id": string, "name": string, "link"?: string, "description"?: string, "bullets": [...]}],
  "skills": [{"category": string, "items": string[]}],
  "certifications": [{"id": string, "name": string, "issuer"?: string, "date"?: string}],
  "awards": [{"id": string, "name": string, "description"?: string, "date"?: string}],
  "custom": [{"id": string, "title": string, "bullets": [...]}]
}

CV content:
\`\`\`
${cvText}
\`\`\`

Remember: preserve bullet text verbatim, status="original", grounded_in=own id.`;
}
