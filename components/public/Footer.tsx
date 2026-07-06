import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features",  href: "/features" },
    { label: "Pricing",   href: "/pricing"  },
    { label: "About",     href: "/about"    },
  ],
  Support: [
    { label: "Contact",        href: "/contact"       },
    { label: "Documentation",  href: "#"              },
    { label: "Status",         href: "#"              },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Cookie Policy",    href: "/cookie-policy" },
    { label: "Data Processing Agreement",  href: "/data-processing-agreement" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 no-underline mb-3">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-600 rounded text-white text-sm font-bold select-none">
                RR
              </span>
              <span className="font-semibold text-text-primary">ReportRun</span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              The complete school management platform built for Nigerian schools.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-3">
                {group}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-primary no-underline transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} ReportRun. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Built for Nigerian schools.
          </p>
        </div>
      </div>
    </footer>
  );
}