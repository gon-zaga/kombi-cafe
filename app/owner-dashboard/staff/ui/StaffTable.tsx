'use client'

import { useState } from "react";
import EditStaffModal from "./EditStaffModal";

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

interface StaffTableProps {
  staff: Staff[];
  onUpdated: () => void;
}

export default function StaffTable({ staff, onUpdated }: StaffTableProps) {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this staff member?")) return;
    setDeleteError("");
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      onUpdated();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-gray-500">No staff members yet. Click  "Add Staff" to create one.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F4EBD0] text-left text-sm font-semibold text-dark-brown">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((member) => (
              <tr key={member.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-dark-brown">
                    {member.first_name || ""} {member.last_name || ""}
                  </div>
                  <div className="text-sm text-gray-500">ID: {member.user_id}</div>
                </td>
                <td className="px-4 py-3 text-dark-brown">{member.username}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      member.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">
                  {member.started_at
                    ? new Date(member.started_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingStaff(member)}
                      className="text-amber-700 hover:text-amber-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(member.user_id)}
                      disabled={deletingId === member.user_id}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === member.user_id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg">
          {deleteError}
        </div>
      )}

      <EditStaffModal
        staff={editingStaff}
        isOpen={editingStaff !== null}
        onClose={() => setEditingStaff(null)}
        onUpdated={onUpdated}
      />
    </div>
  );
}