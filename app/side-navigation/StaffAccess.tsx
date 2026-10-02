'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

function StaffAccess() {
  const [role, setRole] = useState<"barista" | "owner" | null>(null);
  const router = useRouter();

  const handleLogin = (targetRole: "barista" | "owner") => {
    setRole(targetRole);
    const loginUrl = targetRole === "barista" 
      ? "/login/barista?showLogin=true" 
      : "/login?showLogin=true";
    router.push(loginUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4">
      {/* Card */}
      <div className="flex flex-col w-full max-w-sm bg-card-cream rounded-2xl p-8 shadow-md">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-dark-brown transition-colors"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <span className="text-3xl font-semibold text-center mb-6">Staff Access</span>

        {/* Role Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => handleLogin("barista")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${
              role === "barista" ? "bg-dark-brown text-white" : "bg-white text-amber-700"
            }`}
          >
            Barista
          </button>
          <button
            onClick={() => handleLogin("owner")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${
              role === "owner" ? "bg-dark-brown text-white" : "bg-white text-amber-800"
            }`}
          >
            Owner
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffAccess;