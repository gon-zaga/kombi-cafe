'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

function StaffAccess() {
  const [role, setRole] = useState<"barista" | "admin" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (role === "barista") {
      router.push("/barista-dashboard");
    } else if (role === "admin") {
      router.push("/owner-dashboard");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4">

      {/* Card */}
      <div className="flex flex-col w-full max-w-sm bg-card-cream rounded-2xl p-8 shadow-md">

        {/* Title */}
        <span className="text-3xl font-semibold text-center mb-6">Staff Access</span>

        {/* Role Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setRole("barista")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${
              role === "barista" ? "bg-dark-brown text-white" : "bg-white text-amber-700"
            }`}
          >
            Barista
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${
              role === "admin" ? "bg-dark-brown text-white" : "bg-white text-amber-700"
            }`}
          >
            Admin
          </button>
        </div>

        {/* Login Form */}
        {role !== null && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-dark-brown bg-white outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-dark-brown bg-white outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={handleLogin}
              className="w-full py-2 mt-2 bg-dark-brown text-white font-semibold rounded-lg transition-colors"
            >
              Login as {role === "barista" ? "Barista" : "Admin"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default StaffAccess;