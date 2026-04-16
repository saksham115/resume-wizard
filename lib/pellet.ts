import OpenAI from "openai";

const PELLET_BASE_URL =
  process.env.PELLET_BASE_URL ?? "https://getpellet.io/v1";

export const pellet = new OpenAI({
  apiKey: process.env.PELLET_API_KEY ?? "",
  baseURL: PELLET_BASE_URL,
});

// Flagship model on Pellet. Pinned because `pellet_config.mode` hints don't
// reliably steer routing (see scripts/probe/FINDINGS.md). Every
// quality-critical call uses this explicitly.
export const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";

export type PelletMode = "auto" | "fastest" | "cheapest" | "quality";

export type PelletConfig = {
  mode?: PelletMode;
  model?: string;
};

export function assertPelletKey(): void {
  if (!process.env.PELLET_API_KEY) {
    throw new Error(
      "PELLET_API_KEY is not set. Add it to .env.local before making requests."
    );
  }
}

/**
 * Pellet-served OSS models (Llama 3.3, DeepSeek, etc.) wrap JSON responses in
 * markdown code fences even when response_format: json_object is set. Strip
 * before JSON.parse. Tolerates a missing closing fence (response truncated at
 * max_tokens) and extracts the outermost JSON object if fences are absent.
 * See scripts/probe/FINDINGS.md for evidence.
 */
export function stripFences(s: string): string {
  let t = s.trim();
  // Strip opening fence (with or without "json" tag)
  const open = t.match(/^```(?:json)?\s*/i);
  if (open) t = t.slice(open[0].length);
  // Strip closing fence if present
  t = t.replace(/\s*```\s*$/i, "");
  return t.trim();
}

/**
 * Parse JSON from an LLM response, auto-stripping code fences. Throws with a
 * helpful message on failure (includes truncated raw for debugging).
 */
export function parseLLMJson<T = unknown>(raw: string): T {
  const cleaned = stripFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `failed to parse LLM JSON: ${(e as Error).message}. raw="${cleaned.slice(0, 300)}"`
    );
  }
}

/**
 * Recursively drop null-valued keys from an object (and replace null array
 * members with undefined, filtered out). OSS models often emit `null` for
 * fields the prompt says to omit; our Zod schema uses `.optional()` which
 * rejects null. Normalize before validation.
 */
export function stripNulls(input: unknown): unknown {
  if (input === null) return undefined;
  if (Array.isArray(input)) {
    return input
      .map(stripNulls)
      .filter((v) => v !== undefined);
  }
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const cleaned = stripNulls(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return input;
}
