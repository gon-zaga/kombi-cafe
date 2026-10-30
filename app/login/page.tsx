'use client'

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/lib/auth/AuthContext";

function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
   const { user, loading: authLoading, login, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
    // Skip auto-redirect if showLogin parameter is present (e.g., from side-navigation)
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
      setLocked(false);
      setRetryAfter(0);
      setLoading(true);

      try {
        const result = await login(username, password);
        const loggedInUser = result.user;
        // Redirect to appropriate dashboard based on role
        const defaultRedirect = loggedInUser.role === "owner" ? "/owner-dashboard" : "/barista-dashboard";
        router.push(searchParams.get("redirect") || defaultRedirect);
      } catch (err) {
        let message = "Login failed";
        let attemptCount = 0;
        let retryAfter = 0;
        let isLocked = false;
        
        // Check if the error is an object with attemptCount (from our custom throw)
        if (err && typeof err === 'object' && 'attemptCount' in err) {
          // Type assertion: err is { error: string; attemptCount: number; retryAfter?: number }
          const e = err as { error: string; attemptCount: number; retryAfter?: number };
          message = e.error;
          attemptCount = e.attemptCount;
          // If we have retryAfter (from a 429 response), use it to set the locked state and retryAfter
          if (e.retryAfter !== undefined) {
            isLocked = true;
            retryAfter = e.retryAfter;
          }
        } else if (err instanceof Error) {
          // Fallback to old error format
          try {
            const errorData = JSON.parse(err.message);
            message = errorData.error;
            attemptCount = errorData.attemptCount || 0;
          } catch (e) {
            // If JSON parsing fails, use the original message
            message = err.message;
          }
        }
        
        setError(`${message} (Attempt ${attemptCount})`);
        
        // If we haven't set locked state from the error object (i.e., it's a 401 response), check for lockout in message
        if (!isLocked && (message.includes("locked") || message.includes("Try again in"))) {
          // Extract retryAfter from error if possible
          const match = message.match(/(\d+)\s*(minute|second|hour)/i);
          if (match) {
            const num = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            let seconds = num * 60;
            if (unit.startsWith('hour')) seconds = num * 3600;
            else if (unit.startsWith('second')) seconds = num;
            isLocked = true;
            retryAfter = seconds;
          } else {
            // default to 1 minute if we can't parse
            isLocked = true;
            retryAfter = 60;
          }
        }
        
        setLocked(isLocked);
        setRetryAfter(retryAfter);
      } finally {
        setLoading(false);
      }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotError("");
      setForgotSuccess(false);
      setForgotLoading(true);

      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: forgotUsername }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to request password reset");
        }

        setForgotSuccess(true);
        setForgotUsername("");
      } catch (err) {
        setForgotError(err instanceof Error ? err.message : "Failed to request password reset");
      } finally {
        setForgotLoading(false);
      }
    };

    const handleCloseForgotPassword = () => {
      setShowForgotPassword(false);
      setForgotUsername("");
      setForgotError("");
      setForgotSuccess(false);
    };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
         {/* Back Button */}
         <button
           type="button"
           onClick={() => {
             if (typeof window !== 'undefined') {
               window.history.back();
             }
           }}
           className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-dark-brown transition-colors"
         >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
           </svg>
           Back
         </button>

<div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-dark-brown">Kombi Cafe</h1>
           <p className="text-gray-600 mt-2">Staff Login</p>
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
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="mt-2 w-full text-sm text-amber-700 hover:text-amber-900 font-medium disabled:opacity-50"
              disabled={loading || locked}
            >
              Forgot Password?
            </button>
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

        {showForgotPassword && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseForgotPassword}
          >
            <div
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Forgot Password</h2>
                <button
                  onClick={handleCloseForgotPassword}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
                  {forgotError}
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm mb-4">
                  Password reset requested. The owner will notify you with your new password.
                </div>
              )}

              {!forgotSuccess && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Enter your username to request a password reset. The owner will be notified
                    and will provide you with a new password.
                  </p>
                  <div>
                    <label htmlFor="forgot-username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      id="forgot-username"
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter username"
                      disabled={forgotLoading}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseForgotPassword}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      disabled={forgotLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || !forgotUsername.trim()}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                      {forgotLoading ? "Requesting..." : "Request Reset"}
                    </button>
                  </div>
                </form>
              )}

              {forgotSuccess && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleCloseForgotPassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams can't be read during static prerendering, so the
// page that reads it sits inside a Suspense boundary
export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}