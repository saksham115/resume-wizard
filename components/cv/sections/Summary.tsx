import { SectionHeader } from "../SectionHeader";

export function Summary({ summary }: { summary: string }) {
  return (
    <section className="cv-section">
      <SectionHeader title="Summary" />
      <p className="cv-summary">{summary}</p>
    </section>
  );
}
