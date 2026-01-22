"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.push("/register");
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const res = await fetch("/api/verify-otp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  if (!email) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.gif"
          alt="Background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-slate-950/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-3xl border border-slate-800/50 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/50 scale-[1.02] transition-transform">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-center text-3xl font-bold text-white">
            Verify Your Email
          </h1>
          <p className="mb-6 text-center text-slate-400">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-cyan-400">{email}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="otp" className="mb-2 block text-sm font-medium text-slate-300">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-center text-2xl font-bold tracking-widest text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                maxLength={6}
                disabled={loading}
                autoComplete="off"
                inputMode="numeric"
              />
              <p className="mt-2 text-xs text-slate-500 text-center">
                Code expires in 5 minutes
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/50 px-4 py-3 text-center">
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400 mb-2">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          🔒 End-to-end encrypted messaging
        </p>
      </div>
    </div>
  );
}
