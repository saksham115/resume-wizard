import type { Personal } from "@/lib/cv-schema";

export function Header({ personal }: { personal: Personal }) {
  const contact = [personal.email, personal.phone, personal.location]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <header className="cv-header">
      <h1 className="cv-name">{personal.name || "(your name)"}</h1>
      {contact && <div className="cv-contact">{contact}</div>}
      {personal.links.length > 0 && (
        <div className="cv-links">
          {personal.links.map((l, i) => (
            <span key={i}>
              {i > 0 && <span className="cv-links-sep">  ·  </span>}
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label ?? l.url}
              </a>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
