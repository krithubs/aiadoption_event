"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Modal, type ModalState } from "./Modal";

export function LookupForm() {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setModal(null);

    const formData = new FormData(event.currentTarget);
    const referenceCode = String(formData.get("referenceCode") || "").trim().toUpperCase();
    const password = String(formData.get("password") || "");

    const response = await fetch("/api/registration/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceCode, password }),
    });
    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setModal({
        title: "Registration not found",
        message: payload.error || "Unable to find registration.",
        kind: "error",
      });
      return;
    }

    sessionStorage.setItem("cmd-edit-registration", JSON.stringify(payload.registration));
    sessionStorage.setItem("cmd-edit-password", password);
    router.push("/registration/edit");
  }

  return (
    <section className="panel">
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>Access your submission</h2>
          <p className="meta">Enter the reference code issued after registration.</p>
        </div>
      </div>
      <form className="panel-body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="referenceCode">Reference code</label>
            <input id="referenceCode" name="referenceCode" placeholder="CMD-2026-ABC123" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength={8} required />
          </div>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={busy}>
            <Search size={18} aria-hidden />
            {busy ? "Checking..." : "Continue to edit"}
          </button>
        </div>
      </form>
    </section>
  );
}
