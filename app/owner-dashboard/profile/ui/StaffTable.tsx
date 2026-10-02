'use client'

import { useState } from "react";
import EditStaffModal from "./EditStaffModal";
import ConfirmModal from "@/app/ui/ConfirmModal";

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

interface StaffTableProps {
  staff: Staff[];
  onUpdated: () => void;
}

export default function StaffTable({ staff, onUpdated }: StaffTableProps) {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // The staff member the confirm modal is open for; null means no modal. The
  // modal replaces the old window.confirm and owns the 3-second lock.
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (id: number) => {
    setDeleteError("");
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      setDeletingStaff(null);
      onUpdated();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-gray-500">No staff members yet. Click Add Staff to create one.</p>
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
                      member.role === "owner"
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
                      onClick={() => setDeletingStaff(member)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
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

      {/* Delete confirmation: in-app modal with a 3-second lock on the buttons,
          so a misclick can't delete a staff account instantly */}
      <ConfirmModal
        isOpen={deletingStaff !== null}
        title="Delete staff member?"
        message={
          deletingStaff
            ? `${
                deletingStaff.first_name || ""
              } ${deletingStaff.last_name || ""} (${
                deletingStaff.username
              }) will lose access immediately. This cannot be undone.`.trim()
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => setDeletingStaff(null)}
        onConfirm={() => deletingStaff && handleDelete(deletingStaff.user_id)}
      />
    </div>
  );
}