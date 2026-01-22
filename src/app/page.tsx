"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

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
        <div className="absolute inset-0 bg-slate-950/90"></div>
      </div>

      <div className="relative z-20 w-full max-w-4xl text-center">
        <div className="mb-8 inline-block rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 shadow-2xl shadow-cyan-500/50">
          <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Vrisa</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Secure end-to-end encrypted messaging. Your conversations, truly private.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <div className="flex items-center gap-2 text-slate-300">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AES-256 Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Zero Knowledge</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Real-time Messaging</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/register")}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white text-lg shadow-2xl shadow-cyan-500/50 hover:from-cyan-600 hover:to-blue-700 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all"
          >
            Get Started Free
          </button>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-4 rounded-xl border-2 border-slate-700 bg-slate-900/50 backdrop-blur-xl font-semibold text-white text-lg hover:bg-slate-800 hover:border-slate-600 hover:scale-105 active:scale-95 transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-500">
          No credit card required • Free forever • Instant setup
        </p>
      </div>
    </div>
  );
}
