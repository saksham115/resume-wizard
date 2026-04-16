import { NextResponse } from "next/server";
import {
  pellet,
  DEFAULT_MODEL,
  parseLLMJson,
  stripNulls,
  assertPelletKey,
} from "@/lib/pellet";
import { CVSchema } from "@/lib/cv-schema";
import { EXTRACT_SYSTEM, extractUserPrompt } from "@/lib/prompts/extract";
import { parseCvFile } from "@/lib/parse-file";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_TEXT_LEN = 50;
const EXTRACT_LIMIT_PER_MIN = 10;

export async function POST(req: Request) {
  const rl = checkRateLimit(
    `extract:${getClientKey(req)}`,
    EXTRACT_LIMIT_PER_MIN
  );
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    assertPelletKey();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // Two acceptable shapes:
  //   A) multipart/form-data with `file` — server parses PDF/DOCX → text → CV
  //   B) application/json with `{ text }` — caller supplies raw text (manual-entry path)
  let cvText: string;
  let imageOnly = false;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing file field" }, { status: 400 });
    }
    try {
      const parsed = await parseCvFile(file, file.name);
      cvText = parsed.text;
      imageOnly = parsed.imageOnly;
    } catch (e) {
      return NextResponse.json(
        { error: `file parse failed: ${(e as Error).message}` },
        { status: 400 }
      );
    }
    if (imageOnly) {
      return NextResponse.json(
        {
          error: "image-only PDF",
          imageOnly: true,
          hint: "This PDF appears to be image-only. Pellet has no vision model available, so text can't be extracted automatically. Please use manual entry instead.",
        },
        { status: 422 }
      );
    }
  } else if (contentType.includes("application/json")) {
    const body = (await req.json()) as { text?: string };
    cvText = (body.text ?? "").trim();
  } else {
    return NextResponse.json(
      { error: `unsupported content-type: ${contentType}` },
      { status: 415 }
    );
  }

  if (!cvText || cvText.length < MIN_TEXT_LEN) {
    return NextResponse.json(
      { error: "CV text too short to parse", length: cvText.length },
      { status: 400 }
    );
  }

  let resp;
  try {
    resp = await pellet.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: extractUserPrompt(cvText) },
      ],
      response_format: { type: "json_object" },
      // Full CVs can be several thousand tokens of structured JSON. Leave
      // headroom so the model doesn't truncate mid-object.
      max_tokens: 8192,
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
      {
        error:
          "Extraction was truncated (model hit its output limit). Your CV may be unusually long — try shortening it or splitting into a PDF with fewer pages.",
        rawPreview: raw.slice(0, 300),
      },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = parseLLMJson(raw);
  } catch (e) {
    return NextResponse.json(
      {
        error: `invalid JSON from model: ${(e as Error).message}`,
        rawPreview: raw.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const validated = CVSchema.safeParse(stripNulls(parsed));
  if (!validated.success) {
    return NextResponse.json(
      {
        error: "model output failed schema validation",
        issues: validated.error.issues.slice(0, 5),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ cv: validated.data });
}
