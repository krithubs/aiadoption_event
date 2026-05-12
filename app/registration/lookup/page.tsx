"use client";

import { LookupForm } from "@/components/LookupForm";
import { useI18n } from "@/components/LanguageProvider";

export default function LookupPage() {
  const { t } = useI18n();

  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">{t("lookupEyebrow")}</div>
        <h1>{t("lookupTitle")}</h1>
        <p className="lead">{t("lookupLead")}</p>
      </section>
      <LookupForm />
    </div>
  );
}
