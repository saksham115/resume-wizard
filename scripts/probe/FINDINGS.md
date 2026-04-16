# Pellet capability probe — findings (2026-04-16)

Run against `https://getpellet.io/v1` with a `pk_live_*` key.

## Summary

| Probe | Result | Implication |
|---|---|---|
| 1. Streaming SSE | **PASS** | First token in ~1.5–2s; chunks flow cleanly; finish_reason set. Safe to build streaming on. |
| 2. JSON-mode reliability | **PASS (with repair)** | Raw `response_format: json_object` valid 0/10. After stripping ```markdown``` fences: **10/10 valid**. Fence-stripping repair is mandatory in every JSON call. |
| 3. Vision OCR | **FAIL (feature absent)** | No vision-capable model in Pellet's /v1/models catalog (11 models checked). **Manual-entry fallback form becomes mandatory at M1.** Image-only PDFs cannot flow through Pellet. |
| 4. pellet_config + model pinning | **PASS** | Explicit model pin (`meta-llama/Llama-3.3-70B-Instruct-Turbo`) returns as requested. But `pellet_config.mode` hints do NOT reliably influence routing: both `quality` and `cheapest` were routed to `llama-3.1-8b-instant` (an 8B model). **Do not rely on mode — pin the flagship explicitly wherever quality matters.** |
| 5. First-token latency | **PASS** | Median 917ms across 3 runs (917 / 711 / 983). Well under the 5s gate. |

## Architectural adjustments for the build

1. **Default model:** `meta-llama/Llama-3.3-70B-Instruct-Turbo`. Pin it for all quality-critical calls: extraction, scoring, Define Stage-1 gap detection, Define Stage-2 conversational turns, Refine, hallucination-check retry. Do **not** pass `model: "auto"` — Pellet rejects it.
2. **Auto-routing:** Achieved by omitting the `model` field entirely. `pellet_config.mode` is observational only; trust the response's `pellet_metadata.model` to know what ran.
3. **JSON repair layer:** Every JSON-expecting call must pipe through a fence-stripper before `JSON.parse`. Put it in `lib/pellet.ts` and reuse.
4. **Vision fallback:** M1 upload pipeline must include a manual-entry form path. Detection: if `pdfjs-dist` extracts <200 chars from the PDF, treat as image-only and route user to the form. DOCX via `mammoth.js` remains the text path.
5. **Model catalog live:** The catalog can change. Pin the current flagship in `lib/pellet.ts` as a constant; re-run `npm run probe:config` periodically to confirm the model still exists.

## No mentor escalation required

Plan's M0.5 decision gate already prescribed the response to each finding here. Each "fail" has a documented contingency and no Pellet-alternative is being introduced.

## Current model catalog on this tenant (2026-04-16)

Flagship (70B+): `meta-llama/Llama-3.3-70B-Instruct-Turbo`, `llama-3.3-70b-versatile`,
`deepseek-ai/DeepSeek-V3.1`, `deepseek-ai/DeepSeek-R1`

Mid-range: `mistralai/Mistral-Small-24B-Instruct-2501`, `mistralai/Mixtral-8x7B-Instruct-v0.1`,
`Qwen/Qwen3.5-9B`, `Qwen/Qwen2.5-7B-Instruct-Turbo`, `llama-3.1-8b-instant`,
`meta-llama/Meta-Llama-3-8B-Instruct-Lite`

Lightweight: `google/gemma-3n-E4B-it`

Vision / multimodal: **none**
