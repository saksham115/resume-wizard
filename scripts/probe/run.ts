import { logResult, type ProbeResult } from "./common";
import { probeStreaming } from "./01-streaming";
import { probeJsonMode } from "./02-json-mode";
import { probeVision } from "./03-vision";
import { probePelletConfig } from "./04-pellet-config";
import { probeLatency } from "./05-latency";

async function main() {
  const results: ProbeResult[] = [];
  results.push(await probeStreaming());
  logResult(results[results.length - 1]);
  results.push(await probeJsonMode());
  logResult(results[results.length - 1]);
  results.push(await probePelletConfig());
  logResult(results[results.length - 1]);
  results.push(await probeLatency());
  logResult(results[results.length - 1]);
  results.push(await probeVision());
  logResult(results[results.length - 1]);

  console.log("\n── Summary ──");
  const passed = results.filter((r) => r.pass).length;
  console.log(`${passed}/${results.length} probes passed`);
  for (const r of results) {
    console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}`);
  }

  const anyFail = results.some((r) => !r.pass);
  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error("probe runner crashed:", e);
  process.exit(2);
});
