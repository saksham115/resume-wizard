/**
 * Server-side entity diff for hallucination prevention (plan §Design 4).
 *
 * On every update_bullet / add_bullet, we compare numeric entities in the
 * rewritten text to numeric entities in the source material (the user
 * message the rewrite is grounded in, plus the original bullet if updating).
 * If the rewrite contains a new number/quantity that wasn't in the source,
 * the patch is flagged as a possible fabrication.
 *
 * Numbers are the single highest-risk hallucination for CVs ("improved by
 * 40%" when the user said "improved"). Proper-noun checking has too many
 * false positives to be useful in MVP; we rely on the prompt + to-review
 * UI confirmation for those.
 */

export type HallucinationResult = {
  ok: boolean;
  fabricated: string[];
};

// Match numbers with optional units / suffixes. Deliberately strict on the
// boundary to avoid matching e.g. "h3" inside "https".
const NUMBER_RE =
  /(?<![a-z])\$?\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:%|k|K|M|B|x|\+))?(?![a-z])/g;

// Common small integers appear in boilerplate ("1 of 2") — ignore 0–4 unless
// they carry a unit/percent. Reduces false-positive rate significantly.
const TRIVIAL_INTS = new Set(["0", "1", "2", "3", "4"]);

function extractNumericEntities(text: string): string[] {
  const matches = text.matchAll(NUMBER_RE);
  const out: string[] = [];
  for (const m of matches) {
    const raw = m[0].trim();
    const stripped = raw.replace(/[\s,]/g, "").toLowerCase();
    // Drop trivial bare integers
    if (TRIVIAL_INTS.has(stripped) || TRIVIAL_INTS.has(stripped.replace(/[^0-9]/g, ""))) {
      if (!/[%kmbx+]/.test(stripped)) continue;
    }
    out.push(stripped);
  }
  return out;
}

function toSet(items: string[]): Set<string> {
  return new Set(items);
}

/**
 * Return the list of numeric entities in `rewritten` that do not appear in
 * any of the `sourceTexts`. An empty list means the rewrite is safe.
 *
 * Matching is case-insensitive and ignores separators. A number "40%" in
 * the rewrite is satisfied by "40%" OR "40" in the source (safer to match
 * loose — we already accept prompt-level assertions about style).
 */
export function checkNoNewNumbers(
  rewritten: string,
  sourceTexts: string[]
): HallucinationResult {
  const sourceNums = toSet(
    sourceTexts.flatMap((t) => extractNumericEntities(t))
  );
  const bareSource = new Set(
    [...sourceNums].map((n) => n.replace(/[^0-9.]/g, ""))
  );

  const rewrittenNums = extractNumericEntities(rewritten);
  const fabricated: string[] = [];
  for (const n of rewrittenNums) {
    if (sourceNums.has(n)) continue;
    // Accept "40%" as grounded by bare "40"
    const bare = n.replace(/[^0-9.]/g, "");
    if (bare && bareSource.has(bare)) continue;
    fabricated.push(n);
  }
  return { ok: fabricated.length === 0, fabricated };
}
