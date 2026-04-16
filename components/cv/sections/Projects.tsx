import type { ProjectItem } from "@/lib/cv-schema";
import { BulletList } from "../Bullet";
import { SectionHeader } from "../SectionHeader";

export function Projects({ items }: { items: ProjectItem[] }) {
  return (
    <section className="cv-section">
      <SectionHeader title="Projects" />
      {items.map((p) => (
        <div key={p.id} className="cv-item">
          <div className="cv-item-head">
            <div className="cv-item-title">
              <span className="font-semibold">{p.name}</span>
              {p.link && (
                <>
                  {" "}
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cv-item-link"
                  >
                    ↗
                  </a>
                </>
              )}
            </div>
          </div>
          {p.description && (
            <div className="cv-item-desc">{p.description}</div>
          )}
          <BulletList bullets={p.bullets} />
        </div>
      ))}
    </section>
  );
}
