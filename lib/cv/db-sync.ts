"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession as useAuthSession } from "next-auth/react";
import { useSession } from "@/lib/cv/store";

/**
 * Syncs the Zustand store with the server-side resume database.
 *
 * Loading strategy (avoids race conditions):
 * - If resumeId is provided (from dashboard URL ?id): fetch from DB,
 *   hydrate store. DB is authoritative because user explicitly chose
 *   this CV.
 * - If no resumeId (new CV flow): store starts fresh. After first
 *   setCv (extract), create a new resume row, get the ID back.
 *
 * Saving strategy:
 * - Debounced 2s on every store change (while authenticated and
 *   resumeId is set).
 * - During chat streaming, updateLastAssistantMessage fires per
 *   chunk — the debounce timer resets, so no save fires mid-stream.
 */
export function useDbSync() {
  const { status } = useAuthSession();
  const isAuthed = status === "authenticated";
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const creatingRef = useRef(false);

  // Load from DB when resumeId is set and we haven't loaded yet
  const loadFromDb = useCallback(async (resumeId: string) => {
    try {
      const res = await fetch(`/api/resume/${resumeId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.cv) {
        useSession.setState({
          cv: data.cv,
          score: data.score ?? null,
          phase: data.phase ?? "upload",
          messages: data.messages ?? [],
          resumeId,
        });
      }
    } catch {
      // Network error — fall back to whatever's in localStorage
    }
  }, []);

  // Create a new resume row in DB
  const createResume = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const state = useSession.getState();
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: state.cv,
          score: state.score,
          phase: state.phase,
          messages: state.messages,
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        useSession.setState({ resumeId: id });
        // Update URL without navigation
        const url = new URL(window.location.href);
        url.searchParams.set("id", id);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      // Will retry on next state change
    } finally {
      creatingRef.current = false;
    }
  }, []);

  // Save current state to DB
  const saveToDb = useCallback(async (resumeId: string) => {
    try {
      const state = useSession.getState();
      await fetch(`/api/resume/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: state.cv,
          score: state.score,
          phase: state.phase,
          messages: state.messages,
        }),
      });
    } catch {
      // Silent fail — will retry on next state change
    }
  }, []);

  // On mount: load from DB if resumeId is in URL
  useEffect(() => {
    if (!isAuthed || loaded.current) return;
    loaded.current = true;

    const url = new URL(window.location.href);
    const idFromUrl = url.searchParams.get("id");
    if (idFromUrl) {
      // User came from dashboard — load this specific resume
      loadFromDb(idFromUrl);
    } else {
      // New CV flow — reset store to fresh state
      useSession.getState().reset();
    }
  }, [isAuthed, loadFromDb]);

  // Subscribe to store changes → debounced save
  useEffect(() => {
    if (!isAuthed) return;

    const unsub = useSession.subscribe((state, prevState) => {
      // Skip if only resumeId changed (avoid save loop on ID set)
      if (
        state.cv === prevState.cv &&
        state.score === prevState.score &&
        state.phase === prevState.phase &&
        state.messages === prevState.messages
      ) {
        return;
      }

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const current = useSession.getState();

        if (current.resumeId) {
          // Existing resume — update
          saveToDb(current.resumeId);
        } else if (current.phase !== "upload") {
          // New resume with actual content — create
          createResume();
        }
      }, 2000);
    });

    return () => {
      clearTimeout(saveTimer.current);
      unsub();
    };
  }, [isAuthed, saveToDb, createResume]);
}
