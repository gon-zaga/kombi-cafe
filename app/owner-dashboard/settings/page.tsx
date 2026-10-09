'use client'

import { useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import { useRouter } from "next/navigation";

// Helper function to convert 24-hour format to 12-hour format
const convertTo12HourFormat = (time24: string) => {
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour "0" should be "12"
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function SettingsPage() {
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/settings`);
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`);
      }
      const data = await response.json();
      // Extract HH:MM from HH:MM:SS format
      const openingTimeValue = data.opening_time ? data.opening_time.substring(0, 5) : "08:00";
      const closingTimeValue = data.closing_time ? data.closing_time.substring(0, 5) : "20:00";
      setOpeningTime(openingTimeValue);
      setClosingTime(closingTimeValue);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Could not load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!openingTime || !closingTime) {
      setError("Both opening and closing times are required");
      return;
    }

    try {
      const response = await fetch(`/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ opening_time: openingTime, closing_time: closingTime }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      setSuccess(true);
      setError("");
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Could not save settings");
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
                Opening Time (24-hour format)
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus-ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Time (24-hour format)
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus-ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
        
         <div className="mt-6 text-sm text-gray-500">
           <p>When the store is closed:</p>
           <ul className="list-disc list-inside mt-2">
             <li>Customers will see a "STORE CLOSED" page instead of the table selection</li>
             <li>No orders can be placed through the API</li>
             <li>Opening time: {openingTime ? convertTo12HourFormat(openingTime) : "Not set"}</li>
             <li>Closing time: {closingTime ? convertTo12HourFormat(closingTime) : "Not set"}</li>
           </ul>
         </div>
      </div>
    </section>
  );
}