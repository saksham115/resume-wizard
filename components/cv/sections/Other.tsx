import type { CertificationItem, AwardItem } from "@/lib/cv-schema";
import { SectionHeader } from "../SectionHeader";

export function Other({
  certifications,
  awards,
}: {
  certifications: CertificationItem[];
  awards: AwardItem[];
}) {
  if (certifications.length === 0 && awards.length === 0) return null;

  return (
    <section className="cv-section">
      <SectionHeader
        title={
          certifications.length > 0 && awards.length === 0
            ? "Certifications"
            : awards.length > 0 && certifications.length === 0
              ? "Awards"
              : "Certifications & Awards"
        }
      />
      {certifications.map((c) => (
        <div key={c.id} className="cv-inline-item">
          <span className="font-medium">{c.name}</span>
          {c.issuer && <span> · {c.issuer}</span>}
          {c.date && <span className="cv-muted"> · {c.date}</span>}
        </div>
      ))}
      {awards.map((a) => (
        <div key={a.id} className="cv-inline-item">
          <span className="font-medium">{a.name}</span>
          {a.description && <span className="cv-muted"> — {a.description}</span>}
          {a.date && <span className="cv-muted"> · {a.date}</span>}
        </div>
      ))}
    </section>
  );
}
