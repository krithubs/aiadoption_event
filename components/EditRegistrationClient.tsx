"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RegistrationForm } from "@/components/RegistrationForm";
import type { PublicRegistration } from "@/lib/types";

export function EditRegistrationClient() {
  const [registration, setRegistration] = useState<PublicRegistration | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("cmd-edit-registration");
    const storedPassword = sessionStorage.getItem("cmd-edit-password") || "";
    if (stored) setRegistration(JSON.parse(stored) as PublicRegistration);
    setPassword(storedPassword);
  }, []);

  if (!registration) {
    return (
      <section className="panel">
        <div className="panel-body empty-state">
          <div>
            <h2>No registration loaded</h2>
            <p className="meta">Use your reference code and password before editing.</p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <Link className="button" href="/registration/lookup">
                Go to My Registration
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="hero">
      <section className="intro">
        <div className="eyebrow">Attendee portal</div>
        <h1>Review and update your submission</h1>
        <p className="lead">You can change details, add documents, or replace the full document set.</p>
        <div className="documents">
          {registration.documents.map((document) => (
            <div className="document-row" key={document.id}>
              <div>
                <strong>{document.originalName}</strong>
                <div className="meta">{Math.ceil(document.size / 1024)} KB</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <RegistrationForm
        mode="edit"
        initialRegistration={registration}
        referenceCode={registration.referenceCode}
        password={password}
      />
    </div>
  );
}
