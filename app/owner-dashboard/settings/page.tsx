'use client'

// Owner settings: set opening/closing time; outside these hours customers see STORE CLOSED
import { useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";

const to12h = (time24: string) => {
  const [h, m] = time24.split(':').map((n) => parseInt(n, 10));
  const hours = h % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
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
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error(`Failed to load settings: ${response.status}`);
    const data = await response.json();
    setOpeningTime(data.opening_time ? data.opening_time.substring(0, 5) : "08:00");
    setClosingTime(data.closing_time ? data.closing_time.substring(0, 5) : "20:00");
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    const response = await fetch('/api/settings', {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        opening_time: openingTime, 
        closing_time: closingTime,
        system_down: systemDown,
        system_down_message: systemDownMessage
      }),
    });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save settings");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err instanceof Error ? err.message : "Could not save settings");
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow">
          <div className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Down Mode
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={systemDown}
                  onChange={(e) => setSystemDown(e.target.checked)}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Enable to manually set store as closed
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Down Message
              </label>
              <textarea
                value={systemDownMessage}
                onChange={(e) => setSystemDownMessage(e.target.value)}
                placeholder="The ordering management system is down for a moment!\nWe are working to bring it back online as quickly as possible.\nTo place your order: Please see a staff member at the counter.\nThey are ready to take your order manually!"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 h-32 resize-y"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use default message when system down is active
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

         <div className="mt-6 text-sm text-gray-500">
           <p>When the store is closed:</p>
           <ul className="list-disc list-inside mt-2">
             <li>Customers will see a &quot;STORE CLOSED&quot; page instead of the menu</li>
             <li>No orders can be placed through the API</li>
             <li>Staff and owner pages stay accessible</li>
             <li>Opening time: {openingTime ? to12h(openingTime) : "Not set"}</li>
             <li>Closing time: {closingTime ? to12h(closingTime) : "Not set"}</li>
           </ul>
           {systemDown && (
             <p className="mt-2 text-xs text-amber-600">
               <strong>System Down Mode is active</strong> - Store will appear closed regardless of opening hours
             </p>
           )}
         </div>
      </div>
    </section>
  );
}