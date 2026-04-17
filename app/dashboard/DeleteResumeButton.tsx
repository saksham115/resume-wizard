"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteResumeButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this CV? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/resume/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="ml-3 text-xs text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
    >
      {loading ? "..." : "Delete"}
    </button>
  );
}
