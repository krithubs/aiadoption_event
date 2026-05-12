"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Pencil } from "lucide-react";
import type { PublicRegistration } from "@/lib/types";
import { useI18n } from "./LanguageProvider";

export function CompletionClient() {
  const { t } = useI18n();
  const [registration, setRegistration] = useState<PublicRegistration | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("cmd-registration");
    if (stored) setRegistration(JSON.parse(stored) as PublicRegistration);
  }, []);

  if (!registration) {
    return (
      <section className="panel">
        <div className="panel-body empty-state">
          <div>
            <h2>{t("noRecentSubmission")}</h2>
            <p className="meta">{t("submitToReceiveCode")}</p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <Link className="button" href="/registration/new">
                {t("startRegistration")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="receipt">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{t("registrationReceived")}</h2>
            <p className="meta">{t("keepReference")}</p>
          </div>
          <ClipboardCheck color="var(--success)" aria-hidden />
        </div>
        <div className="panel-body summary-list">
          <div className="summary-row">
            <span>{t("name")}</span>
            <strong>{registration.fullName}</strong>
          </div>
          <div className="summary-row">
            <span>{t("email")}</span>
            <strong>{registration.email}</strong>
          </div>
          <div className="summary-row">
            <span>{t("ticket")}</span>
            <strong>{registration.ticketType}</strong>
          </div>
          <div className="summary-row">
            <span>{t("supportingDocuments")}</span>
            <strong>
              {registration.documents.length} {t("documentsUploaded")}
            </strong>
          </div>
        </div>
      </section>
      <aside className="reference-box">
        <div className="eyebrow">{t("referenceCode")}</div>
        <div className="reference-code">{registration.referenceCode}</div>
        <p>{t("useCodeWithPassword")}</p>
        <div className="actions">
          <Link className="ghost-button" href="/registration/lookup">
            <Pencil size={18} aria-hidden />
            {t("manageLater")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
