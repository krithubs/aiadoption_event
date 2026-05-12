"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Save, Send } from "lucide-react";
import type { PublicRegistration } from "@/lib/types";
import { Modal, type ModalState } from "./Modal";

type Props = {
  mode: "create" | "edit";
  initialRegistration?: PublicRegistration;
  referenceCode?: string;
  password?: string;
};

const ticketTypes = ["General", "VIP", "Speaker", "Sponsor", "Staff"];

function valueFor(registration: PublicRegistration | undefined, key: keyof PublicRegistration): string {
  const value = registration?.[key];
  return typeof value === "string" ? value : "";
}

export function RegistrationForm({ mode, initialRegistration, referenceCode, password }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [documentMode, setDocumentMode] = useState("append");

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setModal(null);

    const formData = new FormData(event.currentTarget);
    if (mode === "edit") {
      formData.set("referenceCode", referenceCode || "");
      formData.set("password", password || "");
      formData.set("documentMode", documentMode);
    }

    const response = await fetch("/api/registration", {
      method: mode === "create" ? "POST" : "PUT",
      body: formData,
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      const errorText = payload.error || Object.values(payload.errors || {}).join(" ");
      setModal({
        title: "Registration not saved",
        message: errorText || "Unable to save registration.",
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
        title: "Registration updated",
        message: "Your latest details and document changes have been saved.",
        kind: "success",
      });
    }
  }

  return (
    <section className="panel" aria-label={mode === "create" ? "Registration form" : "Edit registration form"}>
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>{mode === "create" ? "Attendee details" : "Edit submission"}</h2>
          <p className="meta">
            {mode === "create"
              ? "All required fields are used for admission, name tag, and event communications."
              : `Reference ${referenceCode}`}
          </p>
        </div>
        {mode === "edit" ? <span className="status-pill">{initialRegistration?.status}</span> : null}
      </div>
      <form className="panel-body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" name="fullName" defaultValue={defaults.fullName} required minLength={2} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={defaults.email} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={defaults.phone} required />
          </div>
          <div className="field">
            <label htmlFor="organization">Organization</label>
            <input id="organization" name="organization" defaultValue={defaults.organization} required />
          </div>
          <div className="field">
            <label htmlFor="jobTitle">Job title</label>
            <input id="jobTitle" name="jobTitle" defaultValue={defaults.jobTitle} required />
          </div>
          <div className="field">
            <label htmlFor="ticketType">Ticket type</label>
            <select id="ticketType" name="ticketType" defaultValue={defaults.ticketType}>
              {ticketTypes.map((ticketType) => (
                <option key={ticketType}>{ticketType}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="dietaryNeeds">Dietary needs</label>
            <input id="dietaryNeeds" name="dietaryNeeds" defaultValue={defaults.dietaryNeeds} placeholder="None" />
          </div>
          <div className="field">
            <label htmlFor="accessibilityNeeds">Accessibility needs</label>
            <input
              id="accessibilityNeeds"
              name="accessibilityNeeds"
              defaultValue={defaults.accessibilityNeeds}
              placeholder="None"
            />
          </div>
          <div className="field full">
            <label htmlFor="notes">Additional notes</label>
            <textarea id="notes" name="notes" defaultValue={defaults.notes} maxLength={800} />
          </div>
          <div className="field full">
            <label htmlFor="documents">Supporting documents</label>
            <input
              id="documents"
              name="documents"
              type="file"
              multiple
              required={mode === "create"}
              accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <span className="hint">Upload PDF, PNG, JPG, or DOCX files. Each file can be up to 8 MB.</span>
          </div>
          {mode === "edit" ? (
            <div className="field full">
              <label htmlFor="documentMode">Document update mode</label>
              <select id="documentMode" value={documentMode} onChange={(event) => setDocumentMode(event.target.value)}>
                <option value="append">Add uploaded documents to current file set</option>
                <option value="replace">Replace current documents with uploaded files</option>
              </select>
            </div>
          ) : null}
          <div className="field full">
            <label htmlFor="password">{mode === "create" ? "Set password" : "Confirm password"}</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              defaultValue={mode === "edit" ? password : ""}
              autoComplete="new-password"
            />
            <span className="hint">Use this password with your reference code to return and edit.</span>
          </div>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={busy}>
            {mode === "create" ? <Send size={18} aria-hidden /> : <Save size={18} aria-hidden />}
            {busy ? "Saving..." : mode === "create" ? "Submit registration" : "Save changes"}
          </button>
          <span className="meta">
            <FileUp size={15} aria-hidden /> Documents are attached to this registration record.
          </span>
        </div>
      </form>
    </section>
  );
}
