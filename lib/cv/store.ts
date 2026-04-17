"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type CV,
  type Message,
  type Patch,
  type Phase,
  type Score,
  emptyCV,
} from "@/lib/cv-schema";
import { applyPatches } from "@/lib/agent/patches";

type SessionState = {
  cv: CV;
  phase: Phase;
  messages: Message[];
  score: Score | null;
  resumeId: string | null;
  setPhase: (phase: Phase) => void;
  setCv: (cv: CV) => void;
  setScore: (score: Score) => void;
  setResumeId: (id: string | null) => void;
  addMessage: (msg: Message) => void;
  updateLastAssistantMessage: (appendText: string) => void;
  applyPatches: (patches: Patch[]) => void;
  finalizeBullet: (bulletId: string) => void;
  editBullet: (bulletId: string, text: string) => void;
  removeBullet: (bulletId: string) => void;
  advancePhase: () => void;
  reset: () => void;
};

const PHASE_ORDER: Phase[] = [
  "upload",
  "extract-confirm",
  "score",
  "define",
  "refine",
  "polish",
  "export",
];

const initial = (): Pick<
  SessionState,
  "cv" | "phase" | "messages" | "score" | "resumeId"
> => ({
  cv: emptyCV(),
  phase: "upload",
  messages: [],
  score: null,
  resumeId: null,
});

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...initial(),
      setPhase: (phase) => set({ phase }),
      setResumeId: (id) => set({ resumeId: id }),
      // Replacing the CV invalidates everything derived from it — score and
      // chat history are tied to the previous CV content.
      setCv: (cv) => set({ cv, score: null, messages: [] }),
      setScore: (score) => set({ score }),
      addMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),
      updateLastAssistantMessage: (appendText) =>
        set((s) => {
          const last = s.messages[s.messages.length - 1];
          if (!last || last.role !== "assistant") return s;
          return {
            messages: [
              ...s.messages.slice(0, -1),
              { ...last, content: last.content + appendText },
            ],
          };
        }),
      applyPatches: (patches) =>
        set((s) => {
          const result = applyPatches(s.cv, patches);
          return {
            cv: result.cv,
            phase: result.nextPhase ?? s.phase,
          };
        }),
      finalizeBullet: (bulletId) =>
        set((s) => ({
          cv: applyPatches(s.cv, [
            { op: "finalize_bullet", bullet_id: bulletId },
          ]).cv,
        })),
      editBullet: (bulletId, text) =>
        set((s) => {
          // Update text then finalize — two-step via the same helper.
          const r1 = applyPatches(s.cv, [
            {
              op: "update_bullet",
              bullet_id: bulletId,
              text,
              grounded_in: "user_edit",
            },
          ]);
          const r2 = applyPatches(r1.cv, [
            { op: "finalize_bullet", bullet_id: bulletId },
          ]);
          return { cv: r2.cv };
        }),
      removeBullet: (bulletId) =>
        set((s) => ({
          cv: applyPatches(s.cv, [
            { op: "delete_bullet", bullet_id: bulletId },
          ]).cv,
        })),
      advancePhase: () =>
        set((s) => {
          const idx = PHASE_ORDER.indexOf(s.phase);
          if (idx < 0 || idx === PHASE_ORDER.length - 1) return s;
          return { phase: PHASE_ORDER[idx + 1] };
        }),
      reset: () => set(initial()),
    }),
    { name: "aicv-session" }
  )
);
