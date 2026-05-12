"use client";

import { AdminLoginForm } from "@/components/AdminLoginForm";
import { useI18n } from "@/components/LanguageProvider";

export default function AdminLoginPage() {
  const { t } = useI18n();

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <div className="eyebrow">{t("adminEyebrow")}</div>
        <h1>{t("adminTitle")}</h1>
        <p className="lead">{t("adminLead")}</p>
      </section>
      <div className="auth-panel">
        <AdminLoginForm />
      </div>
    </div>
  );
}
