import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { Toast } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "IndustrialCRM — pipeline for industrial sales teams",
  description:
    "Structured visit reports, enquiry conversion chain, and multi-role dashboards for pumps, seals, heat exchangers and valves.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <Suspense fallback={null}>
          <Toast />
        </Suspense>
      </body>
    </html>
  );
}
