"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSymbol,
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSymbol,
    };
  };

  const passwordStrength = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!passwordStrength.isValid) {
      setError("Please meet all password requirements");
      setLoading(false);
      return;
    }

    if (!dateOfBirth) {
      setError("Date of birth is required");
      setLoading(false);
      return;
    }

    if (!gender) {
      setError("Please select your gender");
      setLoading(false);
      return;
    }

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13 || (age === 13 && today < new Date(birthDate.setFullYear(today.getFullYear())))) {
      setError("You must be at least 13 years old to register");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, dateOfBirth, gender }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to OTP verification page
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/background.gif"
          alt=""
          style={{ width: '100vw', height: '100vh', objectFit: 'cover', objectPosition: 'center' }}
          className="block"
        />
        <div className="absolute inset-0 bg-slate-950/85"></div>
      </div>

      <div className="relative z-20 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-block rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-2xl shadow-cyan-500/50">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join Vrisa for secure encrypted messaging</p>
        </div>

        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-slate-300">
                Username
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dateOfBirth" className="mb-1 block text-xs font-medium text-slate-300">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="h-9 w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="gender" className="mb-1 block text-xs font-medium text-slate-300">
                  Gender <span className="text-red-400">*</span>
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="h-9 w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                >
                  <option value="" className="bg-slate-800">Select gender</option>
                  <option value="Male" className="bg-slate-800">Male</option>
                  <option value="Female" className="bg-slate-800">Female</option>
                  <option value="Other" className="bg-slate-800">Other</option>
                  <option value="Prefer not to say" className="bg-slate-800">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 pr-9 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  placeholder="Strong password required"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicators */}
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-1 w-1 rounded-full ${passwordStrength.minLength ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={passwordStrength.minLength ? 'text-green-400' : 'text-slate-500'}>
                    8+ chars
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-1 w-1 rounded-full ${passwordStrength.hasUpper ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={passwordStrength.hasUpper ? 'text-green-400' : 'text-slate-500'}>
                    Uppercase
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-1 w-1 rounded-full ${passwordStrength.hasLower ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={passwordStrength.hasLower ? 'text-green-400' : 'text-slate-500'}>
                    Lowercase
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-1 w-1 rounded-full ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={passwordStrength.hasNumber ? 'text-green-400' : 'text-slate-500'}>
                    Number
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] col-span-2">
                  <div className={`h-1 w-1 rounded-full ${passwordStrength.hasSymbol ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={passwordStrength.hasSymbol ? 'text-green-400' : 'text-slate-500'}>
                    Symbol
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordStrength.isValid}
              className="h-9 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-cyan-500/50 hover:from-cyan-600 hover:to-blue-700 hover:shadow-cyan-500/70 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          🔒 Your encryption keys are generated automatically after registration
        </p>
      </div>
    </div>
  );
}
