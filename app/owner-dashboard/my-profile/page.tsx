'use client'

import { useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import { useAuth } from "@/app/lib/auth/AuthContext";

interface StaffProfile {
  user_id: number;
  username: string;
  role: "barista" | "owner";
  first_name: string | null;
  last_name: string | null;
  started_at: string | null;
  birthdate: string | null;
  created_at: string;
}

export default function MyProfile() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    started_at: "",
    birthdate: "",
    password: "",
  });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile({
          user_id: data.user.userId,
          username: data.user.username,
          role: data.user.role,
          first_name: data.user.firstName,
          last_name: data.user.lastName,
          started_at: null,
          birthdate: null,
          created_at: "",
        });
        setFormData({
          first_name: data.user.firstName || "",
          last_name: data.user.lastName || "",
          started_at: "",
          birthdate: "",
          password: "",
        });
      } else {
        setSaveError("Failed to load profile");
      }
    } catch {
      setSaveError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);

    try {
      const body: Record<string, string | null> = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        started_at: formData.started_at || null,
        birthdate: formData.birthdate || null,
      };

      if (formData.password) {
        if (formData.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9]/.test(formData.password)) {
          throw new Error("Password must contain uppercase, lowercase, number, and special character");
        }
        body.password = formData.password;
      }

      const res = await fetch(`/api/staff/${user?.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setEditing(false);
      setFormData(prev => ({ ...prev, password: "" }));
      await refresh();
      fetchProfile();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      started_at: "",
      birthdate: "",
      password: "",
    });
    setSaveError("");
  };

  if (authLoading || loading) {
    return (
      <section className="min-h-screen">
        <OwnerHeader title="MY PROFILE" />
        <p className="text-center py-10 text-dark-brown">Loading profile...</p>
      </section>
    );
  }

  if (!user || !profile) {
    return (
      <section className="min-h-screen">
        <OwnerHeader title="MY PROFILE" />
        <div className="px-4 py-10 text-center">
          <p className="text-red-600">Unable to load profile. Please log in again.</p>
        </div>
      </section>
    );
  }

  const displayName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username;

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="MY PROFILE" />

      <div className="px-4 max-w-2xl mx-auto space-y-6 pb-10">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-amber-800">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-brown">{displayName}</h2>
              <p className="text-sm text-gray-500">@{profile.username}</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                profile.role === "owner"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {profile.role}
              </span>
            </div>
          </div>


        </div>

        {/* Editable Details Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-dark-brown">Personal Details</h3>
            <button
              onClick={() => setEditing(!editing)}
              className={editing
                ? "text-amber-700 text-sm font-medium"
                : "bg-amber-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700"
              }
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
              {saveError}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.started_at}
                    onChange={(e) => handleInputChange("started_at", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleInputChange("birthdate", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Min 8 chars, upper, lower, number, special"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Min 8 chars, uppercase, lowercase, number, special character</p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">First Name</span>
                <span className="font-medium text-dark-brown">{profile.first_name || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Last Name</span>
                <span className="font-medium text-dark-brown">{profile.last_name || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Start Date</span>
                <span className="font-medium text-dark-brown">
                  {profile.started_at ? new Date(profile.started_at).toLocaleDateString() : "—"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Birthdate</span>
                <span className="font-medium text-dark-brown">
                  {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}