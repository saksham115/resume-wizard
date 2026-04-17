/**
 * /api/chat — SSE streaming endpoint for the Define/Refine/Polish agent.
 *
 * Contract:
 *   POST { messages: Message[], cv: CV, phase: Phase }
 *   returns text/event-stream with events:
 *     message   { text: "<delta>" }         streamed text of the assistant turn
 *     patches   { patches: Patch[], dropped: Dropped[] }  validated patches
 *     error     { error: string }           non-fatal processing error
 *     done      {}                          stream end
 *
 * Design notes:
 *   - One model call per turn. No multi-stage fan-out.
 *   - Incremental tag parser streams <message> text as it arrives, accumulates
 *     <patches> until closing tag, then validates.
 *   - Hallucination check: update_bullet / add_bullet patches with numeric
 *     entities not found in the grounded user message + original bullet are
 *     silently dropped and returned in `dropped` (plan §Design 4).
 */

import {
  pellet,
  DEFAULT_MODEL,
  assertPelletKey,
} from "@/lib/pellet";
import {
  CVSchema,
  MessageSchema,
  PatchSchema,
  PhaseSchema,
  type CV,
  type Message,
  type Patch,
  type UpdateBulletPatch,
  type AddBulletPatch,
} from "@/lib/cv-schema";
import { buildChatSystem } from "@/lib/prompts/chat-system";
import { AgentResponseParser } from "@/lib/agent/response-parser";
import { checkNoNewNumbers } from "@/lib/agent/hallucination-check";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  messages: z.array(MessageSchema),
  cv: CVSchema,
  phase: PhaseSchema,
});

const CHAT_LIMIT_PER_MIN = 60;

export async function POST(req: Request) {
  try { await requireAuth(); } catch (e) { if (e instanceof Response) return e; }

  const rl = checkRateLimit(
    `chat:${getClientKey(req)}`,
    CHAT_LIMIT_PER_MIN
  );
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    assertPelletKey();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `invalid body: ${(e as Error).message}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, cv, phase } = body;
  const system = buildChatSystem(phase, cv);
  const pelletMessages = [
    { role: "system" as const, content: system },
    ...messages.map(toPelletMessage),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const parser = new AgentResponseParser();

      try {
        const upstream = await pellet.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: pelletMessages,
          stream: true,
          max_tokens: 4096,
        });

        for await (const chunk of upstream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;
          for (const ev of parser.feed(delta)) {
            await handleEvent(ev, messages, cv, send);
          }
        }
        for (const ev of parser.finish()) {
          await handleEvent(ev, messages, cv, send);
        }

        send("done", {});
      } catch (e) {
        send("error", { error: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function handleEvent(
  ev: import("@/lib/agent/response-parser").ParserEvent,
  messages: Message[],
  cv: CV,
  send: (event: string, data: unknown) => void
) {
  if (ev.type === "message-delta") {
    send("message", { text: ev.text });
  } else if (ev.type === "patches") {
    const { ok, dropped } = validatePatches(ev.parsed, cv, messages);
    send("patches", { patches: ok, dropped });
  } else if (ev.type === "error") {
    send("error", { error: ev.error });
  }
}

function toPelletMessage(m: Message): {
  role: "user" | "assistant";
  content: string;
} {
  // Prefix user messages with [msg_id] so the model can ground its patches.
  const prefix = m.role === "user" ? `[${m.id}] ` : "";
  return { role: m.role, content: prefix + m.content };
}

// ---- Patch validation + hallucination check -------------------------

type DroppedPatch = { patch: unknown; reason: string };

function validatePatches(
  raw: unknown[],
  cv: CV,
  messages: Message[]
): { ok: Patch[]; dropped: DroppedPatch[] } {
  const ok: Patch[] = [];
  const dropped: DroppedPatch[] = [];

  for (const item of raw) {
    const result = PatchSchema.safeParse(item);
    if (!result.success) {
      dropped.push({
        patch: item,
        reason: `schema: ${result.error.issues[0]?.message ?? "unknown"}`,
      });
      continue;
    }
    const patch = result.data;

    if (patch.op === "update_bullet" || patch.op === "add_bullet") {
      const h = hallucinationCheck(patch, cv, messages);
      if (!h.ok) {
        dropped.push({
          patch,
          reason: `hallucination: new numeric entities ${h.fabricated.join(", ")}`,
        });
        continue;
      }
    }
    ok.push(patch);
  }

  return { ok, dropped };
}

function hallucinationCheck(
  patch: UpdateBulletPatch | AddBulletPatch,
  cv: CV,
  messages: Message[]
): { ok: boolean; fabricated: string[] } {
  const grounded = messages.find((m) => m.id === patch.grounded_in);
  const sources: string[] = [];
  if (grounded) sources.push(grounded.content);

  if (patch.op === "update_bullet") {
    const orig = findBulletText(cv, patch.bullet_id);
    if (orig) sources.push(orig);
  }
  // Give us a last-resort: combined user-turn content (sometimes grounding
  // references get confused; avoid over-aggressive rejection).
  sources.push(messages.filter((m) => m.role === "user").map((m) => m.content).join(" "));

  return checkNoNewNumbers(patch.text, sources);
}

function findBulletText(cv: CV, bulletId: string): string | null {
  for (const section of ["experience", "education", "projects", "custom"] as const) {
    const items = cv[section] as { bullets: { id: string; text: string }[] }[];
    for (const it of items) {
      const b = it.bullets.find((b) => b.id === bulletId);
      if (b) return b.text;
    }
  }
  return null;
}
