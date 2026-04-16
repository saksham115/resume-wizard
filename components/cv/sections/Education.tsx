import type { EducationItem } from "@/lib/cv-schema";
import { BulletList } from "../Bullet";
import { SectionHeader } from "../SectionHeader";

export function Education({ items }: { items: EducationItem[] }) {
  return (
    <section className="cv-section">
      <SectionHeader title="Education" />
      {items.map((ed) => (
        <div key={ed.id} className="cv-item">
          <div className="cv-item-head">
            <div className="cv-item-title">
              <span className="font-semibold">{ed.degree}</span>
              {ed.field && <span>, {ed.field}</span>}
              {ed.institution && <span> · {ed.institution}</span>}
            </div>
            {(ed.startDate || ed.endDate) && (
              <div className="cv-item-date">
                {[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}
              </div>
            )}
          </div>
          <BulletList bullets={ed.bullets} />
        </div>
      ))}
    </section>
  );
}
