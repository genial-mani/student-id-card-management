"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import ClassForm from "@/components/ClassForm";
import CredentialsModal from "@/components/CredentialsModal";
import { useAuth } from "@/contexts/AuthContext";

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  classes: Class[];
}

interface Class {
  id: string;
  name: string;
  students: { id: string }[];
}

export default function SchoolPage() {
  const params   = useParams();
  const router   = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";

  const [school,      setSchool]      = useState<School | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [forbidden,   setForbidden]   = useState(false);
  const [showClass,   setShowClass]   = useState(false);
  const [showCreds,   setShowCreds]   = useState(false);

  const fetchSchool = useCallback(async () => {
    try {
      const res = await fetch(`/api/schools/${schoolId}`);
      if (res.status === 403) { setForbidden(true); return; }
      if (res.ok) setSchool(await res.json());
    } catch { /**/ }
    finally   { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { if (schoolId) fetchSchool(); }, [schoolId, fetchSchool]);

  // ── Shell wrapper ──────────────────────────────────────────────────────────

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCreateSchool={() => {}} />
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );

  if (loading) return (
    <Shell>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading school…</p>
      </div>
    </Shell>
  );

  if (forbidden) return (
    <Shell>
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-5 text-sm">You don&apos;t have permission to view this school.</p>
        <button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-xl text-sm">Go Home</button>
      </div>
    </Shell>
  );

  if (!school) return (
    <Shell>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">School not found</h1>
        <Link href="/" className="text-blue-600 hover:underline text-sm">Go home</Link>
      </div>
    </Shell>
  );

  const totalStudents = school.classes.reduce((s, c) => s + (c.students?.length ?? 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCreateSchool={() => {}} />

      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">

          {/* ── School header card ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

              {/* Logo + info */}
              <div className="flex items-start gap-4">
                {school.logoUrl ? (
                  <Image
                    src={school.logoUrl}
                    alt={school.name}
                    width={64}
                    height={64}
                    className="rounded-xl object-contain shrink-0 border border-gray-100 bg-gray-50"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-gray-400">{school.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {school.name}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">{school.caption}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {school.address}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {school.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 self-start">
                {/* View Credentials — admin only */}
                {isAdmin && (
                  <button
                    onClick={() => setShowCreds(true)}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span className="hidden sm:inline">View Credentials</span>
                    <span className="sm:hidden">Creds</span>
                  </button>
                )}

                {/* Create class */}
                <button
                  onClick={() => setShowClass(true)}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Create Class</span>
                  <span className="sm:hidden">Add Class</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Stats ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{school.classes.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Classes</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
            </div>
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{isAdmin ? "Admin" : "Staff"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Your Role</p>
            </div>
          </div>

          {/* ── Classes grid ──────────────────────────────────────────────── */}
          {school.classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {school.classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                      <span className="text-lg">📚</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Class {cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {cls.students?.length ?? 0} student{(cls.students?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
              <p className="text-gray-500 text-sm mb-5">Create your first class to get started.</p>
              <button
                onClick={() => setShowClass(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors"
              >
                Create First Class
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showClass && (
        <ClassForm
          schoolId={schoolId}
          onClose={() => setShowClass(false)}
          onSuccess={() => { setShowClass(false); fetchSchool(); }}
        />
      )}

      {showCreds && isAdmin && (
        <CredentialsModal
          schoolId={schoolId}
          schoolName={school.name}
          onClose={() => setShowCreds(false)}
        />
      )}
    </div>
  );
}