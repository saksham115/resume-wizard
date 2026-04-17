import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignInButton } from "./SignInButton";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build your CV in 15 minutes.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Upload your rough draft. Let our AI mentor guide you section by
            section to a polished, recruiter-ready one-pager.
          </p>
        </div>
        {session ? (
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to dashboard
          </Link>
        ) : (
          <SignInButton />
        )}
      </div>
    </main>
  );
}
