'use client'

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/app/ui/Toast";
import {
  Attachment,
  MAX_ATTACHMENTS,
  ATTACHMENT_ACCEPT,
  fileToAttachment,
} from "@/app/lib/attachmentUpload";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { success, warning } = useToast();
  const [wasOpen, setWasOpen] = useState(isOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSummary("");
      setDescription("");
      setAttachments([]);
      setAttachmentError("");
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

  const busy = submitting || processing;

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    setAttachmentError("");

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (files.length > remaining) {
      setAttachmentError(
        `You can attach at most ${MAX_ATTACHMENTS} files. ${remaining === 0 ? "Remove one first." : `Only ${remaining} more allowed.`}`
      );
    }

    const accepted = files.slice(0, Math.max(0, remaining));
    setProcessing(true);
    const added: Attachment[] = [];
    const problems: string[] = [];

    for (const file of accepted) {
      try {
        added.push(await fileToAttachment(file));
      } catch (err) {
        problems.push(err instanceof Error ? err.message : `Could not read ${file.name}.`);
      }
    }

    if (added.length > 0) {
      setAttachments((prev) => [...prev, ...added]);
    }
    if (problems.length > 0) {
      setAttachmentError(problems.join(" "));
    }
    setProcessing(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Summary is required");
      return;
    }
    if (busy) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          summary: summary.trim(),
          description: description.trim(),
          attachments: attachments.map(({ fileName, contentType, dataBase64 }) => ({
            fileName,
            contentType,
            dataBase64,
          })),
        }),
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

      const failed = Array.isArray(data.attachmentErrors) ? data.attachmentErrors.length : 0;
      if (failed > 0) {
        warning(`Bug #${data.id} filed, but ${failed} attachment${failed > 1 ? "s" : ""} failed to upload.`);
      } else {
        success("Bug report submitted successfully!");
      }
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
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <h2 id="bug-report-title" className="text-lg font-bold text-dark-brown">
            Report a Bug
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
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
              disabled={busy}
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{summary.length}/200</p>
          </div>

          <div className="mb-4">
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
              disabled={busy}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/2000</p>
          </div>

          <div className="mb-6">
            <span className="block text-sm font-medium text-dark-brown mb-1">
              Attachments (optional)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFilesSelected}
              disabled={busy || attachments.length >= MAX_ATTACHMENTS}
              className="sr-only"
              id="bug-attachments"
            />
            <label
              htmlFor="bug-attachments"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-400 text-sm font-medium text-dark-brown cursor-pointer hover:bg-amber-50 transition-colors ${
                busy || attachments.length >= MAX_ATTACHMENTS ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {processing ? "Processing..." : "+ Attach screenshots or logs"}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WEBP, GIF, .txt, .log — up to {MAX_ATTACHMENTS} files.
            </p>

            {attachmentError && (
              <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {attachmentError}
              </div>
            )}

            {attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.fileName}-${index}`}
                    className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <span className="min-w-0 flex flex-col">
                      <span className="text-sm text-dark-brown truncate">{file.fileName}</span>
                      <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={busy}
                      aria-label={`Remove ${file.fileName}`}
                      className="text-gray-400 hover:text-red-600 text-lg leading-none p-1 disabled:opacity-50"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sticky bottom-0 z-10 mt-2 flex gap-2 justify-end border-t border-gray-100 bg-white pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-dark-brown bg-amber-100 rounded-xl hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={busy || !summary.trim()}
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