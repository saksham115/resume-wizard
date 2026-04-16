import type { SkillCategory } from "@/lib/cv-schema";
import { SectionHeader } from "../SectionHeader";

export function Skills({ items }: { items: SkillCategory[] }) {
  return (
    <section className="cv-section">
      <SectionHeader title="Skills" />
      <div className="cv-skills">
        {items.map((s, i) => (
          <div key={i} className="cv-skill-row">
            <span className="font-semibold">{s.category}:</span>{" "}
            {s.items.join(", ")}
          </div>
        ))}
      </div>
    </section>
  );
}
