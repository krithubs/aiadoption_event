import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "CMD AI Adoption Exam 2026 Registration",
  description: "Event registration and admin review system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <nav className="nav" aria-label="Primary navigation">
              <Link href="/" className="brand">
                <span className="brand-mark">
                  <ShieldCheck size={22} aria-hidden />
                </span>
                <span>CMD AI Adoption Exam 2026</span>
              </Link>
              <div className="nav-links">
                <Link href="/">Register</Link>
                <Link href="/registration/lookup">My Registration</Link>
                <Link href="/admin/login">Admin Console</Link>
              </div>
            </nav>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
