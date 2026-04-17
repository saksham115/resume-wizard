import { NextResponse } from "next/server";
import {
  pellet,
  DEFAULT_MODEL,
  parseLLMJson,
  stripNulls,
  assertPelletKey,
} from "@/lib/pellet";
import { CVSchema, ScoreSchema } from "@/lib/cv-schema";
import { SCORE_SYSTEM, scoreUserPrompt } from "@/lib/prompts/score";
import { requireAuth } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try { await requireAuth(); } catch (e) { if (e instanceof Response) return e; }

  try {
    assertPelletKey();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const body = (await req.json()) as { cv?: unknown };
  const cvResult = CVSchema.safeParse(body.cv);
  if (!cvResult.success) {
    return NextResponse.json(
      { error: "invalid CV payload", issues: cvResult.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  let resp;
  try {
    resp = await pellet.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SCORE_SYSTEM },
        {
          role: "user",
          content: scoreUserPrompt(JSON.stringify(cvResult.data, null, 2)),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Pellet request failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const choice = resp.choices[0];
  const raw = choice?.message?.content ?? "";
  if (!raw) {
    return NextResponse.json(
      { error: "empty response from Pellet" },
      { status: 502 }
    );
  }
  if (choice?.finish_reason === "length") {
    return NextResponse.json(
      { error: "Scoring was truncated; retry." },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = parseLLMJson(raw);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, rawPreview: raw.slice(0, 300) },
      { status: 502 }
    );
  }

  const validated = ScoreSchema.safeParse(stripNulls(parsed));
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "model output failed score schema",
        issues: validated.error.issues.slice(0, 5),
        raw: parsed,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ score: validated.data });
}
