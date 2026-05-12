"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useI18n } from "./LanguageProvider";

type ModalKind = "success" | "error" | "info";

type ModalState = {
  title: string;
  message: string;
  kind?: ModalKind;
};

type Props = {
  modal: ModalState | null;
  onClose: () => void;
};

export type { ModalState };

export function Modal({ modal, onClose }: Props) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!modal || !mounted) return null;

  return createPortal(
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal modal-${modal.kind || "info"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{modal.title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("closeDialog")}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <p>{modal.message}</p>
        <div className="actions">
          <button className="button" type="button" onClick={onClose}>
            {t("modalOk")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
