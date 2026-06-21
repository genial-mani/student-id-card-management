"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { HugeiconsIcon } from '@hugeicons/react';
import { ViewIcon, ViewOffSlashIcon, InformationCircleIcon, Loading03Icon  } from '@hugeicons/core-free-icons';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get("loggedOut") === "true") {
      toast.success("Successfully logged out!");
      router.replace("/login");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Login failed";
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      toast.success("Successfully logged in!");

      // Refresh AuthContext immediately
      await refreshUser();

      // Redirect based on role
      if (data.user.role === "admin") {
        router.push(redirect === "/login" ? "/" : redirect);
      } else {
        // Users go to their school page
        if (data.user.schoolId) {
          router.push(`/school/${data.user.schoolId}`);
        } else {
          router.push("/");
        }
      }

      router.refresh();
    } catch {
      const errMsg = "Something went wrong. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 bg-blue-600 rounded-2xl mb-3 sm:mb-4 shadow-lg shadow-blue-600/30">
              <svg
                className="w-7 sm:w-8 h-7 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Student ID System
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="username" className="text-xs sm:text-sm">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs sm:text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pr-10 sm:pr-12 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 bg-transparent border-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HugeiconsIcon
                      icon={ViewIcon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={ViewOffSlashIcon}
                      size={20}
                      color="currentColor"
                      strokeWidth={1.5}
                    />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-red-400 text-xs sm:text-sm">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={20}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <Button
                type="button"
                className="w-full text-xs sm:text-sm"
                disabled
              >
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={24}
                  color="currentColor"
                  strokeWidth={2}
                  className="animate-spin"
                />
                Logging in...
              </Button>
            ) : (
              <Button type="submit" className="w-full text-xs sm:text-sm">
                Log In
              </Button>
            )}
          </form>

          <p className="text-center text-slate-500 text-xs mt-5 sm:mt-6">
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
