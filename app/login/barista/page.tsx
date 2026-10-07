'use client'

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth/AuthContext";

export default function BaristaLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter(prev => {
          if (prev <= 1) {
            setLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  useEffect(() => {
    // Skip auto-redirect if showLogin parameter is present
    if (searchParams.get("showLogin") === "true") {
      return;
    }
    if (!authLoading && user) {
      const defaultRedirect = user.role === "owner" ? "/owner-dashboard" : "/barista-dashboard";
      router.push(searchParams.get("redirect") || defaultRedirect);
    }
  }, [user, authLoading, router, searchParams]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(username, password);
      // Redirect to appropriate dashboard based on role
      const defaultRedirect = loggedInUser.role === "owner" ? "/owner-dashboard" : "/barista-dashboard";
      router.push(searchParams.get("redirect") || defaultRedirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      
      // Check if it's a lockout error (429 status)
      if (message.includes("locked") || message.includes("Try again in")) {
        setLocked(true);
        // Extract retryAfter from error if possible
        const match = message.match(/(\d+)\s*(minute|second|hour)/i);
        if (match) {
          const num = parseInt(match[1]);
          const unit = match[2].toLowerCase();
          let seconds = num * 60;
          if (unit.startsWith('hour')) seconds = num * 3600;
          else if (unit.startsWith('second')) seconds = num;
          setRetryAfter(seconds);
        } else {
          setRetryAfter(60); // default 1 minute
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-dark-brown transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark-brown">Kombi Cafe</h1>
          <p className="text-gray-600 mt-2">Barista Login</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {locked && retryAfter > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            <div className="font-medium">Account temporarily locked</div>
            <div className="text-2xl font-mono mt-1" aria-live="polite">{formatTime(retryAfter)}</div>
            <div className="text-xs mt-1">Please wait before trying again</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter username"
              disabled={loading || locked}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter password"
              disabled={loading || locked}
            />
            <label className="mt-2 flex w-full items-center justify-end gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                disabled={locked}
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || locked}
            className="w-full bg-amber-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locked ? `Try again in ${retryAfter > 0 ? `${Math.floor(retryAfter / 60)}:${(retryAfter % 60).toString().padStart(2, '0')}` : ''}` : loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account? Contact the owner for staff access.
        </p>
      </div>
    </div>
  );
}