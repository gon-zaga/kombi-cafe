'use client'

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/app/ui/Toast";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSummary("");
      setDescription("");
      setError("");
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Summary is required");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ summary: summary.trim(), description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Rate limit exceeded. Please wait before submitting another report.");
        } else if (res.status === 401) {
          setError("Please log in to submit a bug report.");
        } else {
          setError(data.error || "Failed to submit bug report");
        }
        return;
      }

      success("Bug report submitted successfully!");
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-report-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 id="bug-report-title" className="text-lg font-bold text-dark-brown">
            Report a Bug
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close bug report"
            className="text-dark-brown/50 hover:text-dark-brown text-2xl leading-none p-1 -mt-1 disabled:opacity-50"
          >
            ×
          </button>
        </div>
        <p className="text-dark-brown/70 mb-4">
          Help us improve by reporting issues you encounter. Include steps to reproduce if possible.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="summary" className="block text-sm font-medium text-dark-brown mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the bug"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              maxLength={200}
              disabled={submitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{summary.length}/200</p>
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-dark-brown mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected behavior, screenshots, etc."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              maxLength={2000}
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/2000</p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-dark-brown bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !summary.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}