"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "./LanguageProvider";
import { useEffect, useRef, useState } from "react";

export function AppHeader() {
  const { language, setLanguage, t } = useI18n();
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;
      setHidden(scrollingDown && currentY > 96);
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar ${hidden ? "topbar-hidden" : ""}`}>
      <nav className="nav" aria-label="Primary navigation">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <span>CMD AI Adoption Exam 2026</span>
        </Link>
        <div className="nav-links">
          <Link href="/">{t("register")}</Link>
          <Link href="/registration/lookup">{t("myRegistration")}</Link>
          <Link href="/admin/login">{t("adminConsole")}</Link>
          <div className="language-switch" aria-label="Language switcher">
            <button
              className={language === "en" ? "active" : ""}
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
            >
              EN
            </button>
            <button
              className={language === "th" ? "active" : ""}
              type="button"
              onClick={() => setLanguage("th")}
              aria-pressed={language === "th"}
            >
              TH
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
