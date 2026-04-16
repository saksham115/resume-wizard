"use client";

/**
 * /preview — debug route for the CV template.
 *
 * Renders CVPreview with a hand-crafted CV that exercises every bullet state
 * (original, to-review, to-complete, finalized) so the template and ghost
 * styling can be inspected without going through the upload → chat flow.
 * Also lets you hit Cmd/Ctrl+P to verify the print CSS.
 *
 * Not linked from the main app. Remove or gate behind dev-only when shipping.
 */

import { CVPreview } from "@/components/cv/CVPreview";
import type { CV } from "@/lib/cv-schema";

const SAMPLE: CV = {
  personal: {
    name: "Sample Candidate",
    email: "sample@example.com",
    phone: "+91 99999 00000",
    location: "Bengaluru, India",
    links: [
      { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
      { type: "github", url: "https://example.com/github", label: "GitHub" },
      { type: "portfolio", url: "https://example.com/portfolio", label: "Portfolio" },
    ],
  },
  summary:
    "Early-career software engineer with a bias for shipping. Interested in backend systems, developer tooling, and the infrastructure under them.",
  experience: [
    {
      id: "exp_1",
      title: "Software Engineer",
      company: "Example Labs",
      location: "Bengaluru",
      startDate: "Jul 2024",
      endDate: "Present",
      bullets: [
        {
          id: "exp_1_b_1",
          text: "Designed and shipped a realtime events pipeline handling 2M events/day; cut p99 latency from 180ms to 42ms.",
          status: "original",
          grounded_in: "exp_1_b_1",
        },
        {
          id: "exp_1_b_2",
          text: "Owned migration of the auth stack from sessions to JWT across 7 services with zero downtime.",
          status: "finalized",
          grounded_in: "exp_1_b_2",
        },
        {
          id: "exp_1_b_3",
          text: "Reduced infra spend ~22% by profiling workers and rightsizing the compute fleet.",
          status: "to-review",
          grounded_in: "msg_42",
        },
      ],
    },
    {
      id: "exp_2",
      title: "Software Engineering Intern",
      company: "Example Corp",
      startDate: "May 2023",
      endDate: "Aug 2023",
      bullets: [
        {
          id: "exp_2_b_1",
          text: "Tell me what you built here and what impact it had.",
          status: "to-complete",
        },
      ],
    },
  ],
  projects: [
    {
      id: "prj_1",
      name: "kv-lite",
      description: "A distributed in-memory key-value store with Raft replication.",
      bullets: [
        {
          id: "prj_1_b_1",
          text: "Custom WAL with 2-phase commit for durability; ~80k writes/sec on a 3-node cluster.",
          status: "original",
          grounded_in: "prj_1_b_1",
        },
      ],
    },
  ],
  education: [
    {
      id: "edu_1",
      degree: "B.Tech",
      field: "Computer Science",
      institution: "Example Institute of Technology",
      startDate: "2020",
      endDate: "2024",
      bullets: [
        {
          id: "edu_1_b_1",
          text: "Add your CGPA, honors, or relevant coursework here.",
          status: "to-complete",
        },
      ],
    },
  ],
  skills: [
    { category: "Languages", items: ["Go", "Python", "TypeScript", "C++", "SQL"] },
    {
      category: "Backend & Infra",
      items: ["PostgreSQL", "Redis", "Kafka", "AWS", "Terraform", "Docker"],
    },
    { category: "Tools", items: ["Git", "Grafana", "OpenTelemetry", "Linux"] },
  ],
  certifications: [],
  awards: [],
  custom: [],
};

export default function PreviewPage() {
  return (
    <div className="cv-print-root min-h-screen bg-zinc-50 dark:bg-zinc-900 py-10">
      <div className="no-print mx-auto mb-6 max-w-3xl px-6 text-sm text-zinc-600 dark:text-zinc-400">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Template preview
        </h1>
        <p className="mt-1">
          Debug route. Exercises all four bullet states so you can see the ghost
          styling: <span className="font-medium">original</span>,{" "}
          <span className="font-medium">finalized</span>,{" "}
          <span className="font-medium">to-review</span> (amber highlight), and{" "}
          <span className="font-medium">to-complete</span> (dashed placeholder).
          Press <kbd className="rounded border px-1.5 py-0.5 text-xs">Cmd/Ctrl+P</kbd>{" "}
          to test print output — ghost chrome should strip cleanly.
        </p>
      </div>
      <div className="cv-print-body px-4">
        <CVPreview cv={SAMPLE} />
      </div>
    </div>
  );
}
