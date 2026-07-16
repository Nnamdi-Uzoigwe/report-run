import Image from "next/image";
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
             <Image src="/edunovtryx-logo.png" height={30} width={30} alt="logo" />
            <span className="font-semibold text-navy-700 text-base">
              EduNovtryx
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
          &copy; {new Date().getFullYear()} EduNovtryx. All rights reserved.
        </p>
      </footer>
    </div>
  );
}