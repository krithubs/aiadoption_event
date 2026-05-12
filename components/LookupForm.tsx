"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Search } from "lucide-react";
import { Modal, type ModalState } from "./Modal";
import { useI18n } from "./LanguageProvider";

export function LookupForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busy, setBusy] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [referenceConfirmed, setReferenceConfirmed] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const normalizedReference = referenceCode.trim().toUpperCase();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referenceFromUrl = params.get("ref");
    if (referenceFromUrl) setReferenceCode(referenceFromUrl.trim().toUpperCase());
  }, []);

  async function checkReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedReference) {
      setReferenceError(t("enterReferenceFirst"));
      focusField("referenceCode");
      return;
    }

    setBusy(true);
    setModal(null);
    setReferenceError("");

    const response = await fetch("/api/registration/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode: normalizedReference, mode: "reference" }),
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setReferenceConfirmed(false);
      setReferenceError(t("referenceNotFound"));
      focusField("referenceCode");
      return;
    }

    setReferenceConfirmed(Boolean(payload.exists));
    setPasswordError("");
  }

  async function unlockSubmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    if (!password) {
      setPasswordError(t("enterRegistrationPassword"));
      focusField("password");
      return;
    }

    setBusy(true);
    setModal(null);

    const response = await fetch("/api/registration/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode: normalizedReference, password }),
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setPasswordError(t("unableFindRegistration"));
      setModal({
        title: t("registrationNotFound"),
        message: t("unableFindRegistration"),
        kind: "error",
      });
      return;
    }

    sessionStorage.setItem("cmd-edit-registration", JSON.stringify(payload.registration));
    sessionStorage.setItem("cmd-edit-password", password);
    router.push("/registration/edit");
  }

  function focusField(id: string) {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(id);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    });
  }

  return (
    <section className="panel">
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>{t("accessSubmission")}</h2>
          <p className="meta">{t("lookupMeta")}</p>
        </div>
      </div>
      <form className="panel-body" onSubmit={referenceConfirmed ? unlockSubmission : checkReference} noValidate>
        <div className="stacked-fields">
          <div className="field">
            <label htmlFor="referenceCode">{t("referenceCode")}</label>
            <input
              id="referenceCode"
              name="referenceCode"
              placeholder="CMD-2026-ABC123"
              value={referenceCode}
              onChange={(event) => {
                setReferenceCode(event.target.value.toUpperCase());
                setReferenceConfirmed(false);
                setReferenceError("");
                setPasswordError("");
              }}
              required
              aria-invalid={Boolean(referenceError)}
              aria-describedby={referenceError ? "referenceCode-error" : undefined}
              className={referenceError ? "invalid-field" : undefined}
            />
            {referenceError ? (
              <span className="field-error" id="referenceCode-error">
                {referenceError}
              </span>
            ) : null}
          </div>
          {referenceConfirmed ? (
            <div className="field reveal-field">
              <label htmlFor="password">{t("password")}</label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoFocus
                required
                onChange={() => setPasswordError("")}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "password-error" : undefined}
                className={passwordError ? "invalid-field" : undefined}
              />
              {passwordError ? (
                <span className="field-error" id="password-error">
                  {passwordError}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={busy}>
            {referenceConfirmed ? <KeyRound size={18} aria-hidden /> : <Search size={18} aria-hidden />}
            {busy ? t("checking") : referenceConfirmed ? t("unlockSubmission") : t("checkReferenceCode")}
          </button>
        </div>
      </form>
    </section>
  );
}
