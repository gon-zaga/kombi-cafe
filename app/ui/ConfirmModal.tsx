'use client'

// Reusable confirmation dialog for any destructive or irreversible action
// (delete staff, delete menu item, delete ingredient, revert an order, ...).
// Replaces window.confirm/alert: native dialogs title themselves with the page
// origin ("localhost says") and break the visual style.
// Both buttons stay disabled for a short countdown so a double click or an
// accidental Enter cannot answer the prompt before it has been read.
import { useEffect, useState } from "react";

interface ConfirmModalProps {
  // Whether the dialog is visible. Kept as a prop so callers can own the state
  isOpen: boolean;

  // Heading and body copy. Keep the body to one sentence naming the exact thing
  title: string;
  message: string;

  // Button labels; defaults suit a delete confirmation
  confirmLabel?: string;
  cancelLabel?: string;

  // danger = red confirm button (destructive), primary = amber (non-destructive
  // corrections like moving an order back a status)
  tone?: "danger" | "primary";

  // How long the buttons stay locked, in milliseconds
  delayMs?: number;

  // Called when the countdown finishes and the user confirms
  onConfirm: () => void;

  // Called when the user cancels, closes the backdrop, or presses Escape
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  delayMs = 3000,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Seconds still blocking the buttons. Counted down so the user can see why
  // the buttons are dead instead of thinking the dialog is broken.
  const [remaining, setRemaining] = useState(Math.ceil(delayMs / 1000));

  // Reset the countdown whenever the dialog is closed and reopened. Doing this
  // during render (instead of inside useEffect) is the React-sanctioned way to
  // adjust state when a prop changes, and it avoids the react-hooks
  // "set-state-in-effect" lint error.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setRemaining(Math.ceil(delayMs / 1000));
  }

  // Runs the countdown. setInterval fires inside a callback, not synchronously
  // in the effect body, so it does not trip set-state-in-effect either.
  useEffect(() => {
    if (!isOpen || remaining <= 0) return;

    const timer = setTimeout(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, remaining]);

  // Escape cancels, matching what the X button and the backdrop do
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  // Render nothing when closed so the caller can leave it mounted
  if (!isOpen) return null;

  // Everything, including the backdrop click, is locked until the countdown ends
  const locked = remaining > 0;

  const confirmStyles =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-amber-600 hover:bg-amber-700";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      // Clicking the backdrop cancels, but only after the countdown: during the
      // lock a stray click anywhere must not answer the prompt for the user.
      // stopPropagation always runs because this component is often rendered
      // inside another modal's overlay, whose backdrop would otherwise close it.
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {/* Warning glyph, tinted to match the button tone */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              tone === "danger"
                ? "bg-red-100 text-red-600"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-gray-900"
            >
              {title}
            </h2>
            <p className="text-sm text-gray-600 mt-1 break-words">{message}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={locked}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={locked}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmStyles}`}
          >
            {/* While counting down the label itself shows the remaining seconds */}
            {locked ? `${confirmLabel} (${remaining})` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}