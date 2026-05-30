"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import balaji from "@/assets/tirupati-balaji-hd-wallpaper-for-android-2745524-removebg-preview.png";

interface School {
  id: string;
  name: string;
  logoUrl: string;
}

interface SidebarProps {
  onCreateSchool: () => void;
  isOpen: boolean;       // NEW
  onClose: () => void;   // NEW
}

export default function Sidebar({ onCreateSchool, isOpen, onClose }: SidebarProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        setSchools(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };


  const Content = () => (
    <div className="flex flex-col h-full">
      {/* ── Top ───────────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-700/60">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold tracking-tight leading-tight flex items-center gap-1.5">
            <Image
              src={balaji}
              alt="Arun ID Cards & Digital"
              className="w-7 shrink-0"
            />
            <span className="text-white">ARUN</span>
            <span className="text-indigo-400">ID CARDS & DIGITAL</span>
          </h2>
          {/* Mobile close */}
          <Button
            type="button"
            variant="ghost"
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onClose} // CHANGED: 'close' to 'onClose'
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        {/* User badge */}
        {user && (
          <div className="mt-3 flex items-center gap-2.5 bg-gray-700/40 rounded-xl px-3 py-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                user.role === "admin"
                  ? "bg-amber-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user.username}
              </p>
              <p className="text-gray-400 text-xs capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Create school — admin only */}
        {user?.role === "admin" && (
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-3 rounded-xl text-sm flex items-center gap-2.5 transition-colors mb-3"
            onClick={() => {
              onCreateSchool();
              onClose();
            }}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create School
          </Button>
        )}

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 pt-1 pb-2">
          Schools
        </p>

        {schools.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4 px-2">
            {user?.role === "admin"
              ? "No schools yet. Create one above."
              : "No schools assigned."}
          </p>
        )}

        {schools.map((school) => (
          <Link
            key={school.id}
            href={`/school/${school.id}`}
            onClick={close}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-700/60 active:bg-gray-600/80 transition-colors group"
          >
            {school.logoUrl ? (
              <Image
                src={school.logoUrl}
                alt={school.name}
                width={30}
                height={30}
                className="rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-600 group-hover:bg-gray-500 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                <span className="text-xs font-bold text-white">
                  {school.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-200 truncate">
              {school.name}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Bottom ────────────────────────────────────────── */}
      <div className="p-3 border-t border-gray-700/60">
        <Button
          type="button"
          variant="ghost"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors text-sm font-medium"
          onClick={logout}
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      

      {/* Mobile backdrop */}
      {isOpen && ( // CHANGED: 'mobileOpen' to 'isOpen'
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={onClose} // CHANGED: 'close' to 'onClose'
          role="presentation"
        />
      )}

      {/* Mobile drawer - responsive width */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-full sm:w-80 max-w-sm bg-gray-800 z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full" // CHANGED: 'mobileOpen' to 'isOpen'
        }`}
      >
        <Content />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-800 fixed top-0 left-0 h-full z-30">
        <Content />
      </aside>
    </>
  );
}
