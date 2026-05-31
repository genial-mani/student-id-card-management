"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  name: string;
  idNo: string;
  fatherName: string;
  fatherPhone: string;
  profilePictureUrl?: string;
  className?: string; // We will attach this dynamically
}

interface Class {
  id: string;
  name: string;
  students: Student[];
}

interface School {
  id: string;
  name: string;
  logoUrl: string;
  classes: Class[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AllStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSchool = useCallback(async () => {
    try {
      // Depending on your API, ensure this endpoint populates full student details 
      // inside the classes array, or update this fetch to point to an /api/students endpoint.
      const res = await fetch(`/api/schools/${schoolId}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setSchool(await res.json());
    } catch {
      console.error("Failed to fetch school data");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) fetchSchool();
  }, [schoolId, fetchSchool]);

  // Flatten the classes array to get one massive list of students, attaching their class name
  const allStudents = useMemo(() => {
    if (!school?.classes) return [];
    return school.classes.flatMap((cls) => 
      (cls.students || []).map((student) => ({
        ...student,
        className: cls.name,
      }))
    );
  }, [school]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const query = searchQuery.toLowerCase();
    return allStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.idNo?.toLowerCase().includes(query) ||
        s.fatherName?.toLowerCase().includes(query) ||
        s.className?.toLowerCase().includes(query)
    );
  }, [allStudents, searchQuery]);

  // ── Shell wrapper ─────────────────────────────────────────────────────────

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar 
        onCreateSchool={() => {}} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );

  if (loading)
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading students…</p>
        </div>
      </Shell>
    );

  if (forbidden)
    return (
      <Shell>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-5 text-sm">
            You don't have permission to view this directory.
          </p>
          <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
            Go Home
          </Button>
        </div>
      </Shell>
    );

  if (!school)
    return (
      <Shell>
        <p className="text-gray-500">School data not found.</p>
      </Shell>
    );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar 
        onCreateSchool={() => {}} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* ── Page Header & Search ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1 truncate">
                  <Link href={`/school/${schoolId}`} className="hover:underline">
                    {school.name}
                  </Link>
                  {" / "}All Students
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">👥</span> Student Directory
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filteredStudents.length} of {allStudents.length} enrolled students.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full md:max-w-xs relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name, ID, or class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Student Grid ──────────────────────────────────────────────── */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow flex items-start gap-4">
                  {/* Profile Picture */}
                  {student.profilePictureUrl ? (
                    <img 
                      src={student.profilePictureUrl} 
                      alt={student.name}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-indigo-50 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-100">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Student Details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate" title={student.name}>
                      {student.name}
                    </h3>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                        Class {student.className}
                      </span>
                      {student.idNo && (
                        <span className="text-xs text-gray-500 truncate">
                          ID: {student.idNo}
                        </span>
                      )}
                      {student.fatherName && (
                        <span className="text-xs text-gray-500 truncate">
                          F: {student.fatherName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery 
                  ? `No results matching "${searchQuery}". Try a different term.` 
                  : "There are no students enrolled in this school yet."}
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery("")} variant="outline" className="mt-4">
                  Clear Search
                </Button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}