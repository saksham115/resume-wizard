/**
 * Generate 7 fully synthetic CVs for the eval harness.
 *
 * Per user direction (2026-04-16), we don't use real CVs (leakage risk even
 * with anonymization — bullet content can still identify a person). Each
 * archetype is crafted to match an existing annotation in annotations.ts, so
 * the ground-truth gaps stay consistent.
 *
 * Run: `npm run evals:synthesize`
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, mkdirSync } from "node:fs";
import type { CV, Bullet, SkillCategory } from "../lib/cv-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SAMPLES_DIR = resolve(__dirname, "samples");

// Helpers -------------------------------------------------------------
const b = (id: string, text: string): Bullet => ({
  id,
  text,
  status: "original",
  grounded_in: id,
});

function exp(args: {
  id: string;
  company?: string;
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
}) {
  return {
    id: args.id,
    company: args.company,
    title: args.title,
    location: args.location,
    startDate: args.startDate,
    endDate: args.endDate,
    bullets: (args.bullets ?? []).map((t, i) => b(`${args.id}_b_${i + 1}`, t)),
  };
}

function edu(args: {
  id: string;
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
}) {
  return {
    id: args.id,
    institution: args.institution,
    degree: args.degree,
    field: args.field,
    startDate: args.startDate,
    endDate: args.endDate,
    bullets: (args.bullets ?? []).map((t, i) => b(`${args.id}_b_${i + 1}`, t)),
  };
}

function prj(args: {
  id: string;
  name: string;
  description?: string;
  link?: string;
  bullets?: string[];
}) {
  return {
    id: args.id,
    name: args.name,
    description: args.description,
    link: args.link,
    bullets: (args.bullets ?? []).map((t, i) => b(`${args.id}_b_${i + 1}`, t)),
  };
}

const skills = (pairs: [string, string[]][]): SkillCategory[] =>
  pairs.map(([category, items]) => ({ category, items }));

// Archetypes ----------------------------------------------------------

type Archetype = { id: string; candidate: string; stage: string; cv: CV };

const archetypes: Archetype[] = [
  // candidate-01 — strong CS new grad; gaps: missing_summary, weak_education_details, no_impact_in_bullets
  {
    id: "candidate-01",
    candidate: "A",
    stage: "strong-grad",
    cv: {
      personal: {
        name: "Rohan Mehta",
        email: "rohan.mehta@example.com",
        phone: "+91 98111 22233",
        location: "Bengaluru, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
          { type: "portfolio", url: "https://example.com/portfolio", label: "Portfolio" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Software Engineer",
          company: "Tradelane",
          location: "Bengaluru",
          startDate: "Jul 2024",
          endDate: "Present",
          bullets: [
            "Designed and shipped a realtime order-matching service in Go handling ~2M events/day, cutting p99 latency from 180ms to 42ms.",
            "Led migration of authentication stack from session cookies to JWT-based flow across 7 services with zero downtime.",
            "Reduced AWS spend 22% by profiling Celery workers and rightsizing EC2 fleet (saved ~$4.5k/month).",
            "Technologies used: Go, Python, PostgreSQL, Redis, AWS, Terraform.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "Software Engineering Intern",
          company: "Razorpay",
          location: "Bengaluru",
          startDate: "May 2023",
          endDate: "Aug 2023",
          bullets: [
            "Built webhook retry pipeline that recovered 99.7% of failed deliveries within 30s.",
            "Instrumented the merchant dashboard with OpenTelemetry, exposing 14 new product metrics.",
            "Technologies used: Python, Django, Kafka, Grafana.",
          ],
        }),
        exp({
          id: "exp_3",
          title: "Research Intern",
          company: "IIT Roorkee CS Dept",
          startDate: "Jan 2023",
          endDate: "Apr 2023",
          bullets: [
            "Implemented a graph-partitioning algorithm in C++ for a parallel-computing lab, reducing job runtime 1.8x on benchmark workloads.",
            "Co-authored an internal write-up on cache-aware partitioning; paper submitted to a workshop.",
          ],
        }),
      ],
      projects: [
        prj({
          id: "prj_1",
          name: "kv-lite",
          link: "https://example.com/kv-lite",
          bullets: [
            "A distributed in-memory key-value store in Go with Raft-based replication across 5 nodes.",
            "Uses a custom WAL with 2-phase commit for durability; achieves ~80k writes/sec on a 3-node cluster.",
          ],
        }),
      ],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Computer Science",
          institution: "IIT Roorkee",
          startDate: "Aug 2020",
          endDate: "May 2024",
        }),
      ],
      skills: skills([
        ["Languages", ["Go", "Python", "C++", "TypeScript", "SQL"]],
        ["Backend & Infra", ["PostgreSQL", "Redis", "Kafka", "AWS", "Terraform", "Docker"]],
        ["Tools", ["Git", "Grafana", "OpenTelemetry", "Linux"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-02 — thin early-career; gaps: thin_experience, bullet_phrasing, weak_quantification
  {
    id: "candidate-02",
    candidate: "B",
    stage: "thin-early-career",
    cv: {
      personal: {
        name: "Priya Nair",
        email: "priya.nair@example.com",
        phone: "+91 91234 56789",
        location: "Noida, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Software Developer Intern",
          company: "a small startup in Noida",
          startDate: "Jun 2024",
          endDate: "Aug 2024",
          bullets: [
            "During my internship I was responsible for working on various features of the company's website using React and Node. I learned a lot about web development.",
          ],
        }),
      ],
      projects: [
        prj({
          id: "prj_1",
          name: "Todo App",
          bullets: [
            "Built a todo list application using React for the frontend.",
            "Used localStorage to persist data between sessions.",
          ],
        }),
        prj({
          id: "prj_2",
          name: "Weather Dashboard",
          bullets: [
            "Uses OpenWeather API to show weather for any city.",
            "Implemented dark mode toggle.",
          ],
        }),
      ],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Computer Science",
          institution: "Amity University",
          startDate: "2021",
          endDate: "2025",
        }),
      ],
      skills: skills([
        ["Programming", ["HTML", "CSS", "JavaScript", "React", "Node"]],
        ["Other", ["Git", "MongoDB"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-03 — full exp, no projects, thin education; gaps: missing_projects_section, weak_education_details, missing_summary
  {
    id: "candidate-03",
    candidate: "C",
    stage: "strong-exp-no-projects",
    cv: {
      personal: {
        name: "Arjun Kapoor",
        email: "arjun.kapoor@example.com",
        phone: "+91 99887 66554",
        location: "Hyderabad, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Backend Engineer",
          company: "Groww",
          location: "Bengaluru",
          startDate: "Jul 2024",
          endDate: "Present",
          bullets: [
            "Designed and shipped a rewritten order-book service in Java handling 10x peak load at half the pod count.",
            "Partnered with the broker-ops team to add pre-trade risk checks that cut rejected orders 34% in two weeks.",
            "Introduced synthetic-transaction probes for critical user journeys; detected 4 incidents before customer impact.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "SDE Intern",
          company: "PhonePe",
          location: "Bengaluru",
          startDate: "May 2023",
          endDate: "Jul 2023",
          bullets: [
            "Built a KYC-document OCR pipeline with confidence scoring, reducing manual review queue 45%.",
            "Contributed to the merchant-settlement reconciliation service; caught a bug that had been silently dropping ~0.2% of entries.",
            "Presented findings to the platform-engineering guild (~40 engineers).",
          ],
        }),
        exp({
          id: "exp_3",
          title: "Core Team Member",
          company: "VIT ACM Student Chapter",
          location: "Vellore",
          startDate: "Jan 2022",
          endDate: "Apr 2024",
          bullets: [
            "Ran the competitive-programming track; organized 6 contests attended by 400+ students across the university.",
            "Mentored 20 freshers weekly on data structures and algorithms; 4 of them later cleared Google/Atlassian interviews.",
          ],
        }),
      ],
      projects: [],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Electronics & Communication",
          institution: "VIT Vellore",
          startDate: "2020",
          endDate: "2024",
        }),
      ],
      skills: skills([
        ["Languages", ["Java", "Python", "Go", "SQL"]],
        ["Backend & Infra", ["Spring Boot", "gRPC", "Kafka", "PostgreSQL", "Redis", "Docker"]],
        ["Tools", ["Git", "Grafana", "Jenkins", "AWS"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-04 — medium, only 1 project, filler bullets; gaps: missing_summary, weak_education_details, no_impact_in_bullets
  {
    id: "candidate-04",
    candidate: "D",
    stage: "medium-filler",
    cv: {
      personal: {
        name: "Sneha Iyer",
        email: "sneha.iyer@example.com",
        phone: "+91 93211 88776",
        location: "Pune, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "other", url: "https://example.com/blog", label: "Blog" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Software Engineering Intern",
          company: "Atlassian",
          location: "Bengaluru",
          startDate: "May 2024",
          endDate: "Aug 2024",
          bullets: [
            "Worked on a refactor of the Jira notifications service, migrating from a monolith to a worker-pool architecture.",
            "Added new audit-log entries and fixed issues in the onboarding tour.",
            "Technologies used: Java, Kotlin, AWS SQS, DynamoDB.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "Open Source Contributor",
          company: "Apache Arrow",
          startDate: "Jan 2024",
          endDate: "Apr 2024",
          bullets: [
            "Contributed patches to the C++ implementation, including a few compute-kernel fixes.",
            "Technologies used: C++, CMake, Parquet.",
          ],
        }),
        exp({
          id: "exp_3",
          title: "Research Assistant",
          company: "Manipal Institute of Technology",
          startDate: "Aug 2023",
          endDate: "Apr 2024",
          bullets: [
            "Assisted a faculty member on an ML for healthcare project; ran experiments and helped write the paper.",
            "Co-authored a workshop paper.",
          ],
        }),
      ],
      projects: [
        prj({
          id: "prj_1",
          name: "melodyfind",
          description: "A music recommender using collaborative filtering.",
          bullets: [
            "Trained on the Spotify dataset; recommends 10 songs given a seed track.",
            "Deployed as a Streamlit app for demos.",
          ],
        }),
      ],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Computer Science",
          institution: "Manipal Institute of Technology",
          startDate: "2021",
          endDate: "2025",
        }),
      ],
      skills: skills([
        ["Languages", ["Java", "Kotlin", "Python", "C++"]],
        ["Frameworks & Tools", ["Spring", "Streamlit", "Docker", "Git"]],
        ["Cloud", ["AWS", "GCP"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-05 — OSS bare-list + weak education + weird skills grouping; gaps: missing_summary, bullet_phrasing, weak_education_details
  {
    id: "candidate-05",
    candidate: "E",
    stage: "oss-bare-list",
    cv: {
      personal: {
        name: "Kabir Singh",
        email: "kabir.singh@example.com",
        phone: "+91 90345 67890",
        location: "Delhi, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "SDE Intern",
          company: "ShareChat",
          location: "Bengaluru",
          startDate: "May 2024",
          endDate: "Aug 2024",
          bullets: [
            "Rebuilt the moderator-dashboard search with ElasticSearch, improving p95 query time from 2.1s to 310ms.",
            "Shipped a batch-labeling tool that reduced the content-safety team's workload by ~6 hours/week.",
            "Technologies used: Python, ElasticSearch, FastAPI, React.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "Open Source Contributor",
          bullets: [
            "Contributed patches to: Kubernetes, Helm, Kyverno, Tekton, Podman. Pull Requests.",
          ],
        }),
      ],
      projects: [
        prj({
          id: "prj_1",
          name: "Heatmap",
          description: "Visualize commit frequency per file over time.",
          bullets: [
            "Parses any git repo locally and generates a per-file heatmap.",
            "Written in Rust with a D3 frontend.",
          ],
        }),
        prj({
          id: "prj_2",
          name: "coldstart-cli",
          description: "A tiny CLI that scaffolds a Node project with sensible defaults.",
          bullets: [
            "Installs ESLint, Prettier, TypeScript, Vitest in one command.",
            "Pre-configured GitHub Actions for CI.",
          ],
        }),
      ],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Sc",
          field: "Computer Science",
          institution: "University of Delhi",
          startDate: "2021",
          endDate: "2024",
        }),
      ],
      skills: skills([
        ["Languages", ["Python", "Rust", "Go", "TypeScript"]],
        ["Infra", ["Kubernetes", "Helm", "Docker", "ElasticSearch"]],
        ["Tools", ["Git", "GitHub Actions", "Prometheus"]],
        ["Spoken Languages", ["English (IELTS 8.0)", "Hindi (Native)", "Spanish (A2)"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-06 — strong exp, zero projects, SSC-10th filler; gaps: missing_projects_section, missing_summary, redundant_content
  {
    id: "candidate-06",
    candidate: "F",
    stage: "exp-plus-ssc-filler",
    cv: {
      personal: {
        name: "Ananya Reddy",
        email: "ananya.reddy@example.com",
        phone: "+91 87654 32109",
        location: "Hyderabad, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
          { type: "other", url: "https://example.com/blog", label: "Blog" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Fellow",
          company: "MLH Fellowship",
          startDate: "Feb 2024",
          endDate: "May 2024",
          bullets: [
            "Contributed 17 merged PRs to the Backstage OSS project, focused on the software-catalog plugin.",
            "Reviewed 40+ PRs as part of the PR-review rotation; led a cohort of 8 fellows weekly.",
            "Co-authored a guide to contributing to Backstage which now lives in the official docs.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "Software Engineering Intern",
          company: "Salesforce",
          location: "Hyderabad",
          startDate: "May 2023",
          endDate: "Aug 2023",
          bullets: [
            "Built a dashboard-widget framework that ~60 internal teams now use; saved ~1.5 engineer-weeks per team rollout.",
            "Migrated the widget build pipeline from Jenkins to GitHub Actions, cutting CI time from 18min to 6min.",
            "Technologies used: TypeScript, React, GraphQL, Apex.",
          ],
        }),
        exp({
          id: "exp_3",
          title: "Teaching Assistant",
          company: "Osmania University",
          startDate: "Jan 2023",
          endDate: "Dec 2023",
          bullets: [
            "Ran weekly tutorial sections for a Data Structures class of 80+ students across 2 sections.",
            "Designed 3 assignments that are still part of the syllabus.",
          ],
        }),
      ],
      projects: [],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Computer Science",
          institution: "Osmania University",
          startDate: "2020",
          endDate: "2024",
        }),
        edu({
          id: "edu_2",
          degree: "Diploma",
          field: "Computer Engineering",
          institution: "State Polytechnic",
          startDate: "2017",
          endDate: "2020",
        }),
        edu({
          id: "edu_3",
          degree: "SSC (10th)",
          institution: "State Board",
          startDate: "2015",
          endDate: "2017",
        }),
      ],
      skills: skills([
        ["Languages", ["TypeScript", "Python", "Go"]],
        ["Frameworks", ["React", "Node.js", "GraphQL"]],
        ["Tools", ["Git", "GitHub Actions", "Jenkins", "Docker"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },

  // candidate-07 — medium with filler (variant); gaps: missing_summary, weak_education_details, no_impact_in_bullets
  {
    id: "candidate-07",
    candidate: "G",
    stage: "medium-filler-variant",
    cv: {
      personal: {
        name: "Vikram Gupta",
        email: "vikram.gupta@example.com",
        phone: "+91 98244 13355",
        location: "Chennai, India",
        links: [
          { type: "linkedin", url: "https://example.com/linkedin", label: "LinkedIn" },
          { type: "github", url: "https://example.com/github", label: "GitHub" },
        ],
      },
      experience: [
        exp({
          id: "exp_1",
          title: "Software Engineering Intern",
          company: "Cure.fit",
          location: "Bengaluru",
          startDate: "Jun 2024",
          endDate: "Aug 2024",
          bullets: [
            "Built a trainer-availability service that now powers live-class booking for 400k+ users.",
            "Fixed flakiness in the mobile-app E2E test suite, bringing pass rate from 72% to 96%.",
            "Technologies used: TypeScript, React Native, Node.js.",
          ],
        }),
        exp({
          id: "exp_2",
          title: "DevOps Intern",
          company: "Zomato",
          location: "Gurgaon",
          startDate: "Jan 2024",
          endDate: "Apr 2024",
          bullets: [
            "Migrated 12 legacy services from in-house Kubernetes to EKS; reduced pod cold-start p95 by ~40%.",
            "Automated the staging-environment provisioner so PR authors get a preview deployment per PR.",
            "Technologies used: AWS EKS, Terraform, Helm, Argo CD.",
          ],
        }),
        exp({
          id: "exp_3",
          title: "Technical Lead",
          company: "SRM IEEE Student Branch",
          startDate: "Aug 2023",
          endDate: "May 2024",
          bullets: [
            "Led a 12-person team organizing the annual tech fest; 600+ participants across 4 workshops.",
            "Built the event website and registration pipeline in 3 weeks.",
          ],
        }),
      ],
      projects: [
        prj({
          id: "prj_1",
          name: "shrtly",
          description: "A minimal URL shortener with per-link analytics.",
          bullets: [
            "Supports custom slugs and UTM overrides.",
            "Deployed on Vercel with a Postgres backend.",
          ],
        }),
      ],
      education: [
        edu({
          id: "edu_1",
          degree: "B.Tech",
          field: "Computer Science",
          institution: "SRM Institute of Science and Technology",
          startDate: "2020",
          endDate: "2024",
        }),
      ],
      skills: skills([
        ["Languages", ["TypeScript", "Python", "Go"]],
        ["Frameworks", ["React", "Node.js", "FastAPI"]],
        ["Cloud & DevOps", ["AWS", "Terraform", "Docker", "Helm", "Argo CD"]],
      ]),
      certifications: [],
      awards: [],
      custom: [],
    },
  },
];

// Write -------------------------------------------------------------

mkdirSync(SAMPLES_DIR, { recursive: true });
for (const a of archetypes) {
  const outPath = resolve(SAMPLES_DIR, `${a.id}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      { _meta: { candidate: a.candidate, stage: a.stage, synthetic: true }, cv: a.cv },
      null,
      2
    )
  );
  console.log(
    `${a.id}  (${a.stage})  ${a.cv.experience.length}exp / ${a.cv.education.length}edu / ${a.cv.projects.length}proj`
  );
}
console.log(`\nwrote ${archetypes.length} synthetic samples to evals/samples/`);
