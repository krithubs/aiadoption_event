"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, LogOut, RefreshCw, Search } from "lucide-react";
import type { PublicRegistration, RegistrationStatus } from "@/lib/types";
import { Modal, type ModalState } from "./Modal";
import { CustomDropdown } from "./CustomDropdown";
import { useI18n } from "./LanguageProvider";

const statusOptions: RegistrationStatus[] = ["submitted", "reviewing", "approved"];

function statusLabel(status: RegistrationStatus, t: (key: string) => string): string {
  return t(`status${status[0].toUpperCase()}${status.slice(1)}`);
}

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
        title: t("unableLoadRegistrations"),
        message: t("tryAgain"),
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
        message: t("tryAgain"),
        kind: "error",
      });
      return;
    }

    setRegistrations((current) => current.map((item) => (item.id === payload.registration.id ? payload.registration : item)));
    setModal({
      title: t("statusUpdated"),
      message: `${payload.registration.fullName} ${t("statusUpdatedTo")} ${statusLabel(payload.registration.status, t)}.`,
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
                      <span className="status-pill">{statusLabel(registration.status, t)}</span>
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
                <div className="profile-sections">
                  <section className="profile-section">
                    <h3>{t("personalInfo")}</h3>
                    <div className="profile-field-grid">
                      <ProfileField label={t("name")} value={selected.fullName} />
                      <ProfileField label={t("email")} value={selected.email} />
                      <ProfileField label={t("phone")} value={selected.phone} />
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>{t("eventInfo")}</h3>
                    <div className="profile-field-grid">
                      <ProfileField label={t("organization")} value={selected.organization} />
                      <ProfileField label={t("jobTitle")} value={selected.jobTitle} />
                      <ProfileField label={t("ticket")} value={selected.ticketType} />
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>{t("attendeeNeeds")}</h3>
                    <div className="profile-field-grid">
                      <ProfileField label={t("dietary")} value={selected.dietaryNeeds || t("none")} />
                      <ProfileField label={t("accessibility")} value={selected.accessibilityNeeds || t("none")} />
                      <ProfileField label={t("notes")} value={selected.notes || t("none")} wide />
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>{t("reviewControl")}</h3>
                    <div className="field">
                      <label htmlFor="status">{t("reviewStatus")}</label>
                      <CustomDropdown
                        id="status"
                        value={selected.status}
                        options={statusOptions.map((status) => ({ value: status, label: statusLabel(status, t), tone: status }))}
                        onChange={(value) => updateStatus(value as RegistrationStatus)}
                      />
                    </div>
                  </section>
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

function ProfileField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`profile-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
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
