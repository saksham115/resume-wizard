import type { ExperienceItem } from "@/lib/cv-schema";
import { BulletList } from "../Bullet";
import { SectionHeader } from "../SectionHeader";

export function Experience({ items }: { items: ExperienceItem[] }) {
  return (
    <section className="cv-section">
      <SectionHeader title="Experience" />
      {items.map((e) => (
        <div key={e.id} className="cv-item">
          <div className="cv-item-head">
            <div className="cv-item-title">
              <span className="font-semibold">{e.title}</span>
              {e.company && <span> · {e.company}</span>}
              {e.location && (
                <span className="cv-muted"> · {e.location}</span>
              )}
            </div>
            {(e.startDate || e.endDate) && (
              <div className="cv-item-date">
                {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
              </div>
            )}
          </div>
          <BulletList bullets={e.bullets} />
        </div>
      ))}
    </section>
  );
}
