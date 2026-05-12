"use client";

import { RegistrationForm } from "@/components/RegistrationForm";
import { useI18n } from "@/components/LanguageProvider";

export default function NewRegistrationPage() {
  const { t } = useI18n();

  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">{t("registrationEyebrow")}</div>
        <h1>{t("registrationTitle")}</h1>
        <p className="lead">{t("registrationLead")}</p>
        <div className="proof-grid" aria-label="Registration highlights">
          <div className="proof">
            <strong>{t("secureReturn")}</strong>
            <span>{t("secureReturnText")}</span>
          </div>
          <div className="proof">
            <strong>{t("multipleFiles")}</strong>
            <span>{t("multipleFilesText")}</span>
          </div>
          <div className="proof">
            <strong>{t("adminReady")}</strong>
            <span>{t("adminReadyText")}</span>
          </div>
        </div>
      </section>
      <RegistrationForm mode="create" />
    </div>
  );
}
