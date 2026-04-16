import type { CustomSection } from "@/lib/cv-schema";
import { BulletList } from "../Bullet";
import { SectionHeader } from "../SectionHeader";

export function Custom({ items }: { items: CustomSection[] }) {
  return (
    <>
      {items.map((c) => (
        <section key={c.id} className="cv-section">
          <SectionHeader title={c.title} />
          <BulletList bullets={c.bullets} />
        </section>
      ))}
    </>
  );
}
