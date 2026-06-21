"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import balaji from "@/assets/tirupati-balaji-hd-wallpaper-for-android-2745524-removebg-preview.png";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Add01Icon, Logout01Icon, DashboardSquare02Icon  } from "@hugeicons/core-free-icons";

interface School {
  id: string;
  name: string;
  logoUrl: string;
}

interface SidebarProps {
  onCreateSchool: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ onCreateSchool, isOpen, onClose }: SidebarProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    fetchSchools();
  }, [user]);

  useEffect(() => {
    const handleCacheReset = () => {
      fetchSchools();
    };
    window.addEventListener("schools-updated", handleCacheReset);
    return () => {
      window.removeEventListener("schools-updated", handleCacheReset);
    };
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  const Content = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 font-sans">
      {/* ── Top Brand Header ───────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/20">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            onClick={onClose}
            className="flex items-center gap-2.5 group transition-all"
          >
            <div className="relative p-1 bg-white border border-slate-200/80 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-sm shrink-0">
              <Image
                src={balaji}
                alt="Arun ID Cards & Digital"
                className="w-7 h-7 object-contain shrink-0"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold text-slate-800 tracking-tight leading-none">
                ARUN
              </span>
              <span className="text-[9px] font-bold text-violet-600 tracking-widest leading-none mt-1 whitespace-nowrap">
                ID CARDS & DIGITAL
              </span>
            </div>
          </Link>
          {/* Mobile close */}
          <Button
            type="button"
            variant="ghost"
            className="lg:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-xl transition-all cursor-pointer"
            onClick={onClose}
            aria-label="Close menu"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={2} className="shrink-0" />
          </Button>
        </div>

        {/* User Profile Card */}
        {user && (
          <div className="mt-4 flex items-center gap-3 bg-slate-50/60 border border-slate-150 rounded-2xl p-3 shadow-xs">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${
                user?.role === "admin"
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white border border-amber-300/20"
                  : "bg-gradient-to-br from-violet-400 to-blue-600 text-white border border-violet-400/20"
              }`}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 text-xs font-semibold truncate tracking-wide">
                {user?.username}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-full text-[9px] font-bold capitalize leading-none tracking-wider ${
                user?.role === "admin"
                  ? "bg-amber-50 text-amber-800 border border-amber-100"
                  : "bg-violet-50 text-violet-800 border border-violet-100"
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Navigation Items ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {/* Dashboard/Overview Link */}
        {user?.role === "admin" && (
          <Link
          href="/"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border relative ${
            pathname === "/"
              ? "bg-violet-50/50 border-violet-100/50 text-violet-600 font-semibold shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"
          }`}
        >
          {pathname === "/" && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md" />
          )}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            pathname === "/"
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "bg-slate-100 text-slate-500 border border-slate-200/40"
          }`}>
            <HugeiconsIcon icon={DashboardSquare02Icon} size={16} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        )}

        {/* Audit Logs — admin only */}
        {user?.role === "admin" && (
          <Link
            href="/admin/logs"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border relative ${
              pathname === "/admin/logs"
                ? "bg-violet-50/50 border-violet-100/50 text-violet-600 font-semibold shadow-xs"
                : "text-slate-605 hover:text-slate-900 hover:bg-slate-50 border-transparent"
            }`}
          >
            {pathname === "/admin/logs" && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md" />
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              pathname === "/admin/logs"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                : "bg-slate-100 text-slate-500 border border-slate-200/40"
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="text-sm font-medium">Session Logs</span>
          </Link>
        )}

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-2">
            Schools
          </p>
        </div>

        {/* Create school — admin only */}
        {user?.role === "admin" && (
          <button
            type="button"
            className="w-full bg-gradient-to-r from-violet-600 to-violet-600 hover:from-violet-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 active:translate-y-0 cursor-pointer border-0 mb-3 shadow-md"
            onClick={() => {
              onCreateSchool();
              onClose();
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" strokeWidth={2.5} className="shrink-0" />
            <span>Create New School</span>
          </button>
        )}

        {schools.length === 0 ? (
          <p className="text-xs text-slate-450 text-center py-6 px-2 bg-slate-50/50 rounded-2xl border border-slate-250/30 border-dashed">
            {user?.role === "admin"
              ? "No schools yet. Create one above."
              : "No schools assigned."}
          </p>
        ) : (
          <div className="space-y-1">
            {schools.map((school) => {
              const isActive = pathname === `/school/${school.id}` || pathname.startsWith(`/school/${school.id}/`);
              const initials = school.name.charAt(0).toUpperCase();
              
              // Seeded colorful gradient for initials avatar
              const colors = [
                "from-violet-500 to-purple-600 shadow-violet-500/10",
                "from-cyan-500 to-blue-600 shadow-cyan-500/10",
                "from-fuchsia-500 to-teal-600 shadow-fuchsia-500/10",
                "from-pink-500 to-rose-600 shadow-pink-500/10",
                "from-amber-500 to-orange-600 shadow-amber-500/10"
              ];
              const index = school.id ? school.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length : 0;
              const gradient = colors[index];

              return (
                <Link
                  key={school.id}
                  href={`/school/${school.id}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border relative ${
                    isActive
                      ? "bg-violet-50/50 border-violet-100/50 text-violet-655 font-semibold shadow-xs"
                      : "text-slate-605 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md" />
                  )}
                  
                  {school.logoUrl ? (
                    <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border bg-white flex items-center justify-center transition-all ${
                      isActive ? "border-violet-400 ring-2 ring-violet-500/10" : "border-slate-200"
                    }`}>
                      <Image
                        src={school.logoUrl}
                        alt={school.name}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm transition-all ${
                      isActive ? "ring-2 ring-violet-500/20" : ""
                    }`}>
                      <span className="text-xs font-bold text-white leading-none">
                        {initials}
                      </span>
                    </div>
                  )}
                  <span className="text-sm truncate">
                    {school.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom Settings/Sign Out ────────────────────────────────────────── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/20">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-650 hover:bg-rose-50 active:bg-rose-100/60 transition-all duration-200 text-xs font-semibold border-0 cursor-pointer"
          onClick={logout}
        >
          <HugeiconsIcon icon={Logout01Icon} size={15} color="currentColor" strokeWidth={2.5} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          role="presentation"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-full sm:w-80 max-w-sm bg-white z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Content />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white fixed top-0 left-0 h-full z-30 shadow-sm">
        <Content />
      </aside>
    </>
  );
}
