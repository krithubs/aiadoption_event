"use client";

import Link from "next/link";
import type { Route } from "next";
import { ClipboardList, KeyRound, ShieldCheck } from "lucide-react";
import { useI18n } from "./LanguageProvider";

const workflows: Array<{
  href: Route;
  icon: typeof ClipboardList;
  titleKey: string;
  textKey: string;
}> = [
  {
    href: "/registration/new",
    icon: ClipboardList,
    titleKey: "mainRegisterTitle",
    textKey: "mainRegisterText",
  },
  {
    href: "/registration/lookup",
    icon: KeyRound,
    titleKey: "mainLookupTitle",
    textKey: "mainLookupText",
  },
  {
    href: "/admin/login",
    icon: ShieldCheck,
    titleKey: "mainAdminTitle",
    textKey: "mainAdminText",
  },
];

export function MainHub() {
  const { t } = useI18n();

  return (
    <div className="main-hub">
      <section className="main-hero">
        <div className="eyebrow">{t("mainEyebrow")}</div>
        <h1>{t("mainTitle")}</h1>
        <p className="lead">{t("mainLead")}</p>
      </section>
      <section className="workflow-grid" aria-label="Event workflows">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;
          return (
            <Link className="workflow-card" href={workflow.href} key={workflow.href}>
              <span className="workflow-icon">
                <Icon size={24} aria-hidden />
              </span>
              <span className="workflow-copy">
                <strong>{t(workflow.titleKey)}</strong>
                <span>{t(workflow.textKey)}</span>
              </span>
              <span className="workflow-action">{t("openWorkflow")}</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
