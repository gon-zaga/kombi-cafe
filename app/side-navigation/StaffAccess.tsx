'use client'
import { useRouter } from "next/navigation";

function StaffAccess() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login?showLogin=true");
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

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full px-5 py-3 bg-amber-800 text-white rounded-full font-medium text-sm transition-colors hover:bg-amber-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default StaffAccess;