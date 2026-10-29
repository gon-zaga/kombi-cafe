'use client'

import { useEffect, useState } from "react";
import OwnerHeader from "../ui/OwnerHeader";
import StaffTable from "./ui/StaffTable";
import AddStaffModal from "./ui/AddStaffModal";
import EditStaffModal from "./ui/EditStaffModal";

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

interface PasswordResetRequest {
  id: number;
  user_id: number;
  requested_at: string;
  status: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [resetRequestsLoading, setResetRequestsLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [resettingRequestId, setResettingRequestId] = useState<number | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (res.ok) {
        setStaff(data.filter((staff) => staff.role === "barista"));
      } else {
        setError(data.error || "Failed to load staff");
      }
    } catch {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const res = await fetch("/api/auth/password-reset-requests");
      const data = await res.json();
      if (res.ok) {
        setResetRequests(data);
      }
    } catch {
      // Silently fail for reset requests
    } finally {
      setResetRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchResetRequests();
  }, []);

  const handleStaffAdded = () => {
    setIsModalOpen(false);
    fetchStaff();
  };

  const handleStaffUpdated = () => {
    fetchStaff();
  };

  const handleResetPasswordClick = (request: PasswordResetRequest) => {
    const staffMember = staff.find(s => s.user_id === request.user_id);
    if (staffMember) {
      setResettingRequestId(request.id);
      setEditingStaff(staffMember);
    }
  };

  const handleResetCompleted = async () => {
    if (resettingRequestId) {
      try {
        const res = await fetch(`/api/auth/password-reset-requests/${resettingRequestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
        if (res.ok) {
          setResetRequests(prev => prev.filter(r => r.id !== resettingRequestId));
        }
      } catch {
        // Error handled by modal
      }
    }
    setResettingRequestId(null);
    setEditingStaff(null);
  };

  const handleEditClose = () => {
    setEditingStaff(null);
    setResettingRequestId(null);
  };

  if (loading) {
    return (
      <section className="min-h-screen">
        <OwnerHeader title="WORKER PROFILE" />
        <p className="text-center py-10 text-dark-brown">Loading staff...</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen">
      <OwnerHeader title="WORKER PROFILE" />

      <section className="px-4">
        {/* Password Reset Requests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dark-brown mb-4">Password Reset Requests</h2>
          {resetRequestsLoading ? (
            <p className="text-center py-6 text-gray-500">Loading requests...</p>
          ) : resetRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <p className="text-gray-500">No pending password reset requests.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F4EBD0] text-left text-sm font-semibold text-dark-brown">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Requested At</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resetRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-dark-brown">
                            {request.first_name || ""} {request.last_name || ""}
                          </div>
                          <div className="text-sm text-gray-500">ID: {request.user_id}</div>
                        </td>
                        <td className="px-4 py-3 text-dark-brown">{request.username}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {new Date(request.requested_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleResetPasswordClick(request)}
                            className="text-amber-700 hover:text-amber-900 text-sm font-medium"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Staff Members Section */}
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

      <EditStaffModal
        staff={editingStaff}
        isOpen={editingStaff !== null}
        onClose={handleEditClose}
        onUpdated={handleResetCompleted}
      />
    </section>
  );
}