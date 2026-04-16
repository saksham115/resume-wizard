/**
 * Client-side consumer of the /api/chat SSE stream.
 *
 * Yields typed events as the server emits them. Handles partial frames
 * across chunk boundaries.
 */

import type { CV, Message, Patch, Phase } from "@/lib/cv-schema";

export type DroppedPatch = { patch: unknown; reason: string };

export type ChatStreamEvent =
  | { type: "message"; text: string }
  | { type: "patches"; patches: Patch[]; dropped: DroppedPatch[] }
  | { type: "error"; error: string }
  | { type: "done" };

export async function* streamChat(
  body: { messages: Message[]; cv: CV; phase: Phase },
  signal?: AbortSignal
): AsyncGenerator<ChatStreamEvent> {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      if (body?.error) msg = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (!resp.body) throw new Error("server returned no body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const ev = parseFrame(frame);
      if (ev) yield ev;
    }
  }
}

function parseFrame(frame: string): ChatStreamEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  const dataStr = dataLines.join("\n");
  if (!dataStr) return null;

  let data: unknown;
  try {
    data = JSON.parse(dataStr);
  } catch {
    return null;
  }

  switch (eventName) {
    case "message":
      return { type: "message", text: (data as { text: string }).text };
    case "patches": {
      const d = data as { patches: Patch[]; dropped: DroppedPatch[] };
      return { type: "patches", patches: d.patches, dropped: d.dropped };
    }
    case "error":
      return { type: "error", error: (data as { error: string }).error };
    case "done":
      return { type: "done" };
    default:
      return null;
  }
}

/** Compute the next `msg_N` id given the current messages array. */
export function nextMessageId(messages: Message[]): string {
  let max = 0;
  for (const m of messages) {
    const match = m.id.match(/^msg_(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `msg_${max + 1}`;
}
