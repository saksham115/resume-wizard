import { z } from "zod";

// ============================================================
// Bullet — the atom the AI edits. Status drives "ghost" rendering.
// ============================================================
export const BulletStatusSchema = z.enum([
  "original", // extracted from upload, not yet touched
  "to-review", // rewritten by AI, awaiting user confirmation
  "to-complete", // placeholder — AI asked for info user hasn't provided
  "finalized", // user confirmed
]);
export type BulletStatus = z.infer<typeof BulletStatusSchema>;

export const BulletSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: BulletStatusSchema,
  // message id or original bullet id — enforced on AI rewrites
  grounded_in: z.string().optional(),
});
export type Bullet = z.infer<typeof BulletSchema>;

// ============================================================
// Sections
// ============================================================
export const LinkSchema = z.object({
  type: z
    .enum(["linkedin", "github", "portfolio", "twitter", "other"])
    .default("other"),
  url: z.string(),
  label: z.string().optional(),
});
export type Link = z.infer<typeof LinkSchema>;

export const PersonalSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.array(LinkSchema).default([]),
});
export type Personal = z.infer<typeof PersonalSchema>;

export const ExperienceItemSchema = z.object({
  id: z.string(),
  // All string fields optional — real CVs have freelance/OSS/volunteer
  // entries without a formal company, title, or dates. Model must not
  // fabricate; UI renders gracefully when absent.
  company: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(BulletSchema).default([]),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bullets: z.array(BulletSchema).default([]), // CGPA, honors, coursework
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(BulletSchema).default([]),
});
export type ProjectItem = z.infer<typeof ProjectItemSchema>;

export const SkillCategorySchema = z.object({
  category: z.string(), // "Programming Languages", "Frameworks", "Tools", etc.
  items: z.array(z.string()),
});
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const CertificationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});
export type CertificationItem = z.infer<typeof CertificationItemSchema>;

export const AwardItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
});
export type AwardItem = z.infer<typeof AwardItemSchema>;

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  bullets: z.array(BulletSchema).default([]),
});
export type CustomSection = z.infer<typeof CustomSectionSchema>;

// ============================================================
// CV — root
// ============================================================
export const CVSchema = z.object({
  personal: PersonalSchema,
  summary: z.string().optional(),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: z.array(SkillCategorySchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  awards: z.array(AwardItemSchema).default([]),
  custom: z.array(CustomSectionSchema).default([]),
});
export type CV = z.infer<typeof CVSchema>;

export function emptyCV(): CV {
  return {
    personal: { name: "", links: [] },
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    awards: [],
    custom: [],
  };
}

// ============================================================
// Score (M2)
// ============================================================
export const DimensionKeySchema = z.enum([
  "education_credentials",
  "experience_relevance",
  "quantifiable_impact",
  "clarity_structure",
  "skills_information",
]);
export type DimensionKey = z.infer<typeof DimensionKeySchema>;

export const ScoreSchema = z.object({
  completeness: z.number().min(0).max(100),
  dimensions: z.object({
    education_credentials: z.number().min(0).max(20),
    experience_relevance: z.number().min(0).max(20),
    quantifiable_impact: z.number().min(0).max(20),
    clarity_structure: z.number().min(0).max(20),
    skills_information: z.number().min(0).max(20),
  }),
  total: z.number().min(0).max(100),
  feedback_bullets: z.array(z.string()).default([]),
});
export type Score = z.infer<typeof ScoreSchema>;

// ============================================================
// Session — phase state machine + messages
// ============================================================
export const PhaseSchema = z.enum([
  "upload",
  "extract-confirm",
  "score",
  "define",
  "refine",
  "polish",
  "export",
]);
export type Phase = z.infer<typeof PhaseSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.number(),
});
export type Message = z.infer<typeof MessageSchema>;

export const SessionStateSchema = z.object({
  cv: CVSchema,
  messages: z.array(MessageSchema).default([]),
  phase: PhaseSchema,
  score: ScoreSchema.optional(),
});
export type SessionState = z.infer<typeof SessionStateSchema>;

// ============================================================
// Patches — the contract between the agent and the CV store.
//
// The agent emits a `<patches>[...]</patches>` block alongside its message.
// Each patch is a structured mutation; applied in order by applyPatches().
// See lib/agent/patches.ts.
// ============================================================

const SectionKey = z.enum(["experience", "education", "projects"]);

export const UpdateBulletPatchSchema = z.object({
  op: z.literal("update_bullet"),
  bullet_id: z.string(),
  text: z.string(),
  // Message ID (msg_<n>) that justifies this rewrite. Hallucination check
  // validates that numeric entities in `text` also appear in the message
  // content or the original bullet.
  grounded_in: z.string(),
});

export const AddBulletPatchSchema = z.object({
  op: z.literal("add_bullet"),
  section: SectionKey,
  item_id: z.string(), // experience/project/education item to attach to
  text: z.string(),
  grounded_in: z.string(),
});

export const MarkToCompletePatchSchema = z.object({
  op: z.literal("mark_to_complete"),
  section: SectionKey,
  item_id: z.string(),
  prompt_text: z.string(), // placeholder shown in the ghost bullet
});

export const FinalizeBulletPatchSchema = z.object({
  op: z.literal("finalize_bullet"),
  bullet_id: z.string(),
});

export const DeleteBulletPatchSchema = z.object({
  op: z.literal("delete_bullet"),
  bullet_id: z.string(),
});

export const TransitionPhasePatchSchema = z.object({
  op: z.literal("transition_phase"),
  phase: PhaseSchema,
});

export const PatchSchema = z.discriminatedUnion("op", [
  UpdateBulletPatchSchema,
  AddBulletPatchSchema,
  MarkToCompletePatchSchema,
  FinalizeBulletPatchSchema,
  DeleteBulletPatchSchema,
  TransitionPhasePatchSchema,
]);
export type Patch = z.infer<typeof PatchSchema>;
export type UpdateBulletPatch = z.infer<typeof UpdateBulletPatchSchema>;
export type AddBulletPatch = z.infer<typeof AddBulletPatchSchema>;
export type MarkToCompletePatch = z.infer<typeof MarkToCompletePatchSchema>;
export type FinalizeBulletPatch = z.infer<typeof FinalizeBulletPatchSchema>;
export type DeleteBulletPatch = z.infer<typeof DeleteBulletPatchSchema>;
export type TransitionPhasePatch = z.infer<typeof TransitionPhasePatchSchema>;
