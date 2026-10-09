'use client';

// Owner settings: configure opening/closing time and system-down mode.

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import { DEFAULT_SYSTEM_DOWN_MESSAGE } from "@/app/lib/systemDown";

const to12h = (time24: string) => {
  const [h, m] = time24.split(":").map((n) => parseInt(n, 10));
  const hours = h % 12 || 12;

  return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function SettingsPage() {
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [systemDown, setSystemDown] = useState(false);
  const [systemDownMessage, setSystemDownMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");

        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`);
        }

        const data = await response.json();

        setOpeningTime(
          data.opening_time ? data.opening_time.substring(0, 5) : "08:00"
        );
        setClosingTime(
          data.closing_time ? data.closing_time.substring(0, 5) : "20:00"
        );
        setSystemDown(Boolean(data.system_down));
        setSystemDownMessage(data.system_down_message ?? "");
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Could not load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess(false);

    if (!openingTime || !closingTime) {
      setError("Both opening and closing times are required");
      return;
    }

    if (openingTime === closingTime) {
      setError("Opening and closing time can't be the same");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opening_time: openingTime,
          closing_time: closingTime,
          system_down: systemDown,
          system_down_message: systemDownMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not save settings");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(
        err instanceof Error ? err.message : "Could not save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-card-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-800 border-t-transparent" />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-card-cream">
      <OwnerHeader title="SETTINGS" />

      <div className="px-4 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Settings saved successfully!
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-6 shadow"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Time
              </label>

              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Time
              </label>

              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  System Down Mode
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Closes the store immediately, ignoring opening hours.
                </p>
              </div>

               <label
                 onClick={(e) => e.stopPropagation()}
                 title={systemDown ? "System Down Mode is active — click to deactivate" : "System Down Mode is inactive — click to activate"}
                 className="relative inline-flex items-center cursor-pointer"
               >
                 <input
                   type="checkbox"
                   checked={systemDown}
                   aria-label={systemDown ? "Deactivate System Down Mode" : "Activate System Down Mode"}
                   onChange={(e) => setSystemDown(e.target.checked)}
                   className="sr-only peer"
                 />
                 <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-red-500 transition-colors" />
                 <div className="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
               </label>
            </div>

            {systemDown && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                <p className="text-sm text-red-700 font-medium">
                  System Down Mode is active
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Customers will see the system notice instead of the ordering
                  pages.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Down Message
              </label>

              <textarea
                value={systemDownMessage}
                onChange={(e) => setSystemDownMessage(e.target.value)}
                placeholder={DEFAULT_SYSTEM_DOWN_MESSAGE}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-32 resize-y"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use the default system-down message.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>


      </div>
    </section>
  );
}
