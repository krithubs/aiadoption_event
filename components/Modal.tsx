"use client";

import { X } from "lucide-react";

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
  if (!modal) return null;

  return (
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
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p>{modal.message}</p>
        <div className="actions">
          <button className="button" type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
