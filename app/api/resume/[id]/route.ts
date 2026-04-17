import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const [row] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, session.user.id)));

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      cv: row.cvData,
      score: row.score,
      phase: row.phase,
      messages: row.messages,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { cv, score, phase, messages } = body;

    if (!cv) {
      return NextResponse.json(
        { error: "cv is required" },
        { status: 400 },
      );
    }

    const title = cv?.personal?.name || "Untitled CV";

    const result = await db
      .update(resumes)
      .set({
        title,
        cvData: cv,
        score: score ?? null,
        phase: phase ?? "upload",
        messages: messages ?? [],
        updatedAt: new Date(),
      })
      .where(and(eq(resumes.id, id), eq(resumes.userId, session.user.id)));

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db
      .delete(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, session.user.id)));

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
