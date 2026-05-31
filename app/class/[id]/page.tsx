"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import StudentForm from "@/components/StudentForm";
import IdCard, { CardTheme } from "@/components/IdCard";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ClassData {
  id: string;
  name: string;
  school: {
    id: string;
    name: string;
    caption: string;
    address: string;
    phone: string;
    logoUrl: string;
    signatureUrl: string;
  };
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  idNo: string;
  camSno: string;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  address: string;
  profilePictureUrl: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DUMMY_STUDENT: Student = {
  id: "dummy1",
  name: "A. Punarvi",
  idNo: "STU-001",
  camSno: "CAM-990",
  fatherName: "Anil Kumar",
  motherName: "Lakshmi",
  fatherPhone: "9876543210",
  motherPhone: "9876512340",
  address: "Kosgi",
  profilePictureUrl:
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
};

const DEFAULT_THEME: CardTheme = {
  primary: "#e85d04",
  secondary: "#ffecd1",
  background: "#f6fff8",
  textMain: "#ffffff",
  textSub: "#4b5563",
};

const DEFAULT_LAYOUT = 1;

const COLOR_FIELDS: [keyof CardTheme, string][] = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["background", "Background"],
  ["textMain", "Header Text"],
  ["textSub", "Body Text"],
];

// localStorage helpers
function lsLayoutKey(id: string) {
  return `idcard_layout_${id}`;
}
function lsThemeKey(id: string) {
  return `idcard_theme_${id}`;
}

function loadDesign(classId: string): { layout: number; theme: CardTheme } {
  try {
    const layout =
      parseInt(localStorage.getItem(lsLayoutKey(classId)) ?? "", 10) ||
      DEFAULT_LAYOUT;
    const raw = localStorage.getItem(lsThemeKey(classId));
    const theme = raw ? (JSON.parse(raw) as CardTheme) : DEFAULT_THEME;
    return { layout, theme };
  } catch {
    return { layout: DEFAULT_LAYOUT, theme: DEFAULT_THEME };
  }
}

