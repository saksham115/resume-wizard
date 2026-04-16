/**
 * Incremental streaming parser for the agent response protocol.
 *
 * Protocol (strict form):
 *   <message>{text}</message>
 *   <patches>[{...}]</patches>
 *
 * Tolerant to: models that skip the <message>…</message> wrappers entirely
 * and just emit prose followed by <patches>…</patches>. In that case we treat
 * everything before <patches> as the message. Stripping also drops stray
 * <message>/</message> tags wherever they appear so they don't leak into the
 * visible text.
 *
 * `feed(chunk)` can be called with any-sized slices; returns zero-or-more
 * ParserEvents observed so far. `finish()` drains the trailing buffer and
 * handles missing-closing-tag edge cases gracefully.
 */

export type ParserEvent =
  | { type: "message-delta"; text: string }
  | { type: "patches"; raw: string; parsed: unknown[] }
  | { type: "error"; error: string };

type State = "pre-patches" | "in-patches" | "done";

const OPEN_PATCHES = "<patches>";
const CLOSE_PATCHES = "</patches>";
const MSG_TAG_RE = /<\/?message>\s*/g;

// Longest tag we need to recognize at a chunk boundary: `</message>` = 10.
const MAX_TAG_LEN = 10;

function stripMessageTags(s: string): string {
  return s.replace(MSG_TAG_RE, "");
}

/**
 * Safe position to emit up to while streaming. If the buffer ends with a
 * `<` that might be the start of a tag (within MAX_TAG_LEN chars of end),
 * don't emit past it — hold the partial tag in the buffer until more data
 * arrives. Complete tags embedded earlier in the buffer are handled by
 * stripMessageTags on the emitted slice.
 */
function safeEmitCut(buffer: string): number {
  const lastLt = buffer.lastIndexOf("<");
  if (lastLt < 0) return buffer.length;
  if (buffer.length - lastLt <= MAX_TAG_LEN) return lastLt;
  return buffer.length;
}

export class AgentResponseParser {
  private buffer = "";
  private state: State = "pre-patches";

  feed(chunk: string): ParserEvent[] {
    this.buffer += chunk;
    return this.drain();
  }

  finish(): ParserEvent[] {
    const events = this.drain();

    if (this.state === "pre-patches") {
      const remaining = stripMessageTags(this.buffer);
      if (remaining.trim().length > 0) {
        events.push({ type: "message-delta", text: remaining });
      }
      // Silent-patches response: no <patches> block at all.
      events.push({ type: "patches", raw: "[]", parsed: [] });
      this.buffer = "";
      this.state = "done";
    } else if (this.state === "in-patches") {
      events.push({
        type: "error",
        error: "stream ended inside <patches> without </patches>",
      });
      this.state = "done";
    }
    return events;
  }

  private drain(): ParserEvent[] {
    const events: ParserEvent[] = [];
    let progress = true;

    while (progress) {
      progress = false;

      if (this.state === "pre-patches") {
        const patchesIdx = this.buffer.indexOf(OPEN_PATCHES);
        if (patchesIdx >= 0) {
          const head = this.buffer.slice(0, patchesIdx);
          const msg = stripMessageTags(head);
          if (msg.length > 0) {
            events.push({ type: "message-delta", text: msg });
          }
          this.buffer = this.buffer.slice(patchesIdx + OPEN_PATCHES.length);
          this.state = "in-patches";
          progress = true;
          continue;
        }
        // No <patches> yet. Emit everything up to the last `<` in the tail
        // (if it's within MAX_TAG_LEN of the end — could be a tag starting).
        const cut = safeEmitCut(this.buffer);
        if (cut > 0) {
          const emit = stripMessageTags(this.buffer.slice(0, cut));
          if (emit.length > 0) {
            events.push({ type: "message-delta", text: emit });
          }
          this.buffer = this.buffer.slice(cut);
        }
        continue;
      }

      if (this.state === "in-patches") {
        const endIdx = this.buffer.indexOf(CLOSE_PATCHES);
        if (endIdx >= 0) {
          const raw = this.buffer.slice(0, endIdx).trim();
          this.buffer = this.buffer.slice(endIdx + CLOSE_PATCHES.length);
          events.push(parsePatches(raw));
          this.state = "done";
          progress = true;
        }
        continue;
      }
    }

    return events;
  }
}

function parsePatches(raw: string): ParserEvent {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const body = stripped.length === 0 ? "[]" : stripped;
  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) {
      return {
        type: "error",
        error: "<patches> body was valid JSON but not an array",
      };
    }
    return { type: "patches", raw, parsed };
  } catch (e) {
    return {
      type: "error",
      error: `<patches> JSON parse: ${(e as Error).message}`,
    };
  }
}
