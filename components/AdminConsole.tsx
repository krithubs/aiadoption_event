"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, LogOut, RefreshCw, Search } from "lucide-react";
import type { PublicRegistration, RegistrationStatus } from "@/lib/types";
import { Modal, type ModalState } from "./Modal";

const statusOptions: RegistrationStatus[] = ["submitted", "reviewing", "approved"];

export function AdminConsole() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [modal, setModal] = useState<ModalState | null>(null);

  const selected = registrations.find((registration) => registration.id === selectedId) || registrations[0] || null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return registrations;
    return registrations.filter((registration) =>
      [
        registration.fullName,
        registration.email,
        registration.organization,
        registration.referenceCode,
        registration.ticketType,
        registration.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, registrations]);

  async function load() {
    setBusy(true);
    const response = await fetch("/api/admin/registrations");
    const payload = await response.json();
    setBusy(false);

    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }

    if (!response.ok) {
      setModal({
        title: "Unable to load registrations",
        message: payload.error || "Please try again.",
        kind: "error",
      });
      return;
    }

    setRegistrations(payload.registrations);
    if (!selectedId && payload.registrations[0]) setSelectedId(payload.registrations[0].id);
  }

  async function updateStatus(status: RegistrationStatus) {
    if (!selected) return;
    const response = await fetch(`/api/admin/registrations/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setModal({
        title: "Status not updated",
        message: payload.error || "Please try again.",
        kind: "error",
      });
      return;
    }

    setRegistrations((current) => current.map((item) => (item.id === payload.registration.id ? payload.registration : item)));
    setModal({
      title: "Status updated",
      message: `${payload.registration.fullName} is now marked ${payload.registration.status}.`,
      kind: "success",
    });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setModal({
      title: "Signed out",
      message: "Admin session has been closed.",
      kind: "success",
    });
    setTimeout(() => router.push("/admin/login"), 450);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Modal modal={modal} onClose={() => setModal(null)} />
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <div>
            <h2>Review dashboard</h2>
            <p className="meta">{registrations.length} total submissions</p>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="ghost-button" type="button" onClick={load} disabled={busy}>
              <RefreshCw size={18} aria-hidden />
              Refresh
            </button>
            <button className="danger-button" type="button" onClick={logout}>
              <LogOut size={18} aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </section>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Attendee queue</h2>
              <p className="meta">Search by name, email, company, code, ticket, or status.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <Search size={18} aria-hidden />
              <input
                aria-label="Search registrations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search registrations"
              />
            </div>
            {busy ? <div className="empty-state">Loading registrations...</div> : null}
            {!busy && filtered.length === 0 ? <div className="empty-state">No registrations match this view.</div> : null}
            <div className="list">
              {filtered.map((registration) => (
                <button
                  className={`list-button ${selected?.id === registration.id ? "active" : ""}`}
                  type="button"
                  key={registration.id}
                  onClick={() => setSelectedId(registration.id)}
                >
                  <div className="list-top">
                    <strong>{registration.fullName}</strong>
                    <span className="status-pill">{registration.status}</span>
                  </div>
                  <div className="meta">{registration.referenceCode}</div>
                  <div className="meta">
                    {registration.organization} · {registration.ticketType}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Attendee profile</h2>
              <p className="meta">{selected ? selected.referenceCode : "Select a submission"}</p>
            </div>
            {selected ? (
              <a className="button" href={`/api/admin/tag/${selected.id}`}>
                <Download size={18} aria-hidden />
                Tag PDF
              </a>
            ) : null}
          </div>
          <div className="panel-body">
            {!selected ? (
              <div className="empty-state">Select a registration to review details.</div>
            ) : (
              <>
                <div className="summary-list">
                  <div className="summary-row">
                    <span>Name</span>
                    <strong>{selected.fullName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Email</span>
                    <strong>{selected.email}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Phone</span>
                    <strong>{selected.phone}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Organization</span>
                    <strong>{selected.organization}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Job title</span>
                    <strong>{selected.jobTitle}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Ticket</span>
                    <strong>{selected.ticketType}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Dietary</span>
                    <strong>{selected.dietaryNeeds || "None"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Accessibility</span>
                    <strong>{selected.accessibilityNeeds || "None"}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Notes</span>
                    <strong>{selected.notes || "None"}</strong>
                  </div>
                </div>

                <div className="field" style={{ marginTop: 20 }}>
                  <label htmlFor="status">Review status</label>
                  <select
                    id="status"
                    value={selected.status}
                    onChange={(event) => updateStatus(event.target.value as RegistrationStatus)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <h3 style={{ marginTop: 24 }}>Supporting documents</h3>
                <div className="documents">
                  {selected.documents.map((document) => (
                    <div className="document-row" key={document.id}>
                      <div>
                        <strong>{document.originalName}</strong>
                        <div className="meta">
                          {Math.ceil(document.size / 1024)} KB · {new Date(document.uploadedAt).toLocaleString()}
                        </div>
                      </div>
                      <a className="ghost-button" href={`/api/documents/${document.id}`}>
                        <FileText size={18} aria-hidden />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
