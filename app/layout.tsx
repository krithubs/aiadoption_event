import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import { AppHeader } from "@/components/AppHeader";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CODEMONDAY SUMMIT 2026 Registration",
  description: "Event registration and admin review system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <div className="shell">
            <AppHeader />
            <main className="main">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
