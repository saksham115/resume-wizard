import { auth } from "@/lib/auth";

/**
 * Validates the session and returns it, or throws a 401 Response.
 * Use at the top of API route handlers.
 */
export async function requireAuth(): Promise<{ user: { id: string; name?: string | null; email?: string | null; image?: string | null } }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return session as { user: { id: string; name?: string | null; email?: string | null; image?: string | null } };
}
