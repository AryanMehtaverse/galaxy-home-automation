"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2
          id="modal-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {title}
        </h2>
        <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {children}
        </div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
