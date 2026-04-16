# Eval harness (M5a)

Per the build plan, this is the gate for Define-phase prompt work (M5b). We run
the Stage-1 gap-detection prompt against a fixed set of CV samples, compare
against ground-truth annotations, and report hit-rate. Target: ≥70%.

## Structure

```
evals/
  synthesize.ts      # generates 7 synthetic CVs → samples/
  samples/*.json     # synthetic CV JSONs (committed, no real PII)
  annotations.ts     # ground-truth top-3 gaps per sample
  run.ts             # runs Stage-1 prompt against each sample, reports hit-rate
```

## Sample set (2026-04-16)

Samples are **fully synthetic** — authored by hand in `synthesize.ts`, not
extracted from any real CV. Each of the 7 archetypes is crafted to match a
specific annotation in `annotations.ts`, so ground-truth gaps are known by
construction. Names, institutions, companies are plausible Indian early-career
/ fresh-grad engineering profiles but entirely fictional.

We originally planned to anonymize real user-supplied CVs, but even with
names/emails stripped, bullet content (specific OSS projects, employers, etc.)
could identify a person. Synthetic-from-scratch is safer.

Known limitation: synthetic CVs don't capture real-world CV weirdness
(typos, OCR artifacts, odd section ordering). When the mentor sources real
target-demographic CVs, we should rotate 2–3 into the eval set.

## Running

```bash
npm run evals:synthesize   # one-off — regenerates samples/ from synthesize.ts
npm run evals:run          # scorer — runs current Stage-1 prompt, reports hit-rate
```

`synthesize` is offline (no API calls). `run` needs `PELLET_API_KEY`.

## Gap taxonomy

See `annotations.ts` for the enum. The prompt's job is to rank the top 3 of
these gap types for a given CV. Scorer compares sets, not ordering (for MVP).
