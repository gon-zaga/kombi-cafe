'use client'

import { useState, useEffect } from "react";

interface Staff {
  user_id: number;
  username: string;
  role: "barista" | "owner";
  first_name: string | null;
  last_name: string | null;
  started_at: string | null;
  birthdate: string | null;
  created_at: string;
}

interface EditStaffModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditStaffModal({ staff, isOpen, onClose, onUpdated }: EditStaffModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setUsername(staff.username);
      setFirstName(staff.first_name || "");
      setLastName(staff.last_name || "");
      setStartedAt(staff.started_at ? staff.started_at.split("T")[0] : "");
      setBirthdate(staff.birthdate ? staff.birthdate.split("T")[0] : "");
      setError("");
    }
  }, [staff]);

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password && (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
      setError("Password must contain uppercase, lowercase, number, and special character");
      return;
    }

    setSubmitting(true);

    try {
      const body: Record<string, string | null> = {
        username,
        role: "barista",
        first_name: firstName || null,
        last_name: lastName || null,
        started_at: startedAt || null,
        birthdate: birthdate || null,
      };

      if (password) {
        body.password = password;
      }

      const res = await fetch(`/api/staff/${staff?.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff");
      }

      handleClose();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Staff Member</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Min 8 chars, upper, lower, number, special"
            />
            <p className="text-xs text-gray-500 mt-1">Min 8 chars, uppercase, lowercase, number, special character</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}