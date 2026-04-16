/**
 * Apply structured agent patches to the CV state.
 *
 * Pure: takes a CV and a list of patches, returns a new CV + any per-patch
 * errors (unknown IDs, etc.). Errors are non-fatal — the caller decides
 * whether to surface them.
 */

import type {
  CV,
  Bullet,
  Patch,
  UpdateBulletPatch,
  AddBulletPatch,
  MarkToCompletePatch,
  FinalizeBulletPatch,
  DeleteBulletPatch,
} from "@/lib/cv-schema";

export type ApplyResult = {
  cv: CV;
  errors: string[];
  transitionTo?: CV extends { phase?: infer P } ? P : never | undefined;
};

export type ApplyPatchesResult = {
  cv: CV;
  errors: string[];
  nextPhase?: import("@/lib/cv-schema").Phase;
};

export function applyPatches(cv: CV, patches: Patch[]): ApplyPatchesResult {
  let current: CV = cv;
  const errors: string[] = [];
  let nextPhase: import("@/lib/cv-schema").Phase | undefined;

  for (const p of patches) {
    try {
      switch (p.op) {
        case "update_bullet":
          current = applyUpdateBullet(current, p, errors);
          break;
        case "add_bullet":
          current = applyAddBullet(current, p, errors);
          break;
        case "mark_to_complete":
          current = applyMarkToComplete(current, p, errors);
          break;
        case "finalize_bullet":
          current = applyFinalizeBullet(current, p, errors);
          break;
        case "delete_bullet":
          current = applyDeleteBullet(current, p, errors);
          break;
        case "transition_phase":
          nextPhase = p.phase;
          break;
      }
    } catch (e) {
      errors.push(
        `${(p as { op: string }).op}: ${(e as Error).message}`
      );
    }
  }

  return { cv: current, errors, nextPhase };
}

// ----- Individual appliers (pure over bullet arrays) -----

function findBulletLocation(
  cv: CV,
  bulletId: string
): { section: "experience" | "education" | "projects" | "custom"; itemIdx: number; bulletIdx: number } | null {
  const sections: ("experience" | "education" | "projects" | "custom")[] = [
    "experience",
    "education",
    "projects",
    "custom",
  ];
  for (const section of sections) {
    const items = cv[section] as { bullets: Bullet[] }[];
    for (let i = 0; i < items.length; i++) {
      const bIdx = items[i].bullets.findIndex((b) => b.id === bulletId);
      if (bIdx >= 0) {
        return { section, itemIdx: i, bulletIdx: bIdx };
      }
    }
  }
  return null;
}

function mutateBullets(
  cv: CV,
  section: "experience" | "education" | "projects" | "custom",
  itemIdx: number,
  fn: (bullets: Bullet[]) => Bullet[]
): CV {
  return {
    ...cv,
    [section]: (cv[section] as { bullets: Bullet[] }[]).map((item, i) =>
      i === itemIdx ? { ...item, bullets: fn(item.bullets) } : item
    ),
  };
}

function applyUpdateBullet(
  cv: CV,
  p: UpdateBulletPatch,
  errors: string[]
): CV {
  const loc = findBulletLocation(cv, p.bullet_id);
  if (!loc) {
    errors.push(`update_bullet: unknown bullet_id ${p.bullet_id}`);
    return cv;
  }
  return mutateBullets(cv, loc.section, loc.itemIdx, (bullets) =>
    bullets.map((b) =>
      b.id === p.bullet_id
        ? { ...b, text: p.text, status: "to-review", grounded_in: p.grounded_in }
        : b
    )
  );
}

function applyAddBullet(
  cv: CV,
  p: AddBulletPatch,
  errors: string[]
): CV {
  const items = cv[p.section] as { id: string; bullets: Bullet[] }[];
  const idx = items.findIndex((it) => it.id === p.item_id);
  if (idx < 0) {
    errors.push(`add_bullet: unknown ${p.section} item_id ${p.item_id}`);
    return cv;
  }
  const newBullet: Bullet = {
    id: `${p.item_id}_b_${Date.now().toString(36)}`,
    text: p.text,
    status: "to-review",
    grounded_in: p.grounded_in,
  };
  return mutateBullets(cv, p.section, idx, (bs) => [...bs, newBullet]);
}

function applyMarkToComplete(
  cv: CV,
  p: MarkToCompletePatch,
  errors: string[]
): CV {
  const items = cv[p.section] as { id: string; bullets: Bullet[] }[];
  const idx = items.findIndex((it) => it.id === p.item_id);
  if (idx < 0) {
    errors.push(
      `mark_to_complete: unknown ${p.section} item_id ${p.item_id}`
    );
    return cv;
  }
  const placeholder: Bullet = {
    id: `${p.item_id}_b_tc_${Date.now().toString(36)}`,
    text: p.prompt_text,
    status: "to-complete",
  };
  return mutateBullets(cv, p.section, idx, (bs) => [...bs, placeholder]);
}

function applyFinalizeBullet(
  cv: CV,
  p: FinalizeBulletPatch,
  errors: string[]
): CV {
  const loc = findBulletLocation(cv, p.bullet_id);
  if (!loc) {
    errors.push(`finalize_bullet: unknown bullet_id ${p.bullet_id}`);
    return cv;
  }
  return mutateBullets(cv, loc.section, loc.itemIdx, (bullets) =>
    bullets.map((b) =>
      b.id === p.bullet_id ? { ...b, status: "finalized" } : b
    )
  );
}

function applyDeleteBullet(
  cv: CV,
  p: DeleteBulletPatch,
  errors: string[]
): CV {
  const loc = findBulletLocation(cv, p.bullet_id);
  if (!loc) {
    errors.push(`delete_bullet: unknown bullet_id ${p.bullet_id}`);
    return cv;
  }
  return mutateBullets(cv, loc.section, loc.itemIdx, (bullets) =>
    bullets.filter((b) => b.id !== p.bullet_id)
  );
}
