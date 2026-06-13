"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SchoolForm from "@/components/SchoolForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserGroupIcon, 
  Search01Icon, 
  Add01Icon, 
  IdentityCardIcon, 
  UserIcon, 
  ArrowRight01Icon 
} from "@hugeicons/core-free-icons";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  idNo: string;
  camSno: string;
  classId: string;
}

interface Class {
  id: string;
  name: string;
  students: Student[];
}

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  idCardLayout: number;
  idCardTheme?: string | null;
  classes: Class[];
  students: Student[];
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");
  const [avgPrice, setAvgPrice] = useState<number>(0);

  // Load avgPrice from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("avgIdCardPrice");
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val)) {
        setAvgPrice(val);
      }
    }
  }, []);

  const handlePriceChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAvgPrice(num);
      localStorage.setItem("avgIdCardPrice", String(num));
    } else if (val === "") {
      setAvgPrice(0);
      localStorage.setItem("avgIdCardPrice", "0");
    }
  };

  const handleSchoolCreated = () => {
    fetchDashboardData();
    setShowSchoolForm(false);
  };

  const fetchDashboardData = async () => {
    try {
      setDataLoading(true);
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Auth and Admin restriction hook
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    
    // REDIRECT non-admins to their school dashboard immediately
    if (user.role !== "admin") {
      if (user.schoolId) {
        router.push(`/school/${user.schoolId}`);
      } else {
        router.push("/login");
      }
      return;
    }

    // ONLY fetch if the user is verified to be an admin
    fetchDashboardData();
  }, [user, authLoading, router]);

  // ─── Client-side Computations ──────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalSchools = schools.length;
    const totalStudents = schools.reduce((acc, s) => acc + (s.students?.length || 0), 0);
    return {
      totalSchools,
      totalStudents,
    };
  }, [schools]);

  // Filtered schools for admin view
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) return schools;
    const q = schoolSearchQuery.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [schools, schoolSearchQuery]);

  // Sort schools by student volume for leaderboard
  const leaderboardSchools = useMemo(() => {
    return [...schools].sort((a, b) => (b.students?.length || 0) - (a.students?.length || 0));
  }, [schools]);

  const maxLeaderboardStudents = useMemo(() => {
    if (leaderboardSchools.length === 0) return 1;
    return leaderboardSchools[0].students?.length || 1;
  }, [leaderboardSchools]);

  // loading check helper
  const isLoading = authLoading || dataLoading;
  const isAdmin = user?.role === "admin";

  // If loading or not an admin, show a loading placeholder or return early (avoids flashing dashboard contents)
  if (authLoading || (!isAdmin && user)) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-550 text-sm">Redirecting to your school portal…</p>
        </div>
      </div>
    );
  }

  // Skeleton Loader for statistics and cards
  const SkeletonDashboard = () => (
    <div className="space-y-8 animate-pulse">
      {/* Cards Row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-slate-150 p-6 h-28 flex flex-col justify-between" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Section skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-32 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Section skeleton */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 h-64" />
          <div className="bg-white rounded-2xl border border-slate-150 p-6 h-48" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <Sidebar 
        onCreateSchool={() => setShowSchoolForm(true)} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Container */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="max-w-6xl mx-auto space-y-6 mt-2">
          
          {/* Welcome Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                System Overview Dashboard
              </h1>
              <p className="text-slate-550 text-xs sm:text-sm mt-1">
                Metrics, school analytics list, and configuration tools.
              </p>
            </div>
            
            <button
              onClick={() => setShowSchoolForm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-0 shrink-0"
            >
              <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" strokeWidth={2.5} className="shrink-0" />
              <span>Create New School</span>
            </button>
          </div>

          {isLoading ? (
            <SkeletonDashboard />
          ) : (
            <div className="space-y-6">
              
              {/* ─── KPI Metrics Cards Row ─── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* KPI Card: Total Schools */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-150 p-6 flex items-center justify-between shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 group">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Schools</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalSchools}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Educational institutions</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center transition-all group-hover:scale-105 shadow-xs shrink-0">
                    <HugeiconsIcon icon={UserGroupIcon} size={22} className="text-indigo-650 shrink-0" strokeWidth={2} />
                  </div>
                </div>

                {/* KPI Card: Total Students */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-150 p-6 flex items-center justify-between shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 group">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalStudents}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">ID cards registered</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center transition-all group-hover:scale-105 shadow-xs shrink-0">
                    <HugeiconsIcon icon={UserIcon} size={22} className="text-blue-650 shrink-0" strokeWidth={2} />
                  </div>
                </div>

                {/* KPI Card: Projected Revenue */}
                <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-150 p-6 flex items-center justify-between shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 group">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Revenue</p>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                      ₹{(stats.totalStudents * avgPrice).toLocaleString("en-IN")}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Based on ₹{avgPrice}/card</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center transition-all group-hover:scale-105 shadow-xs shrink-0">
                    <HugeiconsIcon icon={IdentityCardIcon} size={22} className="text-emerald-650 shrink-0" strokeWidth={2} />
                  </div>
                </div>
              </div>

              {/* ─── Main Details Section ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ─── Column 1 & 2: Primary Analytics Table/Grid ─── */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Schools Analytics & Management Directory */}
                  <div className="bg-white rounded-2xl border border-slate-150 shadow-xs p-6 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Schools Analytics & Management</h2>
                        <p className="text-slate-550 text-xs mt-0.5">Quick search and metrics overview for educational institutes.</p>
                      </div>
                      
                      {/* Search School input */}
                      <div className="relative flex items-center min-w-0 w-full sm:w-64">
                        <span className="absolute left-3 text-slate-400 flex items-center">
                          <HugeiconsIcon icon={Search01Icon} size={15} color="currentColor" strokeWidth={2} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search name, phone, address..."
                          value={schoolSearchQuery}
                          onChange={(e) => setSchoolSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-9"
                        />
                      </div>
                    </div>

                    {filteredSchools.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-slate-150 border-dashed">
                        <p className="text-slate-400 text-sm">No schools matching your search query.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredSchools.map((school) => {
                          const clsCount = school.classes?.length || 0;
                          const stdCount = school.students?.length || 0;

                          return (
                            <div 
                              key={school.id} 
                              className="bg-slate-50/50 border border-slate-150 hover:border-indigo-150 hover:bg-indigo-50/5 rounded-2xl p-4.5 flex flex-col justify-between transition-all group hover:shadow-sm"
                            >
                              <div>
                                {/* School header info */}
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-650 transition-colors" title={school.name}>
                                      {school.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 truncate" title={school.caption}>{school.caption || "Educational Institute"}</p>
                                  </div>
                                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-white flex items-center justify-center shadow-xs">
                                    {school.logoUrl ? (
                                      <img src={school.logoUrl} alt={school.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[10px] font-extrabold text-slate-450">{school.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Stats pills */}
                                <div className="flex flex-wrap items-center gap-2 mb-3.5">
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold">
                                    📚 {clsCount} class{clsCount !== 1 ? "es" : ""}
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] font-bold">
                                    🪪 {stdCount} student{stdCount !== 1 ? "s" : ""}
                                  </span>
                                </div>

                                {/* Details */}
                                <div className="text-[11px] text-slate-500 space-y-1 pb-4">
                                  <p className="truncate flex items-center gap-1.5">
                                    <span>📞</span> <span className="font-medium text-slate-600">{school.phone}</span>
                                  </p>
                                  <p className="truncate flex items-center gap-1.5">
                                    <span>📍</span> <span className="truncate" title={school.address}>{school.address}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Navigate to school detail page */}
                              <Link
                                href={`/school/${school.id}`}
                                className="w-full h-9 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-indigo-600 text-slate-650 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                              >
                                <span>Manage Directory</span>
                                <HugeiconsIcon icon={ArrowRight01Icon} size={13} className="transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* ─── Column 3: Secondary Widgets (Revenue settings, Leaderboard, Shortcuts) ─── */}
                <div className="space-y-6">
                  
                  {/* Revenue Calculator Settings Panel */}
                  <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">Revenue Calculator Settings</h3>
                      <p className="text-slate-550 text-[10px] mt-0.5">Enter average card printing cost to simulate gross revenue.</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="avgPriceInput" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Avg ID Card Price (₹)
                      </label>
                      <input
                        id="avgPriceInput"
                        type="number"
                        min="0"
                        placeholder="e.g. 150"
                        value={avgPrice || ""}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-full px-4.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* School Student-Volume Leaderboard (Other relevant dashboard data) */}
                  <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">School Enrollment Volumes</h3>
                      <p className="text-slate-550 text-[10px] mt-0.5">Top schools ranked by total student ID count.</p>
                    </div>

                    {leaderboardSchools.length === 0 ? (
                      <p className="text-[11px] text-slate-450 italic">No schools registered</p>
                    ) : (
                      <div className="space-y-3.5 pt-1">
                        {leaderboardSchools.slice(0, 5).map((school, idx) => {
                          const count = school.students?.length || 0;
                          const percent = maxLeaderboardStudents ? Math.round((count / maxLeaderboardStudents) * 100) : 0;

                          return (
                            <div key={school.id} className="space-y-1 group">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                                  <Link href={`/school/${school.id}`} className="text-slate-700 hover:text-indigo-600 font-bold hover:underline truncate" title={school.name}>
                                    {school.name}
                                  </Link>
                                </div>
                                <span className="text-slate-550 text-[11px] shrink-0 font-bold">{count} Cards</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                <div 
                                  style={{ width: `${Math.max(4, percent)}%` }}
                                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* System Shortcuts */}
                  <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">System Action Shortcuts</h3>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => setShowSchoolForm(true)}
                        className="w-full h-10 px-4 inline-flex items-center gap-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-705 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <span className="text-base leading-none">🏫</span>
                        <span>Create School Profile</span>
                      </button>
                      
                      <Link
                        href="/admin/credentials"
                        className="w-full h-10 px-4 inline-flex items-center gap-2.5 bg-slate-50 hover:bg-indigo-50/50 text-slate-705 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <span className="text-base leading-none">🔑</span>
                        <span>Manage Credentials</span>
                      </Link>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* Create School Modal Form */}
      {showSchoolForm && (
        <SchoolForm
          onClose={() => setShowSchoolForm(false)}
          onSuccess={handleSchoolCreated}
        />
      )}
    </div>
  );
}