function saveDesign(classId: string, layout: number, theme: CardTheme) {
  try {
    localStorage.setItem(lsLayoutKey(classId), String(layout));
    localStorage.setItem(lsThemeKey(classId), JSON.stringify(theme));
  } catch {
    /* storage full / SSR — ignore */
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [isDesignMode, setIsDesignMode] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Design — only loaded on client (localStorage is not available on server)
  const [selectedLayout, setSelectedLayout] = useState(DEFAULT_LAYOUT);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [designReady, setDesignReady] = useState(false);

  // Hydrate from localStorage once on the client
  useEffect(() => {
    if (!classId) return;
    const { layout, theme: t } = loadDesign(classId);
    setSelectedLayout(layout);
    setTheme(t);
    setDesignReady(true);
  }, [classId]);

  // ── Fetch class data ──────────────────────────────────────────────────────

  const fetchClass = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setClassData(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) fetchClass();
  }, [classId, fetchClass]);

  // ── Design handlers (admin only) ──────────────────────────────────────────

  const handleLayoutChange = (num: number) => {
    setSelectedLayout(num);
    saveDesign(classId, num, theme);
  };

  const handleColorChange = (key: keyof CardTheme, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    saveDesign(classId, selectedLayout, next);
  };

  const handleReset = () => {
    setSelectedLayout(DEFAULT_LAYOUT);
    setTheme(DEFAULT_THEME);
    saveDesign(classId, DEFAULT_LAYOUT, DEFAULT_THEME);
  };

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

  if (loading || !designReady)
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading class…</p>
        </div>
      </Shell>
    );

  if (forbidden)
    return (
      <Shell>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-500 mb-5 text-sm">
            You don&apos;t have permission to view this class.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-xl text-sm"
          >
            Go Back
          </button>
        </div>
      </Shell>
    );

  if (!classData)
    return (
      <Shell>
        <p className="text-gray-500">Class not found.</p>
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
        <div className="max-w-7xl mx-auto">
          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 lg:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              {/* Title + breadcrumb */}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-1 truncate">
                  <Link
                    href={`/school/${classData.school.id}`}
                    className="hover:underline"
                  >
                    {classData.school.name}
                  </Link>
                  {" / "}Class {classData.name}
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Class {classData.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {classData.students.length} student
                  {classData.students.length !== 1 ? "s" : ""} enrolled
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {/* Design Studio — admin only */}
                {user?.role === "admin" && (
                  <button
                    onClick={() => setIsDesignMode(!isDesignMode)}
                    className={`py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg lg:rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-colors ${
                      isDesignMode
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    🎨
                    <span className="hidden sm:inline">
                      {isDesignMode ? "Exit Studio" : "Customize Design"}
                    </span>
                    <span className="sm:hidden">Design</span>
                  </button>
                )}

                {/* Print / Export — everyone */}
                {user?.role === "admin" && classData.students.length > 0 && (
                  <Link
                    href={`/class/${classId}/print`}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg lg:rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Print / Export PDF</span>
                    <span className="sm:hidden">Print</span>
                  </Link>
                )}

                {/* Add student */}
                <button
                  onClick={() => setShowStudentForm(true)}
                  className="py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-lg lg:rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
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
                  <span className="hidden sm:inline">Add Student</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Design Studio (admin only) ───────────────────────────────── */}
          {isAdmin && isDesignMode && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-100 p-4 sm:p-5 lg:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-indigo-900">
                    ID Card Design Studio
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Settings are saved locally on this device. The selected
                    design will be used for printing.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="self-start flex items-center gap-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-1.5 px-2.5 sm:px-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset to Default
                </button>
              </div>

              {/* ── Color pickers ────────────────────────────────────────── */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Colour Theme
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                  {COLOR_FIELDS.map(([key, label]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={theme[key]}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value)
                          }
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl cursor-pointer border-2 border-white shadow-md appearance-none p-0.5"
                          style={{ backgroundColor: theme[key] }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 text-center leading-tight line-clamp-2">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Layout selector ──────────────────────────────────────── */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Layout
                  </p>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Layout {selectedLayout} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <div
                      key={num}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleLayoutChange(num)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleLayoutChange(num);
                        }
                      }}
                      className={`group flex flex-col items-center gap-1.5 sm:gap-3 p-1 sm:p-2 rounded-2xl sm:rounded-3xl transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                        selectedLayout === num
                          ? "scale-[1.01]"
                          : "hover:opacity-95"
                      }`}
                    >
                      {/* Scaled-down card preview */}
                      <div
                        className={`relative overflow-hidden rounded-lg sm:rounded-[1rem] w-32 sm:w-52 md:w-56 h-48 sm:h-80 ${
                          selectedLayout === num ? "ring-2 ring-indigo-300" : ""
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            style={{
                              transform: "scale(0.2)",
                              transformOrigin: "center center",
                              width: "638px",
                              height: "1015px",
                              pointerEvents: "none",
                            }}
                          >
                            <IdCard
                              layout={num}
                              theme={theme}
                              school={classData.school}
                              student={DUMMY_STUDENT}
                              classNameStr={classData.name}
                            />
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold transition-colors line-clamp-1 ${
                          selectedLayout === num
                            ? "text-indigo-600"
                            : "text-gray-500"
                        }`}
                      >
                        Layout {num}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Student ID Cards (view mode) ─────────────────────────────── */}
          {!isDesignMode && classData.students.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 sm:gap-y-4 justify-items-center">
              {classData.students.map((student) => (
                <div
                  key={student.id}
                  className="w-full max-w-sm sm:max-w-none flex justify-center overflow-hidden pb-1 sm:pb-2"
                >
                  <div
                    style={{
                      transform: "scale(0.40)",
                      transformOrigin: "top center",
                      height: "507px",
                    }}
                  >
                    <IdCard
                      layout={selectedLayout}
                      theme={theme}
                      school={classData.school}
                      student={student}
                      classNameStr={classData.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────────── */}
          {!isDesignMode && classData.students.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No students yet
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                Add your first student to start generating ID cards.
              </p>
              <button
                onClick={() => setShowStudentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl text-sm transition-colors"
              >
                Add First Student
              </button>
            </div>
          )}
        </div>
      </div>

      {showStudentForm && (
        <StudentForm
          schoolId={classData.school.id}
          classId={classId}
          schoolName={classData.school.name}
          onClose={() => setShowStudentForm(false)}
          onSuccess={() => fetchClass()}
        />
      )}
    </div>
  );
}
