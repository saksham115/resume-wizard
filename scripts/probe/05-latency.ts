import {
  client,
  header,
  logResult,
  fmt,
  DEFAULT_MODEL,
  type ProbeResult,
} from "./common";

// Probe 5: first-token latency in quality mode.
// Pass: median first-token <5s across 3 runs.

export async function probeLatency(runs = 3): Promise<ProbeResult> {
  header(`Probe 5: first-token latency (${runs} runs)`);
  const times: number[] = [];

  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    try {
      const stream = (await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "user",
            content:
              "Write a one-sentence tagline for a resume-building startup.",
          },
        ],
        stream: true,
        pellet_config: { mode: "quality" },
      } as unknown as Parameters<
        typeof client.chat.completions.create
      >[0])) as AsyncIterable<{
        choices?: { delta?: { content?: string } }[];
      }>;

      let first = -1;
      for await (const part of stream) {
        if (part.choices?.[0]?.delta?.content) {
          first = Date.now() - start;
          break;
        }
      }
      if (first >= 0) times.push(first);
      // Do not iterate again — leaving the stream hanging is fine for a probe.
    } catch (e) {
      return {
        name: "latency",
        pass: false,
        summary: `error: ${(e as Error).message}`,
      };
    }
  }

  const sorted = times.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const pass = median !== undefined && median < 5000;
  return {
    name: "latency",
    pass,
    summary: `first-token runs=${times.map(fmt).join(", ")}, median=${median ? fmt(median) : "n/a"}`,
    data: { times, median },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probeLatency().then(logResult);
}
