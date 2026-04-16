"use client";

import { useState } from "react";
import type { Bullet as BulletT } from "@/lib/cv-schema";
import { useSession } from "@/lib/cv/store";

/**
 * Bullet renderer with ghost-version styling AND interactive actions.
 *
 * Screen:
 *   - to-review: amber highlight + [Accept] [Edit] buttons (no-print)
 *   - to-complete: dashed placeholder + [Remove] (no-print)
 *   - original / finalized: plain
 *
 * Print:
 *   - to-review chrome is stripped (handled in globals.css)
 *   - to-complete bullets hidden entirely
 *   - Action buttons hidden via .no-print
 */
export function BulletLI({ bullet }: { bullet: BulletT }) {
  const finalizeBullet = useSession((s) => s.finalizeBullet);
  const editBullet = useSession((s) => s.editBullet);
  const removeBullet = useSession((s) => s.removeBullet);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bullet.text);

  if (editing) {
    return (
      <li className="cv-bullet cv-bullet--editing list-none">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-[10pt] font-sans"
          autoFocus
        />
        <div className="no-print mt-1 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              editBullet(bullet.id, draft.trim());
              setEditing(false);
            }}
            className="rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-2 py-0.5 font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(bullet.text);
              setEditing(false);
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-2 py-0.5"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  if (bullet.status === "to-complete") {
    return (
      <li className="cv-bullet cv-bullet--to-complete">
        <span>{bullet.text || "(to be completed)"}</span>
        <span className="no-print ml-2 inline-flex align-middle">
          <BulletAction onClick={() => removeBullet(bullet.id)}>
            Remove
          </BulletAction>
        </span>
      </li>
    );
  }

  if (bullet.status === "to-review") {
    return (
      <li className="cv-bullet cv-bullet--to-review">
        <span>{bullet.text}</span>
        <span className="no-print ml-2 inline-flex gap-1 align-middle">
          <BulletAction onClick={() => finalizeBullet(bullet.id)}>
            Accept
          </BulletAction>
          <BulletAction
            onClick={() => {
              setDraft(bullet.text);
              setEditing(true);
            }}
          >
            Edit
          </BulletAction>
        </span>
      </li>
    );
  }

  return (
    <li className="cv-bullet group">
      <span>{bullet.text}</span>
      <span className="no-print ml-2 inline-flex gap-1 align-middle opacity-0 group-hover:opacity-100 transition-opacity">
        <BulletAction
          onClick={() => {
            setDraft(bullet.text);
            setEditing(true);
          }}
        >
          Edit
        </BulletAction>
      </span>
    </li>
  );
}

function BulletAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
    >
      {children}
    </button>
  );
}

export function BulletList({ bullets }: { bullets: BulletT[] }) {
  if (bullets.length === 0) return null;
  return (
    <ul className="cv-bullets">
      {bullets.map((b) => (
        <BulletLI key={b.id} bullet={b} />
      ))}
    </ul>
  );
}
