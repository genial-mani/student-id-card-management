"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import StudentForm from "@/components/StudentForm";
import IdCard, { CardTheme } from "@/components/IdCard";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";

// Custom UI imports
import StudentCard from "@/components/StudentCard";
import StudentListTable from "@/components/StudentListTable";
import EditStudentModal from "@/components/EditStudentModal";
import { Student } from "@/types/student";
import { HugeiconsIcon } from "@hugeicons/react";
import { IdentityCardIcon, Search01Icon, ListViewIcon, Search02Icon, ArrowLeft01Icon, ArrowRight01Icon, UserAdd02Icon, PrinterIcon, ArrowLeft02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

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
    idCardLayout?: number | null;
    idCardTheme?: string | null;
    customFieldsConfig?: any;
    customValues?: any;
    idCardLayoutConfig?: any;
  };
  students: Student[];
}

// Student interface is now imported from @/types/student

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
  schoolNameFont: "",
  schoolNameSize: "",
  schoolNameWeight: "",
  schoolCaptionFont: "",
  schoolCaptionSize: "",
  schoolCaptionWeight: "",
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | null>(null);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);

  // Design — read directly from school database or fall back to localStorage
  const [selectedLayout, setSelectedLayout] = useState(DEFAULT_LAYOUT);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [designReady, setDesignReady] = useState(false);

  useEffect(() => {
    if (classData?.school?.id) {
      fetch(`/api/schools/${classData.school.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.classes) {
            setClassesList(data.classes.map((c: any) => ({ id: c.id, name: c.name })));
          }
        })
        .catch(console.error);
    }
  }, [classData]);

  // Flatten students into the expected structure
  const allStudents = useMemo(() => {
    if (!classData?.students) return [];
    return classData.students.map((student) => ({
      ...student,
      className: classData.name,
      classId: classData.id,
    }));
  }, [classData]);

  const filteredStudents = useMemo(() => {
    let result = [...allStudents];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(query)) ||
          (s.fatherPhone && s.fatherPhone.toLowerCase().includes(query)) ||
          (s.address && s.address.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "idNo-asc") {
        return (a.idNo || "").localeCompare(b.idNo || "");
      } else if (sortBy === "idNo-desc") {
        return (b.idNo || "").localeCompare(a.idNo || "");
      } else if (sortBy === "camSno-asc") {
        return (a.camSno || "").localeCompare(b.camSno || "");
      } else if (sortBy === "camSno-desc") {
        return (b.camSno || "").localeCompare(a.camSno || "");
      } else if (sortBy === "fatherName-asc") {
        return (a.fatherName || "").localeCompare(b.fatherName || "");
      } else if (sortBy === "fatherName-desc") {
        return (b.fatherName || "").localeCompare(a.fatherName || "");
      }
      return 0;
    });

    return result;
  }, [allStudents, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));

  const paginatedStudents = useMemo(() => {
    const activePage = Math.min(currentPage, totalPages);
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage, totalPages]);

  const handleDeleteClick = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the student record for "${studentName}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchClass();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const handleExportToExcel = () => {
    if (!allStudents || allStudents.length === 0) {
      alert("No student data available to export.");
      return;
    }

    const headers = [
      "Name",
      "Cam SNo",
      "Class",
      "Father Name",
      "Father Phone",
      "Address"
    ];

    const rows = allStudents.map((student) => {
      const name = student.name || "";
      const camSno = student.camSno || "";
      const className = student.className || "";
      const fatherName = student.fatherName || "";
      const fatherPhone = student.fatherPhone || "";
      const address = student.address || "";

      // Escape double quotes and wrap in quotes
      const cleanVal = (val: string) => `"${val.replace(/"/g, '""')}"`;

      return [
        cleanVal(name),
        cleanVal(camSno),
        cleanVal(className),
        cleanVal(fatherName),
        cleanVal(fatherPhone),
        cleanVal(address)
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    // Prepend UTF-8 BOM for Excel compatibility
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const schoolNameSafe = (classData?.school.name || "School").replace(/[^a-z0-9]/gi, "_");
    const classNameSafe = (classData?.name || "Class").replace(/[^a-z0-9]/gi, "_");
    const filename = `${schoolNameSafe}_Class_${classNameSafe}_${randomCode}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canEditOrDelete = isAdmin || (user?.role === "user" && user?.schoolId === classData?.school?.id);

  useEffect(() => {
    if (classData) {
      const dbLayout = classData.school.idCardLayout;
      const dbThemeRaw = classData.school.idCardTheme;

      let finalLayout = (dbLayout !== null && dbLayout !== undefined) ? dbLayout : DEFAULT_LAYOUT;
      let finalTheme = DEFAULT_THEME;

      if (dbThemeRaw) {
        try {
          finalTheme = JSON.parse(dbThemeRaw);
        } catch (e) {
          console.error("Failed to parse dbThemeRaw", e);
        }
      } else {
        const { layout, theme: t } = loadDesign(classData.school.id);
        if (layout) finalLayout = layout;
        if (t) finalTheme = t;
      }

      setSelectedLayout(finalLayout);
      setTheme(finalTheme);
      setDesignReady(true);
    }
  }, [classData]);

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



  // ── Shell wrapper ─────────────────────────────────────────────────────────

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <Sidebar
        onCreateSchool={() => { }}
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
        onCreateSchool={() => { }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto mt-3">
          {/* ── Page Header & Search ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 flex flex-col gap-5">
            {/* Top row: Title, breadcrumb, info on left; Actions on right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="min-w-0 text-left">
                {/* Back to School link above breadcrumb */}
                <button
                  onClick={() => router.push(`/school/${classData.school.id}`)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer border-0 bg-transparent p-0"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  <span>Back to School</span>
                </button>
                <p className="text-xs text-gray-400 mb-1 truncate">
                  <Link
                    href={`/school/${classData.school.id}`}
                    className="hover:underline"
                  >
                    {classData.school.name}
                  </Link>
                  {" / "}Class {classData.name}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                  <span className="text-indigo-600 flex items-center">
                    <HugeiconsIcon icon={UserGroupIcon} size={28} color="currentColor" strokeWidth={2} />
                  </span>
                  Class {classData.name}
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg sm:ml-2">
                    Showing {filteredStudents.length} of {allStudents.length} total
                  </span>
                </h1>
              </div>

              {/* Action buttons on the right */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                {/* Export Excel (Admin only) */}
                {isAdmin && (
                  <button
                    onClick={handleExportToExcel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                    title="Export all class student data to Excel (CSV)"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Excel</span>
                  </button>
                )}

                {/* Print / Export — everyone */}
                {user?.role === "admin" && classData.students.length > 0 && (
                  <Link
                    href={`/class/${classId}/print`}
                    className="py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 transition-colors h-10 shadow-sm"
                  >
                    <HugeiconsIcon
                      icon={PrinterIcon}
                      size={18}
                      color="currentColor"
                      strokeWidth={2}
                    />
                    <span className="hidden sm:inline">Print / Export PDF</span>
                    <span className="sm:hidden">Print</span>
                  </Link>
                )}

                {/* Add student */}
                <button
                  onClick={() => setShowStudentForm(true)}
                  className="py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white transition-colors h-10 shadow-sm"
                >
                  <HugeiconsIcon
                    icon={UserAdd02Icon}
                    size={18}
                    color="currentColor"
                    strokeWidth={2}
                  />
                  <span className="hidden sm:inline">Add Student</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Search & Filter Controls (fully responsive flex layout) */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search input */}
              <div className="flex-1 relative flex items-center min-w-0">
                <span className="absolute left-3 text-gray-400 flex items-center">
                  <HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search name, father, cell..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 w-full lg:w-auto">
                {/* Sort Dropdown */}
                {viewMode === "card" && (
                  <div className="w-full sm:w-44 shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="name-asc">Sort: Name (A-Z)</option>
                      <option value="name-desc">Sort: Name (Z-A)</option>
                      <option value="idNo-asc">Sort: ID No (Asc)</option>
                      <option value="idNo-desc">Sort: ID No (Desc)</option>
                      <option value="camSno-asc">Sort: CAM S.No (Asc)</option>
                      <option value="camSno-desc">Sort: CAM S.No (Desc)</option>
                      <option value="fatherName-asc">Sort: Father Name (A-Z)</option>
                      <option value="fatherName-desc">Sort: Father Name (Z-A)</option>
                    </select>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0 h-10 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode("card")}
                    type="button"
                    className={`flex-1 sm:flex-none px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${viewMode === "card"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <HugeiconsIcon icon={IdentityCardIcon} size={14} color="currentColor" strokeWidth={2} />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    type="button"
                    className={`flex-1 sm:flex-none px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${viewMode === "list"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    <HugeiconsIcon icon={ListViewIcon} size={14} color="currentColor" strokeWidth={2} />
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Student List/Grid ────────────────────────────────────────── */}
          {filteredStudents.length > 0 ? (
            viewMode === "list" ? (
              <div className="animate-in fade-in duration-200">
                <StudentListTable
                  students={paginatedStudents}
                  isAdmin={canEditOrDelete}
                  onEdit={(student) => setEditingStudent(student)}
                  onDelete={handleDeleteClick}
                  onPreview={(student) => setSelectedPreviewStudent(student)}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  customFieldsConfig={classData?.school?.customFieldsConfig}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isAdmin={canEditOrDelete}
                    onEdit={(student) => setEditingStudent(student)}
                    onDelete={handleDeleteClick}
                    onPreview={(student) => setSelectedPreviewStudent(student)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center">
              <div className="text-gray-450 mb-4">
                <HugeiconsIcon icon={Search02Icon} size={48} color="currentColor" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? "No results matching your filter. Try adjusting it."
                  : "There are no students in this class yet."}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filter
                </Button>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-150 p-4 shadow-xs animate-in fade-in duration-200">
              <div className="text-xs sm:text-sm text-gray-500 font-medium">
                Showing <span className="font-semibold text-gray-900">{Math.min(filteredStudents.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
                <span className="font-semibold text-gray-900">{Math.min(filteredStudents.length, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
                <span className="font-semibold text-gray-900">{filteredStudents.length}</span> students
              </div>
              <div className="flex items-center gap-1.5 font-sans">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-55 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={2.5} />
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isVisible =
                    totalPages <= 5 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!isVisible) {
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span key={`ellipsis-${page}`} className="px-2 text-gray-400 text-xs sm:text-sm select-none">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${currentPage === page
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-55 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Next
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Edit Student Modal */}
          {editingStudent && (
            <EditStudentModal
              student={{
                id: editingStudent.id,
                name: editingStudent.name,
                fatherName: editingStudent.fatherName || "",
                fatherPhone: editingStudent.fatherPhone || "",
                address: editingStudent.address || "",
                classId: editingStudent.classId || "",
                profilePictureUrl: editingStudent.profilePictureUrl || "",
                camSno: editingStudent.camSno || "",
                customValues: editingStudent.customValues,
              }}
              classes={classesList}
              schoolName={classData.school.name}
              schoolId={classData.school.id}
              onClose={() => setEditingStudent(null)}
              onSuccess={fetchClass}
            />
          )}

          {/* ID Card Preview Modal */}
          {selectedPreviewStudent && (
            <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="relative bg-white border border-gray-150 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                  onClick={() => setSelectedPreviewStudent(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-all cursor-pointer"
                  title="Close preview"
                  aria-label="Close preview modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Modal Title */}
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  ID Card Preview
                </h3>

                {/* ID Card Wrapper scaled to fit */}
                <div className="w-[283px] h-[457px] relative overflow-hidden rounded-xl shadow-lg border border-gray-200 bg-white">
                  <div
                    style={{
                      transform: "scale(0.42)",
                      transformOrigin: "top left",
                      width: "673px",
                      height: "1087px",
                    }}
                  >
                    <IdCard
                      layout={selectedLayout}
                      theme={theme}
                      school={classData.school}
                      student={selectedPreviewStudent}
                      classNameStr={classData.name}
                    />
                  </div>
                </div>

                {/* Layout and Theme Details Footer Info */}
                <div className="mt-6 pt-4 border-t border-gray-100 w-full flex items-center justify-between text-xs text-gray-500">
                  <span>Layout: <strong>{selectedLayout}</strong></span>
                  <div className="flex items-center gap-1">
                    <span>Theme:</span>
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.primary }}
                      title={`Primary: ${theme.primary}`}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: theme.secondary }}
                      title={`Secondary: ${theme.secondary}`}
                    />
                  </div>
                </div>
              </div>
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
