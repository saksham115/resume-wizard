import {
  client,
  header,
  logResult,
  DEFAULT_MODEL,
  type ProbeResult,
} from "./common";

// Probe 2: JSON-mode reliability on an extract task (10 runs).
// We measure TWO rates:
//   - raw:      direct JSON.parse on the response content
//   - repaired: parse after stripping markdown code fences
// Pass criterion uses the repaired rate, since fence-stripping is trivial
// and always-on in the product.
// Gate: ≥95% → ship as-is. 80–95% → repair layer mandatory (already in).
// <80% → escalate.

const SAMPLE_CV = `
John Doe
john.doe@example.com | +91 98765 43210 | Bangalore

Education
B.Tech Computer Science, IIT Madras (2020–2024)

Experience
Software Engineering Intern, Acme Corp (Jun 2023 – Aug 2023)
- Built a feature
- Shipped some code
`;

const PROMPT = `Extract the CV below into JSON with keys: name, email, education[], experience[].
Each education has {degree, institution, years}. Each experience has {title, company, period, bullets[]}.
Respond with ONLY valid JSON. No prose, no markdown.

CV:
${SAMPLE_CV}`;

function stripFences(s: string): string {
  const trimmed = s.trim();
  // ```json ... ``` or ``` ... ```
  const m = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1].trim() : trimmed;
}

export async function probeJsonMode(runs = 10): Promise<ProbeResult> {
  header(`Probe 2: JSON-mode reliability (${runs} runs)`);
  let rawValid = 0;
  let repairedValid = 0;
  const failures: string[] = [];
  let sample = "";

  for (let i = 0; i < runs; i++) {
    try {
      const resp = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: "user", content: PROMPT }],
        response_format: { type: "json_object" },
        // @ts-expect-error: Pellet-specific routing config
        pellet_config: { mode: "quality" },
      });
      const text = resp.choices[0]?.message?.content ?? "";
      if (i === 0) sample = text;

      try {
        JSON.parse(text);
        rawValid += 1;
      } catch {
        /* raw fail */
      }

      const cleaned = stripFences(text);
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object") repairedValid += 1;
        else failures.push(`run ${i}: parsed non-object`);
      } catch (e) {
        failures.push(`run ${i}: ${(e as Error).message.slice(0, 60)}`);
      }
    } catch (e) {
      failures.push(`run ${i}: request error ${(e as Error).message}`);
    }
  }

  const rawRate = rawValid / runs;
  const repairedRate = repairedValid / runs;
  const pass = repairedRate >= 0.95;

  return {
    name: "json-mode",
    pass,
    summary: `raw=${rawValid}/${runs} (${(rawRate * 100).toFixed(0)}%) | repaired=${repairedValid}/${runs} (${(repairedRate * 100).toFixed(0)}%)${failures.length ? ` — fails: ${failures.slice(0, 2).join("; ")}` : ""}`,
    data: { rawValid, repairedValid, runs, rawRate, repairedRate, sample: sample.slice(0, 200), failures },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probeJsonMode().then(logResult);
}
