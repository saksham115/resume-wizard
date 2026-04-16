/**
 * Run the Stage-1 define-gaps prompt against every sample and report hit-rate.
 *
 * Scoring:
 *   per-sample hit@3 = |model_top3 ∩ truth_top3| / 3
 *   overall = mean over samples
 *
 * M5b gate: overall ≥ 0.70
 */

import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import OpenAI from "openai";
import { ANNOTATIONS, GAP_TYPES, type GapType } from "./annotations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const SAMPLES_DIR = resolve(__dirname, "samples");

type SampleFile = { _meta: unknown; cv: unknown };

async function main() {
  if (!process.env.PELLET_API_KEY) {
    console.error("PELLET_API_KEY not set in .env.local");
    process.exit(1);
  }

  const { DEFAULT_MODEL, parseLLMJson } = await import("../lib/pellet");
  const { DEFINE_GAPS_SYSTEM, defineGapsUserPrompt } = await import(
    "../lib/prompts/define-gaps"
  );

  const pellet = new OpenAI({
    apiKey: process.env.PELLET_API_KEY,
    baseURL: process.env.PELLET_BASE_URL ?? "https://getpellet.io/v1",
  });

  const files = readdirSync(SAMPLES_DIR).filter((f) => f.endsWith(".json"));
  const truthById = new Map(ANNOTATIONS.map((a) => [a.id, a.top_gaps]));

  console.log(
    `\nRunning Stage-1 gap detection against ${files.length} samples…`
  );
  console.log(`Gate: ≥70% mean hit@3. Below = M5b work not done.\n`);

  const results: { id: string; model: GapType[]; truth: readonly GapType[]; hit: number }[] =
    [];

  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    const truth = truthById.get(id);
    if (!truth) {
      console.log(`${id}: (no annotation — skipped)`);
      continue;
    }

    const sample = JSON.parse(
      readFileSync(resolve(SAMPLES_DIR, file), "utf-8")
    ) as SampleFile;

    let modelGaps: GapType[] = [];
    try {
      const resp = await pellet.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: DEFINE_GAPS_SYSTEM },
          {
            role: "user",
            content: defineGapsUserPrompt(JSON.stringify(sample.cv, null, 2)),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 256,
      });
      const raw = resp.choices[0]?.message?.content ?? "";
      const parsed = parseLLMJson<{ top_gaps?: string[] }>(raw);
      modelGaps = (parsed.top_gaps ?? [])
        .filter((g): g is GapType => (GAP_TYPES as readonly string[]).includes(g))
        .slice(0, 3);
    } catch (e) {
      console.log(`${id}: ERROR — ${(e as Error).message.slice(0, 120)}`);
      continue;
    }

    const truthSet = new Set(truth);
    const intersect = modelGaps.filter((g) => truthSet.has(g)).length;
    const hit = intersect / 3;
    results.push({ id, model: modelGaps, truth, hit });

    const mark =
      hit >= 2 / 3 ? "✓" : hit >= 1 / 3 ? "~" : "✗";
    console.log(
      `${mark} ${id}  hit=${(hit * 100).toFixed(0)}%  model=[${modelGaps.join(", ")}]  truth=[${truth.join(", ")}]`
    );
  }

  if (results.length === 0) {
    console.log("\nNo samples scored. Run `npm run evals:prepare` first.");
    process.exit(1);
  }

  const mean = results.reduce((s, r) => s + r.hit, 0) / results.length;
  const pct = (mean * 100).toFixed(1);
  const gate = mean >= 0.7;
  console.log(
    `\nMean hit@3 across ${results.length} samples: ${pct}%  ${gate ? "[PASS ≥70%]" : "[FAIL <70% — M5b prompt work needed]"}`
  );
  process.exit(gate ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
