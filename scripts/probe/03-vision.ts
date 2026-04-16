import { header, logResult, listPelletModels, type ProbeResult } from "./common";

// Probe 3: Llama 3.2 Vision / any vision capability on Pellet.
// Pre-checks /v1/models for vision-capable models before attempting upload.
// If no vision model is advertised, we skip the upload and flag the absence —
// per build plan M0.5, this triggers "manual-entry fallback mandatory at M1."

export async function probeVision(): Promise<ProbeResult> {
  header("Probe 3: Vision OCR capability");

  try {
    const models = await listPelletModels();
    // Tight match on known vision/multimodal tokens in model IDs.
    const visionModels = models.filter((m) =>
      /(vision|VL|VLM|multimodal|-mm\b|-img\b)/i.test(m.id)
    );

    if (visionModels.length === 0) {
      return {
        name: "vision",
        pass: false,
        summary: `no vision-capable model in Pellet catalog (${models.length} models checked). Action: manual-entry fallback form becomes mandatory at M1. Image-only PDFs cannot be extracted via Pellet.`,
        data: { available: models.map((m) => m.id), visionModels },
      };
    }

    // If we got here, there's a vision model — we'd test OCR against it.
    // (Kept as a placeholder since this Pellet instance has none.)
    return {
      name: "vision",
      pass: true,
      summary: `vision models advertised: ${visionModels.map((m) => m.id).join(", ")}. Full OCR test TODO.`,
      data: { visionModels },
    };
  } catch (e) {
    return {
      name: "vision",
      pass: false,
      summary: `model catalog error: ${(e as Error).message}`,
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  probeVision().then(logResult);
}
