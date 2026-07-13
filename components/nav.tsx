"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/contacts", label: "Contacts" },
  { href: "/visits", label: "Visits" },
  { href: "/enquiries", label: "Enquiries" },
  { href: "/rfqs", label: "RFQs" },
  { href: "/quotations", label: "Quotations" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/dashboard/se", label: "My KPIs" },
  { href: "/dashboard/manager", label: "Manager" },
  { href: "/dashboard/director", label: "Director" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2.5">
        <Link href="/" className="mr-3 flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            IX
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            IndustrialCRM
          </span>
        </Link>
        <nav className="flex items-center gap-0.5">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
