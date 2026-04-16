# Feasibility read: Conversational AI Resume Builder

---

## Why the full spec isn't low-effort

Three pieces carry most of the weight:

- **Voice ("Siri-style", Indian-accent tuned).** STT + TTS wiring is a day. Conversational
  voice that actually feels natural — sub-500ms latency, interruption handling, accent
  robustness — is weeks of polish. Users judge voice harshly; a half-working version reads
  worse than no voice at all.
- **LinkedIn profile import.** "Sign in with LinkedIn" (OIDC) only returns name and email.
  Actual work-history / education import needs LinkedIn's Partner Program — slow approval,
  often denied for small apps. No clean shortcut. Scraping is a ToS problem.
- **The bundle: 3 agents × 3 templates × payment × Word export × auto-layout detection.**
  Any one of these alone is fine. Stacked together they *are* the project.

The "200 curated CVs" training corpus is also listed as required. It isn't — for MVP,
5–10 strong few-shot examples are enough to reach testable quality.

---

## What a low-effort MVP could look like

Strip to the single hypothesis worth testing first: **does AI + text conversation produce
a meaningfully better CV than the user started with?** Everything else is optimization
that only matters if that answer is yes.

### Keep (the MVP)

- Upload existing CV (PDF/DOCX). LLM reads it directly — no custom parser.
- Initial quality score displayed up front. This is the hook: *"your CV is 58/100, let's
  fix it."* Just a structured LLM call against the 5 dimensions in spec §4.
- Two-pane workspace (chat on the left, live CV preview on the right) — the core UX
  pattern from the spec.
- **One** clean template. Not three.
- **One** AI agent that walks Define → Refine → Polish as visible phases in the UI.
  Internally it's the same agent with different prompt modes. User-facing UX is identical
  to the spec's three-agent vision.
- Ghost-version rendering from spec §6: missing sections marked *to be completed*,
  rewritten bullets marked *to be reviewed*. Cheap to implement, good UX touch.
- PDF export.
- Hallucination guardrail baked into prompts: agent only refines what the user states —
  never invents metrics, dates, titles, outcomes. This is the single biggest trust risk
  for a CV product and has to be in from day one.

### Cut (defer, don't rebuild)

- Voice → text chat only.
- LinkedIn auth/import → Google sign-in, or skip auth entirely for MVP and collect email
  at export time.
- Payment → free closed beta. Show a "₹299 at launch — join waitlist" card at the end.
  That measures willingness-to-pay without building checkout.
- 3 templates + persona classifier → 1 neutral template.
- Word (.docx) export → PDF only. Users take PDF > Word roughly 10:1.
- Auto-layout detection (crowded / lean) → a simple "over 1 page" warning.
- "Discuss with human / ₹500" → later.
- 200-CV training corpus → few-shot with 5–10 examples.

None of these are rejected — they layer back on once the MVP validates the core concept.

---

## User flow (MVP)

1. Upload CV.
2. See score: *"Your CV scores 58/100. Let's get it to 90+."*
3. Chat agent walks you section-by-section. Right pane updates live.
4. Export PDF. Drop email for waitlist / pricing intent.

---

## What this MVP validates vs. doesn't

**Validates (the things worth knowing first):**

- Does conversational AI actually produce a meaningfully better CV?
- Do users complete the 15–20 minute flow, or drop off?
- Is the output something users say they'd pay for?

**Does not validate (intentionally deferred):**

- Voice-vs-text preference.
- LinkedIn signup pull vs Google.
- Live checkout conversion at ₹299.
- Template-persona fit.

All four become v1 questions *after* the core is proven.

---
