import { Badge } from "@/components/ui";

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}

export function LegalDocument({
  title,
  lastUpdated,
  effectiveDate,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="section-pad">
      <div className="container-page">
        <div className="max-w-3xl mb-10">
          <Badge label={`Last updated ${lastUpdated}`} variant="navy" />
          <h1 className="text-3xl lg:text-4xl font-semibold text-text-primary leading-tight mt-4 mb-4">
            {title}
          </h1>
          {effectiveDate && (
            <p className="text-sm text-text-muted mb-4">
              Effective date: {effectiveDate}
            </p>
          )}
          {intro && (
            <div className="text-base text-text-secondary leading-relaxed space-y-4">
              {intro}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Table of contents */}
          <nav
            aria-label="Table of contents"
            className="lg:w-64 shrink-0 order-2 lg:order-1"
          >
            <div className="lg:sticky lg:top-24 bg-surface-secondary border border-border rounded-lg p-5">
              <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3">
                On this page
              </p>
              <ul className="flex flex-col gap-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-text-muted hover:text-navy-600 no-underline transition-colors"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0 order-1 lg:order-2 max-w-3xl">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={index > 0 ? "mt-10 pt-10 border-t border-border" : ""}
              >
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  {index + 1}. {section.heading}
                </h2>
                <div className="text-[15px] text-text-secondary leading-relaxed space-y-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed [&_strong]:text-text-primary [&_strong]:font-medium [&_a]:text-navy-600 [&_a]:no-underline hover:[&_a]:underline">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}