// Server-side PDF/DOCX → plain text. Runs in Node, not browser.
// For image-only PDFs (low char count), caller routes user to manual entry.

import mammoth from "mammoth";

// pdfjs-dist's legacy ESM build runs in Node with worker disabled.
// Dynamic import keeps it out of any client bundle.

const IMAGE_ONLY_CHAR_THRESHOLD = 200;

export type ParseResult = {
  text: string;
  imageOnly: boolean; // true if extracted text is below threshold
  pages?: number;
};

export async function extractPdfText(buffer: ArrayBuffer): Promise<ParseResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const uint8 = new Uint8Array(buffer);
  const pdf = await pdfjs.getDocument({
    data: uint8,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    text += pageText + "\n";
  }
  const cleaned = text.trim();
  return {
    text: cleaned,
    imageOnly: cleaned.length < IMAGE_ONLY_CHAR_THRESHOLD,
    pages: pdf.numPages,
  };
}

export async function extractDocxText(
  buffer: ArrayBuffer
): Promise<ParseResult> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(buffer),
  });
  const cleaned = result.value.trim();
  return {
    text: cleaned,
    imageOnly: cleaned.length < IMAGE_ONLY_CHAR_THRESHOLD,
  };
}

export async function parseCvFile(
  file: File | Blob,
  filename: string
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return extractPdfText(buffer);
  if (lower.endsWith(".docx")) return extractDocxText(buffer);
  throw new Error(
    `Unsupported file type "${filename}". Upload a PDF or DOCX.`
  );
}
