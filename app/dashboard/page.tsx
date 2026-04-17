import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { DeleteResumeButton } from "./DeleteResumeButton";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const phaseLabels: Record<string, string> = {
  upload: "Upload",
  "extract-confirm": "Confirming",
  score: "Scored",
  define: "Define",
  refine: "Refine",
  polish: "Polish",
  export: "Export",
};

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const rows = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      phase: resumes.phase,
      score: resumes.score,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, session.user.id))
    .orderBy(desc(resumes.updatedAt));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12 sm:px-8">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-500 tracking-wide">
            AI CV Builder
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {session.user.name ?? session.user.email}
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your CVs</h1>
        <Link
          href="/build"
          className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New CV
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-sm text-zinc-500">
            No CVs yet. Click &quot;+ New CV&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const score = r.score as { total?: number } | null;
            return (
              <div
                key={r.id}
                className="group flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <Link
                  href={`/build?id=${r.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="font-medium text-sm truncate">
                    {r.title || "Untitled CV"}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs">
                      {phaseLabels[r.phase] ?? r.phase}
                    </span>
                    {score?.total != null && (
                      <span>Score: {score.total}/100</span>
                    )}
                    <span>{timeAgo(r.updatedAt)}</span>
                  </div>
                </Link>
                <DeleteResumeButton id={r.id} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
