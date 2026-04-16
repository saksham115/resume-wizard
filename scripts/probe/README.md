# Pellet capability probe

Five smoke tests that gate all product work. From the build plan M0.5.

## Run

```bash
# All probes
npx tsx scripts/probe/run.ts

# Individual probes
npx tsx scripts/probe/01-streaming.ts
npx tsx scripts/probe/02-json-mode.ts
npx tsx scripts/probe/03-vision.ts
npx tsx scripts/probe/04-pellet-config.ts
npx tsx scripts/probe/05-latency.ts
```

## Probes

| # | Name | Pass criterion | If fail |
|---|---|---|---|
| 1 | Streaming SSE | First token <4s, ≥2 chunks, clean finish_reason | Fall back to non-streaming for v0 |
| 2 | JSON-mode reliability (10 runs) | ≥95% valid JSON | 80–95% → add repair/retry layer at M1; <80% → escalate |
| 3 | Llama 3.2 Vision OCR | ≥50 chars extracted from each sample PDF | Manual-entry fallback form mandatory at M1 |
| 4 | pellet_config quality + model pin | Response names a known large model (Llama 3.3, DeepSeek V3, etc.) | Escalate — chat continuity needs pinning |
| 5 | First-token latency (quality) | Median <5s across 3 runs | Accept or negotiate with mentor |

## Prerequisites

- `PELLET_API_KEY` set in `.env.local`
- For Probe 3: place 3 image-only PDFs at `scripts/probe/samples/vision-{1,2,3}.pdf`
  (any image-only PDFs work — they test OCR capability, not CV-specific content)

## What happens if probes fail

No silent degradation. Each failure maps to a specific follow-up: add a fallback layer,
make a feature mandatory-optional, or escalate to mentor with data. Escalation options
are (a) accept the drop and ship, (b) descope the affected feature, (c) mentor decides —
never "switch to Claude/GPT-4" (Pellet is non-negotiable per client direction).
