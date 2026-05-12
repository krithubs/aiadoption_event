"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileUp, Save, Send } from "lucide-react";
import type { PublicRegistration } from "@/lib/types";
import { assertAllowedDocument, registrationInputFromFormData, validateRegistrationInput } from "@/lib/validation";
import { Modal, type ModalState } from "./Modal";
import { CustomDropdown } from "./CustomDropdown";
import { translateServerError, useI18n } from "./LanguageProvider";

type Props = {
  mode: "create" | "edit";
  initialRegistration?: PublicRegistration;
  referenceCode?: string;
  password?: string;
};

const ticketTypes = ["General", "VIP", "Speaker", "Sponsor", "Staff"];
const documentModeOptions = [
  { value: "append", labelKey: "appendDocuments" },
  { value: "replace", labelKey: "replaceDocuments" },
];

function valueFor(registration: PublicRegistration | undefined, key: keyof PublicRegistration): string {
  const value = registration?.[key];
  return typeof value === "string" ? value : "";
}

export function RegistrationForm({ mode, initialRegistration, referenceCode, password }: Props) {
  const router = useRouter();
  const { language, t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [documentMode, setDocumentMode] = useState("append");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDocumentNames, setSelectedDocumentNames] = useState<string[]>([]);

  const defaults = useMemo(
    () => ({
      fullName: valueFor(initialRegistration, "fullName"),
      email: valueFor(initialRegistration, "email"),
      phone: valueFor(initialRegistration, "phone"),
      organization: valueFor(initialRegistration, "organization"),
      jobTitle: valueFor(initialRegistration, "jobTitle"),
      ticketType: valueFor(initialRegistration, "ticketType") || "General",
      dietaryNeeds: valueFor(initialRegistration, "dietaryNeeds"),
      accessibilityNeeds: valueFor(initialRegistration, "accessibilityNeeds"),
      notes: valueFor(initialRegistration, "notes"),
    }),
    [initialRegistration],
  );
  const [ticketType, setTicketType] = useState(defaults.ticketType);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setModal(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    if (mode === "edit") {
      formData.set("referenceCode", referenceCode || "");
      formData.set("password", password || "");
      formData.set("documentMode", documentMode);
    }

    const clientValidation = validateClientForm(formData, (message) => translateServerError(message, language));
    if (Object.keys(clientValidation).length > 0) {
      setBusy(false);
      setFieldErrors(clientValidation);
      focusFirstError(clientValidation);
      if (shouldShowValidationModal(formData)) {
        setModal({
          title: t("fixHighlighted"),
          message: Object.values(clientValidation).join(" "),
          kind: "error",
        });
      }
      return;
    }

    const response = await fetch("/api/registration", {
      method: mode === "create" ? "POST" : "PUT",
      body: formData,
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      const translatedErrors = payload.errors
        ? Object.fromEntries(
            Object.entries(payload.errors as Record<string, string>).map(([field, message]) => [
              field,
              translateServerError(message, language),
            ]),
          )
        : null;
      const errorText = payload.error
        ? translateServerError(payload.error, language)
        : Object.values(translatedErrors || {}).join(" ");
      if (translatedErrors) {
        setFieldErrors(translatedErrors);
        focusFirstError(translatedErrors);
      }
      setModal({
        title: t("registrationNotSaved"),
        message: errorText || t("registrationNotSaved"),
        kind: "error",
      });
      return;
    }

    sessionStorage.setItem("cmd-registration", JSON.stringify(payload.registration));
    if (mode === "create") {
      router.push("/registration/complete");
    } else {
      sessionStorage.setItem("cmd-edit-registration", JSON.stringify(payload.registration));
      setModal({
        title: t("registrationUpdated"),
        message: t("updateSaved"),
        kind: "success",
      });
    }
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

  const selectedDocumentSummary =
    selectedDocumentNames.length > 0
      ? `${selectedDocumentNames.length} ${t("filesSelected")}`
      : t("clickToChoose");

  return (
    <section className="panel" aria-label={mode === "create" ? t("attendeeDetails") : t("editSubmission")}>
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>{mode === "create" ? t("attendeeDetails") : t("editSubmission")}</h2>
          <p className="meta">
            {mode === "create"
              ? t("requiredUsage")
              : `Reference ${referenceCode}`}
          </p>
        </div>
        {mode === "edit" ? <span className="status-pill">{initialRegistration?.status}</span> : null}
      </div>
      <form className="panel-body" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullName">{t("fullName")}</label>
            <input
              id="fullName"
              name="fullName"
              defaultValue={defaults.fullName}
              required
              minLength={2}
              maxLength={80}
              onChange={() => clearFieldError("fullName")}
              {...errorProps("fullName")}
            />
            {errorText("fullName")}
          </div>
          <div className="field">
            <label htmlFor="email">{t("email")}</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={defaults.email}
              required
              onChange={() => clearFieldError("email")}
              {...errorProps("email")}
            />
            {errorText("email")}
          </div>
          <div className="field">
            <label htmlFor="phone">{t("phone")}</label>
            <input
              id="phone"
              name="phone"
              defaultValue={defaults.phone.replace(/\D/g, "")}
              required
              inputMode="numeric"
              pattern="[0-9]{9,15}"
              minLength={9}
              maxLength={15}
              placeholder="0812345678"
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                clearFieldError("phone");
              }}
              {...errorProps("phone")}
            />
            <span className="hint">{t("phoneHint")}</span>
            {errorText("phone")}
          </div>
          <div className="field">
            <label htmlFor="organization">{t("organization")}</label>
            <input
              id="organization"
              name="organization"
              defaultValue={defaults.organization}
              required
              maxLength={100}
              onChange={() => clearFieldError("organization")}
              {...errorProps("organization")}
            />
            {errorText("organization")}
          </div>
          <div className="field">
            <label htmlFor="jobTitle">{t("jobTitle")}</label>
            <input
              id="jobTitle"
              name="jobTitle"
              defaultValue={defaults.jobTitle}
              required
              maxLength={80}
              onChange={() => clearFieldError("jobTitle")}
              {...errorProps("jobTitle")}
            />
            {errorText("jobTitle")}
          </div>
          <div className="field">
            <label htmlFor="ticketType">{t("ticketType")}</label>
            <CustomDropdown
              id="ticketType"
              name="ticketType"
              value={ticketType}
              options={ticketTypes.map((item) => ({ value: item, label: item }))}
              onChange={(nextValue) => {
                setTicketType(nextValue);
                clearFieldError("ticketType");
              }}
              invalid={Boolean(fieldErrors.ticketType)}
              describedBy={fieldErrors.ticketType ? "ticketType-error" : undefined}
            />
            {errorText("ticketType")}
          </div>
          <div className="field">
            <label htmlFor="dietaryNeeds">{t("dietaryNeeds")}</label>
            <input
              id="dietaryNeeds"
              name="dietaryNeeds"
              defaultValue={defaults.dietaryNeeds}
              placeholder={t("none")}
              maxLength={120}
              onChange={() => clearFieldError("dietaryNeeds")}
              {...errorProps("dietaryNeeds")}
            />
            {errorText("dietaryNeeds")}
          </div>
          <div className="field">
            <label htmlFor="accessibilityNeeds">{t("accessibilityNeeds")}</label>
            <input
              id="accessibilityNeeds"
              name="accessibilityNeeds"
              defaultValue={defaults.accessibilityNeeds}
              placeholder={t("none")}
              maxLength={120}
              onChange={() => clearFieldError("accessibilityNeeds")}
              {...errorProps("accessibilityNeeds")}
            />
            {errorText("accessibilityNeeds")}
          </div>
          <div className="field full">
            <label htmlFor="notes">{t("notes")}</label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={defaults.notes}
              maxLength={800}
              onChange={() => clearFieldError("notes")}
              {...errorProps("notes")}
            />
            {errorText("notes")}
          </div>
          <div className="field full">
            <label htmlFor="documents">{t("documents")}</label>
            <div className={`file-picker ${fieldErrors.documents ? "invalid-field" : ""}`}>
              <input
                className="file-native-input"
                id="documents"
                name="documents"
                type="file"
                multiple
                required={mode === "create"}
                accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  setSelectedDocumentNames(Array.from(event.currentTarget.files || []).map((file) => file.name));
                  clearFieldError("documents");
                }}
                aria-invalid={Boolean(fieldErrors.documents)}
                aria-describedby={fieldErrors.documents ? "documents-error" : undefined}
              />
              <div className="file-upload-field" aria-hidden="true">
                <span className="file-upload-icon">
                  <FileUp size={19} />
                </span>
                <span className="file-upload-copy">
                  <strong>{t("uploadFiles")}</strong>
                  <span>{selectedDocumentSummary}</span>
                </span>
                <span className="file-upload-action">{t("documents")}</span>
              </div>
            </div>
            {selectedDocumentNames.length > 0 ? (
              <div className="file-name-list" aria-label="Selected files">
                {selectedDocumentNames.map((name, index) => (
                  <span className="file-name-chip" key={`${name}-${index}`}>
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
            <span className="hint">{t("documentHint")}</span>
            {errorText("documents")}
          </div>
          {mode === "edit" ? (
            <div className="field full">
              <label htmlFor="documentMode">{t("documentMode")}</label>
              <CustomDropdown
                id="documentMode"
                name="documentMode"
                value={documentMode}
                options={documentModeOptions.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
                onChange={setDocumentMode}
              />
            </div>
          ) : null}
          <div className="field full">
            <label htmlFor="password">{mode === "create" ? t("setPassword") : t("confirmPassword")}</label>
            <div className="password-control">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                defaultValue={mode === "edit" ? password : ""}
                autoComplete="new-password"
                onChange={() => clearFieldError("password")}
                {...errorProps("password")}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                <span>{showPassword ? t("hidePassword") : t("showPassword")}</span>
              </button>
            </div>
            <span className="hint">{t("passwordHint")}</span>
            {errorText("password")}
          </div>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={busy}>
            {mode === "create" ? <Send size={18} aria-hidden /> : <Save size={18} aria-hidden />}
            {busy ? t("saving") : mode === "create" ? t("submitRegistration") : t("saveChanges")}
          </button>
          <span className="meta">
            <FileUp size={15} aria-hidden /> {t("attachedDocuments")}
          </span>
        </div>
      </form>
    </section>
  );
}

function validateClientForm(formData: FormData, translate: (message: string) => string): Record<string, string> {
  const errors: Record<string, string> = {};
  const validation = validateRegistrationInput(registrationInputFromFormData(formData));

  if (!validation.ok) {
    Object.assign(
      errors,
      Object.fromEntries(Object.entries(validation.errors).map(([field, message]) => [field, translate(message)])),
    );
  }

  const files = formData.getAll("documents").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length === 0 && formData.get("documentMode") !== "append") {
    errors.documents = translate("Choose at least one file.");
  }

  for (const file of files) {
    const fileError = assertAllowedDocument(file);
    if (fileError) {
      errors.documents = `${file.name}: ${translate(fileError)}`;
      break;
    }
  }

  return errors;
}

function shouldShowValidationModal(formData: FormData): boolean {
  const textFields = [
    "fullName",
    "email",
    "phone",
    "organization",
    "jobTitle",
    "dietaryNeeds",
    "accessibilityNeeds",
    "notes",
    "password",
  ];
  const hasTextValue = textFields.some((field) => String(formData.get(field) || "").trim().length > 0);
  const hasDocument = formData.getAll("documents").some((item) => item instanceof File && item.size > 0);

  return hasTextValue || hasDocument;
}
