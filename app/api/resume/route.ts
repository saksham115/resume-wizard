import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await requireAuth();
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

    return NextResponse.json({ resumes: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { cv, score, phase, messages } = body;

    if (!cv) {
      return NextResponse.json(
        { error: "cv is required" },
        { status: 400 },
      );
    }

    const title = cv?.personal?.name || "Untitled CV";

    const [row] = await db
      .insert(resumes)
      .values({
        userId: session.user.id,
        title,
        cvData: cv,
        score: score ?? null,
        phase: phase ?? "upload",
        messages: messages ?? [],
      })
      .returning({ id: resumes.id });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
