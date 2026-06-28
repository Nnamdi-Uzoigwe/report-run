import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Minimal header */}
      <header className="bg-surface border-b border-border">
        <div className="container-page h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 no-underline">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-navy-600 rounded text-white text-xs font-bold select-none">
              RR
            </span>
            <span className="font-semibold text-text-primary text-sm">
              ReportRun
            </span>
          </Link>
          <Link
            href="/contact"
            className="text-xs text-text-muted hover:text-text-primary transition-colors no-underline"
          >
            Need help?
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} ReportRun. All rights reserved.
        </p>
      </footer>
    </div>
  );
}