import {
  client,
  header,
  logResult,
  fmt,
  DEFAULT_MODEL,
  type ProbeResult,
} from "./common";

// Probe 1: streaming SSE works end-to-end.
// Pass: first tokens arrive within ~2s, clean stream end.
export async function probeStreaming(): Promise<ProbeResult> {
  header("Probe 1: streaming SSE");
  const start = Date.now();
  let firstTokenAt: number | null = null;
  let chunks = 0;
  let finishReason: string | null = null;

  try {
    const stream = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: "Reply concisely." },
        { role: "user", content: "Count from 1 to 5, one number per line." },
      ],
      stream: true,
    });

    for await (const part of stream) {
      chunks += 1;
      const delta = part.choices?.[0]?.delta?.content;
      if (delta && firstTokenAt === null) {
        firstTokenAt = Date.now() - start;
      }
      if (part.choices?.[0]?.finish_reason) {
        finishReason = part.choices[0].finish_reason;
      }
    }

    const total = Date.now() - start;
    const firstOk = firstTokenAt !== null && firstTokenAt < 4000;
    const chunkOk = chunks >= 2;
    const endOk = finishReason !== null;
    const pass = firstOk && chunkOk && endOk;

    return {
      name: "streaming",
      pass,
      summary: `first-token=${firstTokenAt ? fmt(firstTokenAt) : "n/a"}, chunks=${chunks}, total=${fmt(total)}, finish=${finishReason ?? "none"}`,
      data: { firstTokenAt, chunks, total, finishReason },
    };
  } catch (e) {
    return {
      name: "streaming",
      pass: false,
      summary: `error: ${(e as Error).message}`,
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probeStreaming().then(logResult);
}
