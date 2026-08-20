"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-950 text-white flex items-center justify-center px-6 py-12">
      {/* Background glow */}
      <div className="absolute top-[-200px] left-[-150px] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

      {/* Signup container */}
      <div className="relative z-10 w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 shadow-lg shadow-green-500/20 mb-5">
            <span className="text-2xl">♻</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight">
            Smart<span className="text-green-400">Sort</span>
          </h1>

          <p className="text-gray-400 mt-2 text-sm">
            AI-powered waste classification
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Create your account
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Start making smarter disposal decisions.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 pr-20 rounded-xl bg-gray-950 border border-gray-800 text-white placeholder-gray-600 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Minimum 6 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold transition-all shadow-lg shadow-green-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-7 pt-6 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-green-400 hover:text-green-300 font-semibold transition"
              >
                Log in
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          SmartSort AI • Smarter waste, cleaner cities.
        </p>
      </div>
    </main>
  );
}