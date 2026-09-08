import React from 'react';
import { ModalPortal } from './ModalPortal';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Defaults to destructive (rose) confirm button */
  danger?: boolean;
  busy?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  danger = true,
  busy = false,
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-md shadow-brand-lg border border-slate-200/80 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="confirm-modal-title" className="text-xl font-black text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{message}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-3 rounded-xl font-semibold text-white disabled:opacity-50 ${
                danger
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-brand-ink hover:bg-brand-ink-light'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmModal;
