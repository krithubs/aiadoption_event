"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Modal, type ModalState } from "./Modal";
import { useI18n } from "./LanguageProvider";

export function AdminLoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setBusy(true);
    setModal(null);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const errors: Record<string, string> = {};

    if (!username) errors.username = t("enterAdminUsername");
    if (!password) errors.password = t("enterAdminPassword");

    if (Object.keys(errors).length > 0) {
      setBusy(false);
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setFieldErrors({ password: t("invalidAdminCredentials") });
      setModal({
        title: t("adminLoginFailed"),
        message: t("invalidAdminCredentials"),
        kind: "error",
      });
      return;
    }

    router.push("/admin/registrations");
  }

  function focusFirstError(errors: Record<string, string>) {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;

    window.requestAnimationFrame(() => {
      const target = document.getElementById(firstField);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    });
  }

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function errorProps(field: string) {
    const message = fieldErrors[field];
    return {
      "aria-invalid": Boolean(message),
      "aria-describedby": message ? `${field}-error` : undefined,
      className: message ? "invalid-field" : undefined,
    };
  }

  function errorText(field: string) {
    return fieldErrors[field] ? (
      <span className="field-error" id={`${field}-error`}>
        {fieldErrors[field]}
      </span>
    ) : null;
  }

  return (
    <section className="panel">
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>{t("adminLoginTitle")}</h2>
          <p className="meta">{t("adminLoginMeta")}</p>
        </div>
      </div>
      <form className="panel-body" onSubmit={submit} noValidate>
        <div className="stacked-fields">
          <div className="field">
            <label htmlFor="username">{t("username")}</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              onChange={() => clearFieldError("username")}
              {...errorProps("username")}
            />
            {errorText("username")}
          </div>
          <div className="field">
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              onChange={() => clearFieldError("password")}
              {...errorProps("password")}
            />
            {errorText("password")}
          </div>
        </div>
        <div className="actions">
          <button className="button" disabled={busy}>
            <LogIn size={18} aria-hidden />
            {busy ? t("signingIn") : t("signIn")}
          </button>
        </div>
      </form>
    </section>
  );
}
