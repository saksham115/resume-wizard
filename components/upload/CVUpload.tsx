"use client";

import { useRef, useState } from "react";
import { useSession } from "@/lib/cv/store";
import { track } from "@/lib/funnel";

type Props = {
  onImageOnlyPdf: () => void;
};

export function CVUpload({ onImageOnlyPdf }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const setCv = useSession((s) => s.setCv);
  const setPhase = useSession((s) => s.setPhase);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    track("upload_file_selected", {
      filename: file.name,
      size: file.size,
      mime: file.type,
    });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/extract", { method: "POST", body: fd });

      if (resp.status === 422) {
        const body = (await resp.json()) as { imageOnly?: boolean };
        if (body.imageOnly) {
          track("error", { where: "extract", kind: "image_only_pdf" });
          onImageOnlyPdf();
          return;
        }
      }

      if (!resp.ok) {
        const body = (await resp.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }

      const { cv } = (await resp.json()) as { cv: unknown };
      setCv(cv as Parameters<typeof setCv>[0]);
      setPhase("extract-confirm");
      track("extract_success", { source: "file" });
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      track("error", { where: "extract", msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging
            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {loading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Parsing your CV…
          </div>
        ) : (
          <>
            <p className="text-base">Drop your CV here</p>
            <p className="text-xs text-zinc-500 mt-1">PDF or DOCX</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-zinc-900 dark:bg-zinc-50 px-4 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Choose file
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
