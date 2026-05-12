"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Pencil } from "lucide-react";
import type { PublicRegistration } from "@/lib/types";

export function CompletionClient() {
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
            <h2>No recent submission</h2>
            <p className="meta">Submit a registration to receive a reference code.</p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <Link className="button" href="/">
                Start registration
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
            <h2>Registration received</h2>
            <p className="meta">Keep this reference code for edits and event support.</p>
          </div>
          <ClipboardCheck color="var(--success)" aria-hidden />
        </div>
        <div className="panel-body summary-list">
          <div className="summary-row">
            <span>Name</span>
            <strong>{registration.fullName}</strong>
          </div>
          <div className="summary-row">
            <span>Email</span>
            <strong>{registration.email}</strong>
          </div>
          <div className="summary-row">
            <span>Ticket</span>
            <strong>{registration.ticketType}</strong>
          </div>
          <div className="summary-row">
            <span>Documents</span>
            <strong>{registration.documents.length} uploaded</strong>
          </div>
        </div>
      </section>
      <aside className="reference-box">
        <div className="eyebrow">Reference code</div>
        <div className="reference-code">{registration.referenceCode}</div>
        <p>Use this code with your password to view or edit your submission.</p>
        <div className="actions">
          <Link className="ghost-button" href="/registration/lookup">
            <Pencil size={18} aria-hidden />
            Manage later
          </Link>
        </div>
      </aside>
    </div>
  );
}
