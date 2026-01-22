"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to send reset code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <img
            src="/background.gif"
            alt=""
            style={{ width: '100vw', height: '100vh', objectFit: 'cover', objectPosition: 'center' }}
            className="block"
          />
          <div className="absolute inset-0 bg-slate-950/80"></div>
        </div>

        <div className="relative z-20 w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-block rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-4 shadow-2xl">
              <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-slate-400">
              If an account exists with <span className="text-white font-medium">{email}</span>, 
              we've sent a 6-digit reset code to your inbox.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 backdrop-blur-xl">
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-cyan-600 hover:to-blue-700"
            >
              Enter Reset Code
            </button>
            
            <button
              onClick={() => router.push("/login")}
              className="mt-3 w-full rounded-xl border border-slate-700 px-6 py-3 font-medium text-slate-300 transition-all hover:bg-slate-800"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/background.gif"
          alt=""
          style={{ width: '100vw', height: '100vh', objectFit: 'cover', objectPosition: 'center' }}
          className="block"
        />
        <div className="absolute inset-0 bg-slate-950/80"></div>
      </div>

      <div className="relative z-20 w-full max-w-md">
        <button
          onClick={() => router.push("/login")}
          className="absolute -top-12 left-0 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Login</span>
        </button>

        <div className="mb-8 text-center">
          <div className="mb-4 inline-block rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 p-4 shadow-2xl">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-slate-400">Enter your email to receive a reset code</p>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all hover:from-purple-600 hover:to-pink-700 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          🔒 End-to-end encrypted messaging
        </p>
      </div>
    </div>
  );
}
