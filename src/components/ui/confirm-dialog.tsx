"use client";

/**
 * ConfirmDialog — accessible modal replacement for window.confirm().
 *
 * - Backdrop click closes
 * - ESC closes
 * - Focus is trapped inside the dialog while open
 * - Initial focus lands on the destructive button so keyboard users can
 *   confirm or tab to cancel
 *
 * Usage:
 *   <ConfirmDialog
 *     open={open}
 *     onCancel={() => setOpen(false)}
 *     onConfirm={async () => { await remove(); setOpen(false); }}
 *     title="Remove this friend?"
 *     description="They'll need to send a new request to reconnect."
 *     confirmLabel="Remove"
 *     destructive
 *   />
 */

import { useEffect, useRef } from "react";
import { Button } from "./button";

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  destructive?: boolean;
  /** Mark while the confirm action is running (button shows spinner). */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        // Trivial focus trap: bounce between cancel + confirm.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled])",
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // Defer to next tick so the modal is mounted before we focus.
    setTimeout(() => confirmRef.current?.focus(), 0);
    // Lock body scroll while open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        aria-label="Close dialog"
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl bg-zinc-900 ring-1 ring-white/10 p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-zinc-50">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? "danger" : "primary"}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
