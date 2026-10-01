'use client'

import { useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import StaffTable from "./ui/StaffTable";
import AddStaffModal from "./ui/AddStaffModal";

interface Staff {
  user_id: number;
  username: string;
  role: "barista" | "admin";
  first_name: string | null;
  last_name: string | null;
  started_at: string | null;
  birthdate: string | null;
  created_at: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (res.ok) {
        setStaff(data);
      } else {
        setError(data.error || "Failed to load staff");
      }
    } catch {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleStaffAdded = () => {
    setIsModalOpen(false);
    fetchStaff();
  };

  const handleStaffUpdated = () => {
    fetchStaff();
  };

  if (loading) {
    return (
      <section className="min-h-screen">
        <OwnerHeader title="STAFF MANAGEMENT" />
        <p className="text-center py-10 text-dark-brown">Loading staff...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen">
      <OwnerHeader title="STAFF MANAGEMENT" />

      <section className="px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-brown">Staff Members</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            Add Staff
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <StaffTable staff={staff} onUpdated={handleStaffUpdated} />
      </section>

      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={handleStaffAdded}
      />
    </section>
  );
}