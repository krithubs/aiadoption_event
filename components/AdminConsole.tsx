"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, LogOut, RefreshCw, Search } from "lucide-react";
import type { PublicRegistration, RegistrationStatus } from "@/lib/types";
import { Modal, type ModalState } from "./Modal";
import { CustomDropdown } from "./CustomDropdown";
import { useI18n } from "./LanguageProvider";

const statusOptions: RegistrationStatus[] = ["submitted", "reviewing", "approved"];

export function AdminConsole() {
  const router = useRouter();
  const { t } = useI18n();
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
        title: t("statusNotUpdated"),
        message: payload.error || "Please try again.",
        kind: "error",
      });
      return;
    }

    setRegistrations((current) => current.map((item) => (item.id === payload.registration.id ? payload.registration : item)));
    setModal({
      title: t("statusUpdated"),
      message: `${payload.registration.fullName} is now marked ${payload.registration.status}.`,
      kind: "success",
    });
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setModal({
      title: t("signedOut"),
      message: t("sessionClosed"),
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
            <h2>{t("reviewDashboard")}</h2>
            <p className="meta">
              {registrations.length} {t("totalSubmissions")}
            </p>
          </div>
          <div className="actions" style={{ marginTop: 0 }}>
            <button className="ghost-button" type="button" onClick={load} disabled={busy}>
              <RefreshCw size={18} aria-hidden />
              {t("refresh")}
            </button>
            <button className="danger-button" type="button" onClick={logout}>
              <LogOut size={18} aria-hidden />
              {t("signOut")}
            </button>
          </div>
        </div>
      </section>

      <div className="admin-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{t("attendeeQueue")}</h2>
              <p className="meta">{t("queueSearchHelp")}</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <Search size={18} aria-hidden />
              <input
                aria-label="Search registrations"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchRegistrations")}
              />
            </div>
            {busy ? <AdminListSkeleton /> : null}
            {!busy && filtered.length === 0 ? <div className="empty-state">{t("noRegistrations")}</div> : null}
            {!busy ? (
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
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{t("attendeeProfile")}</h2>
              <p className="meta">{selected ? selected.referenceCode : t("selectSubmission")}</p>
            </div>
            {selected ? (
              <a className="button" href={`/api/admin/tag/${selected.id}`}>
                <Download size={18} aria-hidden />
                {t("tagPdf")}
              </a>
            ) : null}
          </div>
          <div className="panel-body">
            {busy ? (
              <AdminDetailSkeleton />
            ) : !selected ? (
              <div className="empty-state">{t("selectToReview")}</div>
            ) : (
              <>
                <div className="summary-list">
                  <div className="summary-row">
                    <span>{t("name")}</span>
                    <strong>{selected.fullName}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("email")}</span>
                    <strong>{selected.email}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("phone")}</span>
                    <strong>{selected.phone}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("organization")}</span>
                    <strong>{selected.organization}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("jobTitle")}</span>
                    <strong>{selected.jobTitle}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("ticket")}</span>
                    <strong>{selected.ticketType}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("dietary")}</span>
                    <strong>{selected.dietaryNeeds || t("none")}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("accessibility")}</span>
                    <strong>{selected.accessibilityNeeds || t("none")}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{t("notes")}</span>
                    <strong>{selected.notes || t("none")}</strong>
                  </div>
                </div>

                <div className="field" style={{ marginTop: 20 }}>
                  <label htmlFor="status">{t("reviewStatus")}</label>
                  <CustomDropdown
                    id="status"
                    value={selected.status}
                    options={statusOptions.map((status) => ({ value: status, label: status }))}
                    onChange={(value) => updateStatus(value as RegistrationStatus)}
                  />
                </div>

                <h3 style={{ marginTop: 24 }}>{t("supportingDocuments")}</h3>
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
                        {t("download")}
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

function AdminListSkeleton() {
  return (
    <div className="list" aria-label="Loading registrations">
      {[0, 1, 2].map((item) => (
        <div className="list-button skeleton-card" key={item}>
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

function AdminDetailSkeleton() {
  return (
    <div className="summary-list" aria-label="Loading registration detail">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div className="summary-row" key={item}>
          <span className="skeleton-line short" />
          <strong className="skeleton-line wide" />
        </div>
      ))}
    </div>
  );
}
