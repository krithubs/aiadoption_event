"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Modal, type ModalState } from "./Modal";

export function AdminLoginForm() {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setModal(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    const payload = await response.json();
    setBusy(false);

    if (!response.ok) {
      setModal({
        title: "Admin login failed",
        message: payload.error || "Unable to log in.",
        kind: "error",
      });
      return;
    }

    router.push("/admin/registrations");
  }

  return (
    <section className="panel">
      <Modal modal={modal} onClose={() => setModal(null)} />
      <div className="panel-header">
        <div>
          <h2>Sign in to Admin Console</h2>
          <p className="meta">Credentials are read from environment variables.</p>
        </div>
      </div>
      <form className="panel-body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
        </div>
        <div className="actions">
          <button className="button" disabled={busy}>
            <LogIn size={18} aria-hidden />
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </section>
  );
}
