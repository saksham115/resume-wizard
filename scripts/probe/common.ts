import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import OpenAI from "openai";

// Next.js uses .env.local by convention; tsx doesn't, so load explicitly.
loadEnv({ path: resolve(process.cwd(), ".env.local") });

export const PELLET_BASE_URL =
  process.env.PELLET_BASE_URL ?? "https://getpellet.io/v1";

if (!process.env.PELLET_API_KEY) {
  console.error(
    "[probe] PELLET_API_KEY is not set. Add it to .env.local and re-run."
  );
  process.exit(1);
}

export const client = new OpenAI({
  apiKey: process.env.PELLET_API_KEY,
  baseURL: PELLET_BASE_URL,
});

// Flagship model on Pellet — used for chat continuity where quality matters.
// See /v1/models for current catalog. Do NOT pass "auto" — Pellet rejects it.
export const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
export const LIGHT_MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo";

export type ProbeResult = {
  name: string;
  pass: boolean;
  summary: string;
  data?: unknown;
};

export async function listPelletModels(): Promise<
  { id: string; params?: string; tier?: string }[]
> {
  const resp = await fetch(`${PELLET_BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${process.env.PELLET_API_KEY}` },
  });
  if (!resp.ok) throw new Error(`models list HTTP ${resp.status}`);
  const body = (await resp.json()) as {
    data: { id: string; params?: string; tier?: string }[];
  };
  return body.data;
}

export function fmt(ms: number): string {
  return `${ms.toFixed(0)}ms`;
}

export function header(title: string) {
  console.log(`\n── ${title} ──`);
}

export function logResult(r: ProbeResult) {
  const mark = r.pass ? "PASS" : "FAIL";
  console.log(`[${mark}] ${r.name}: ${r.summary}`);
}
