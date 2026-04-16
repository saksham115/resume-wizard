import {
  client,
  header,
  logResult,
  DEFAULT_MODEL,
  type ProbeResult,
} from "./common";

// Probe 4: pellet_config behavior + model pinning.
// Tests:
//   A) Pin flagship model explicitly → response must return the pinned model
//   B) Omit model, pellet_config.mode="quality" → observe routing_decision + picked model
//   C) Omit model, pellet_config.mode="cheapest" → observe
// Pass: A works (pinning is reliable, required for chat continuity).
// Observation-only for B/C: tells us whether mode hints can be trusted.

type PelletMetadata = {
  routing_decision?: string;
  model_confidence?: number;
  latency_ms?: number;
  cost_usd?: number;
};

type Resp = { model?: string; pellet_metadata?: PelletMetadata };

async function callRaw(body: Record<string, unknown>): Promise<Resp> {
  const resp = await fetch(
    `${client.baseURL ?? "https://getpellet.io/v1"}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PELLET_API_KEY}`,
      },
      body: JSON.stringify(body),
    }
  );
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  return (await resp.json()) as Resp;
}

export async function probePelletConfig(): Promise<ProbeResult> {
  header("Probe 4: pellet_config + model pinning");
  const observations: {
    test: string;
    model: string | null;
    routing: string | null;
    note: string;
  }[] = [];

  // A) Explicit flagship pin — MUST work for chat continuity
  try {
    const r = await callRaw({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: "Say hi in 3 words." }],
    });
    observations.push({
      test: "pin-flagship",
      model: r.model ?? null,
      routing: r.pellet_metadata?.routing_decision ?? null,
      note: r.model === DEFAULT_MODEL ? "pinned as requested" : "did not pin",
    });
  } catch (e) {
    observations.push({
      test: "pin-flagship",
      model: null,
      routing: null,
      note: `error: ${(e as Error).message}`,
    });
  }

  // B) Auto-route with quality hint
  try {
    const r = await callRaw({
      messages: [
        {
          role: "user",
          content:
            "Summarize in one sentence: what are the key elements of a great CV bullet?",
        },
      ],
      pellet_config: { mode: "quality" },
    });
    observations.push({
      test: "auto-quality",
      model: r.model ?? null,
      routing: r.pellet_metadata?.routing_decision ?? null,
      note: `picked ${r.model ?? "?"} @ confidence ${r.pellet_metadata?.model_confidence ?? "?"}`,
    });
  } catch (e) {
    observations.push({
      test: "auto-quality",
      model: null,
      routing: null,
      note: `error: ${(e as Error).message}`,
    });
  }

  // C) Auto-route with cheapest hint
  try {
    const r = await callRaw({
      messages: [{ role: "user", content: "Hi." }],
      pellet_config: { mode: "cheapest" },
    });
    observations.push({
      test: "auto-cheapest",
      model: r.model ?? null,
      routing: r.pellet_metadata?.routing_decision ?? null,
      note: `picked ${r.model ?? "?"}`,
    });
  } catch (e) {
    observations.push({
      test: "auto-cheapest",
      model: null,
      routing: null,
      note: `error: ${(e as Error).message}`,
    });
  }

  // Gate passes if we can reliably pin the flagship model (A). B/C are observational.
  const pin = observations.find((o) => o.test === "pin-flagship");
  const pass = !!pin && pin.model === DEFAULT_MODEL;

  return {
    name: "pellet-config",
    pass,
    summary: observations
      .map((o) => `${o.test}: ${o.note} (model=${o.model}, routing=${o.routing})`)
      .join(" | "),
    data: observations,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probePelletConfig().then(logResult);
}
