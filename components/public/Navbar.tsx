// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { Menu, X } from "lucide-react";
// import { classNames } from "@/lib/utils";
// import { Button } from "@/components/ui";

// const navLinks = [
//   { label: "Features", href: "/features" },
//   { label: "Pricing",  href: "/pricing"  },
//   { label: "About",    href: "/about"    },
//   { label: "Contact",  href: "/contact"  },
// ];

// export function Navbar() {
//   const pathname  = usePathname();
//   const [open, setOpen] = useState(false);

//   return (
//     <header className="sticky top-0 z-40 bg-surface border-b border-border">
//       <div className="container-page">
//         <div className="flex items-center justify-between h-16">

//           {/* Logo */}
//           <Link
//             href="/"
//             className="flex items-center gap-2 no-underline"
//             onClick={() => setOpen(false)}
//           >
//             <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-600 rounded text-white text-sm font-bold select-none">
//               RR
//             </span>
//             <span className="font-semibold text-text-primary text-base">
//               ReportRun
//             </span>
//           </Link>

//           {/* Desktop nav */}
//           <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
//             {navLinks.map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className={classNames(
//                   "px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 no-underline",
//                   pathname === link.href
//                     ? "text-navy-600 bg-navy-50"
//                     : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
//                 )}
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </nav>

//            {/* Desktop CTA */}
//           <div className="hidden md:flex items-center gap-3">
//             <Link
//               href="/login"
//               className="text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors"
//             >
//               Sign in
//             </Link>
//             <Link href="/setup">
//               <Button size="sm">Get started</Button>
//             </Link>
//           </div>

//           {/* Mobile toggle */}
//           <button
//             className="md:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
//             onClick={() => setOpen(!open)}
//             aria-label={open ? "Close menu" : "Open menu"}
//             aria-expanded={open}
//           >
//             {open ? <X size={20} /> : <Menu size={20} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile menu */}
//       {open && (
//         <div className="md:hidden border-t border-border bg-surface">
//           <nav className="container-page py-4 flex flex-col gap-1" aria-label="Mobile navigation">
//             {navLinks.map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 onClick={() => setOpen(false)}
//                 className={classNames(
//                   "px-3 py-2 rounded text-sm font-medium transition-colors no-underline",
//                   pathname === link.href
//                     ? "text-navy-600 bg-navy-50"
//                     : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
//                 )}
//               >
//                 {link.label}
//               </Link>
//             ))}
//             <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
//               <Link
//                 href="/login"
//                 onClick={() => setOpen(false)}
//                 className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary no-underline"
//               >
//                 Sign in
//               </Link>
//                 <Link href="/setup" onClick={() => setOpen(false)}>
//                 <Button size="sm" fullWidth>
//                   Get started
//                 </Button>
//               </Link>

//             </div>
//           </nav>
//         </div>
//       )}
//     </header>
//   );
// }


"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { classNames } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/lib/store";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing",  href: "/pricing"  },
  { label: "About",    href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];

export function Navbar() {
  const pathname        = usePathname();
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 no-underline"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 bg-navy-600 rounded text-white text-sm font-bold select-none">
              RR
            </span>
            <span className="font-semibold text-text-primary text-base">
              ReportRun
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={classNames(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150 no-underline",
                  pathname === link.href
                    ? "text-navy-600 bg-navy-50"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm">
                  <LayoutDashboard size={14} />
                  Go to dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/contact">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="container-page py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={classNames(
                  "px-3 py-2 rounded text-sm font-medium transition-colors no-underline",
                  pathname === link.href
                    ? "text-navy-600 bg-navy-50"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button size="sm" fullWidth>
                    <LayoutDashboard size={14} />
                    Go to dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary no-underline"
                  >
                    Sign in
                  </Link>
                  <Link href="/contact" onClick={() => setOpen(false)}>
                    <Button size="sm" fullWidth>
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}