"use client";

import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useI18n } from "./LanguageProvider";
import { useEffect, useRef, useState } from "react";

export function AppHeader() {
  const { language, setLanguage, t } = useI18n();
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;
      setHidden(scrollingDown && currentY > 96);
      if (scrollingDown && currentY > 96) setMenuOpen(false);
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
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
        <div className="nav-actions">
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
          <div className="menu-shell" ref={menuRef}>
            <button
              className="menu-button"
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="primary-menu"
            >
              {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
            {menuOpen ? (
              <div className="menu-panel" id="primary-menu">
                <Link href="/" onClick={() => setMenuOpen(false)}>
                  {t("home")}
                </Link>
                <Link href="/registration/new" onClick={() => setMenuOpen(false)}>
                  {t("register")}
                </Link>
                <Link href="/registration/lookup" onClick={() => setMenuOpen(false)}>
                  {t("myRegistration")}
                </Link>
                <Link href="/admin/login" onClick={() => setMenuOpen(false)}>
                  {t("adminConsole")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
