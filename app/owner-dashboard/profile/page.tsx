'use client'
import OwnerHeader from "../ui/OwnerHeader";

export default function BaristaProfile() {
  const baristaInfo = {
    name: "Sherwin Tunay",
    role: "Barista",
    employeeId: "B001",
    startDate: "January 15, 2024",
    birthdate: "March 10, 1998",
    contact: "+63 912 345 6789",
    email: "juan.delacruz@kombicafe.com"
  };

  return (
    <section className="min-h-screen bg-cream">
      <OwnerHeader title="BARISTA PROFILE" />

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg p-6 shadow">
          {/* Profile Picture Placeholder */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-4xl text-gray-400">👤</span>
            </div>
          </div>

          {/* Name and Role */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{baristaInfo.name}</h2>
            <p className="text-sm text-gray-500">{baristaInfo.role}</p>
            <p className="text-xs text-gray-400 mt-1">ID: {baristaInfo.employeeId}</p>
          </div>

          {/* Personal Information */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Start Date</span>
              <span className="text-sm font-medium text-gray-900">{baristaInfo.startDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Birthdate</span>
              <span className="text-sm font-medium text-gray-900">{baristaInfo.birthdate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Contact</span>
              <span className="text-sm font-medium text-gray-900">{baristaInfo.contact}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-600">Email</span>
              <span className="text-sm font-medium text-gray-900 truncate ml-2">{baristaInfo.email}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full bg-dark-brown text-white py-3 rounded-lg font-medium hover:bg-dark-brown/90 transition-colors">
            Edit Profile
          </button>
          <button className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors">
            Logout
          </button>
        </div>
      </div>
    </section>
  );
}
