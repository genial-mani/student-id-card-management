"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import EditStudentModal from "@/components/EditStudentModal";
import StudentCard from "@/components/StudentCard";
import StudentListTable from "@/components/StudentListTable";
import { Student } from "@/types/student";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, IdentityCardIcon, Search01Icon, GridIcon, ListViewIcon, Search02Icon, LockIcon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import IdCard, { CardTheme } from "@/components/IdCard";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Class {
  id: string;
  name: string;
  students: Student[];
}

interface School {
  id: string;
  name: string;
  logoUrl: string;
  caption?: string;
  address?: string;
  signatureUrl?: string;
  phone?: string;
  idCardLayout?: number | null;
  idCardTheme?: string | null;
  classes: Class[];
  customFieldsConfig?: any;
  customValues?: any;
  idCardLayoutConfig?: any;
}

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function AllStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canEditOrDelete = isAdmin || (user?.role === "user" && user?.schoolId === schoolId);

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [groupByClass, setGroupByClass] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | null>(null);

  const fetchSchool = useCallback(async () => {
    try {
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

  const handleDeleteClick = async (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the student record for "${studentName}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSchool();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

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
        classId: cls.id,
      }))
    );
  }, [school]);

  // Filter and sort students based on search, class, and sorting selections
  const filteredStudents = useMemo(() => {
    let result = [...allStudents];

    // 1. Class Filter
    if (selectedClassId) {
      result = result.filter((s) => s.classId === selectedClassId);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(query)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(query)) ||
          (s.fatherPhone && s.fatherPhone.toLowerCase().includes(query)) ||
          (s.address && s.address.toLowerCase().includes(query)) ||
          (s.className && s.className.toLowerCase().includes(query))
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "class-asc") {
        return (a.className || "").localeCompare(b.className || "");
      } else if (sortBy === "class-desc") {
        return (b.className || "").localeCompare(a.className || "");
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
  }, [allStudents, searchQuery, selectedClassId, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClassId, sortBy, groupByClass]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));

  const paginatedStudents = useMemo(() => {
    const activePage = Math.min(currentPage, totalPages);
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage, totalPages]);

  // Group filtered students by class if option is enabled
  const groupedStudents = useMemo(() => {
    if (!groupByClass) return null;

    const groups: { [key: string]: { name: string; students: Student[] } } = {};

    paginatedStudents.forEach((student) => {
      const clsName = student.className || "Unassigned";
      const clsId = student.classId || "unassigned";
      if (!groups[clsId]) {
        groups[clsId] = {
          name: clsName,
          students: [],
        };
      }
      groups[clsId].students.push(student);
    });

    // Sort the groups alphabetically by class name
    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [paginatedStudents, groupByClass]);

  const handleExportToExcel = () => {
    if (!allStudents || allStudents.length === 0) {
      alert("No student data available to export.");
      return;
    }

    const config = school?.customFieldsConfig;
    let studentFields = [];
    if (config) {
      try {
        studentFields = typeof config === "string" ? JSON.parse(config).student : config.student;
      } catch {
        studentFields = [];
      }
    }
    if (!studentFields || studentFields.length === 0) {
      studentFields = [
        { key: "name", label: "Student Name", type: "text", required: true, default: true, enabled: true },
        { key: "idNo", label: "ID Number", type: "text", required: false, default: true, enabled: true },
        { key: "camSno", label: "CAM Serial No", type: "text", required: false, default: true, enabled: true },
        { key: "fatherName", label: "Father Name", type: "text", required: false, default: true, enabled: true },
        { key: "fatherPhone", label: "Father Phone", type: "text", required: false, default: true, enabled: true },
        { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true }
      ];
    }

    const activeStudentFields = studentFields.filter((f: any) => 
      f.key !== "profilePictureUrl" && 
      f.key !== "motherName" && 
      f.key !== "motherPhone" && 
      f.enabled
    );

    // Build headers dynamically
    const headers = activeStudentFields.map((f: any) => f.label);
    
    // Find ideal position for Class column (e.g. after Student Name, which is index 1 or so)
    const nameIdx = activeStudentFields.findIndex((f: any) => f.key === "name");
    const classInsertIdx = nameIdx !== -1 ? nameIdx + 1 : 1;
    headers.splice(classInsertIdx, 0, "Class");

    const rows = allStudents.map((student) => {
      let customVals = student.customValues;
      if (typeof customVals === "string") {
        try {
          customVals = JSON.parse(customVals);
        } catch {
          customVals = {};
        }
      } else {
        customVals = customVals || {};
      }

      const rowData = activeStudentFields.map((f: any) => {
        let val = "";
        if (f.default) {
          val = (student as any)[f.key] || "";
        } else {
          val = customVals[f.key] || "";
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      });

      const className = student.className || "";
      rowData.splice(classInsertIdx, 0, `"${className.replace(/"/g, '""')}"`);

      return rowData;
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    // Prepend UTF-8 BOM for Excel compatibility
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const schoolNameSafe = (school?.name || "School").replace(/[^a-z0-9]/gi, "_");
    const filename = `${schoolNameSafe}_${randomCode}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        <div className="text-center max-w-sm flex flex-col items-center justify-center">
          <div className="text-gray-400 mb-4 flex items-center justify-center">
            <HugeiconsIcon icon={LockIcon} size={64} color="currentColor" strokeWidth={1.5} />
          </div>
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
        onCreateSchool={() => { }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 min-w-0">
        <div className="max-w-6xl mx-auto">

          {/* ── Page Header & Search ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 flex flex-col gap-5">
            {/* Top row: Title, breadcrumb, info on left; Export button on right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="min-w-0">
                <button
                  onClick={() => router.push(`/school/${schoolId}`)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-550 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Back to School</span>
                </button>
                <p className="text-xs text-gray-400 mb-1 truncate">
                  <Link href={`/school/${schoolId}`} className="hover:underline">
                    {school.name}
                  </Link>
                  {" / "}All Students
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                  <span className="text-indigo-600 flex items-center">
                    <HugeiconsIcon icon={UserGroupIcon} size={28} color="currentColor" strokeWidth={2} />
                  </span>
                  Student Directory
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg sm:ml-2">
                    Showing {filteredStudents.length} of {allStudents.length} total
                  </span>
                </h1>
              </div>

              {isAdmin && (
                <div className="shrink-0">
                  <button
                    onClick={handleExportToExcel}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 w-full sm:w-auto justify-center"
                    title="Export all student data to Excel (CSV)"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Excel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom row: Search & Filter Controls (fully responsive flex layout) */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search input (full width on mobile/tablet, flex-1 on desktop) */}
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

              {/* Filters (wraps on small/medium screens, flex-row on large) */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 w-full lg:w-auto">
                {/* Class Filter Dropdown */}
                <div className="w-full sm:w-36 shrink-0">
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">All Classes</option>
                    {school?.classes?.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Class {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Dropdown */}
                {viewMode === "card" && (
                  <div className="w-full sm:w-36 shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-10 px-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="name-asc">Sort: Name (A-Z)</option>
                      <option value="name-desc">Sort: Name (Z-A)</option>
                      <option value="class-asc">Sort: Class (Asc)</option>
                      <option value="class-desc">Sort: Class (Desc)</option>
                    </select>
                  </div>
                )}

                {/* Group By Class Toggle */}
                {viewMode === "card" && (
                  <div className="flex items-center gap-2 px-3 shrink-0 h-10 bg-gray-50 border border-gray-200 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                    <input
                      type="checkbox"
                      id="groupByClass"
                      checked={groupByClass}
                      onChange={(e) => setGroupByClass(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <label
                      htmlFor="groupByClass"
                      className="text-xs font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                    >
                      Group by Class
                    </label>
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

          {/* ── Student Grid ──────────────────────────────────────────────── */}
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
                  customFieldsConfig={school?.customFieldsConfig}
                />
              </div>
            ) : (
              groupByClass && groupedStudents ? (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {groupedStudents.map(([classId, group]) => (
                    <div key={classId} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">
                          Class {group.name}
                        </h2>
                        <span className="text-[10px] sm:text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {group.students.length} student{group.students.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.students.map((student) => (
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
                    </div>
                  ))}
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
            )
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-4">
                <HugeiconsIcon icon={Search02Icon} size={48} color="currentColor" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery || selectedClassId
                  ? "No results matching your filters. Try adjusting them."
                  : "There are no students in this school yet."}
              </p>
              {(searchQuery || selectedClassId) && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedClassId("");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
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
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} color="currentColor" strokeWidth={2} />
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const isVisible =
                    totalPages <= 7 ||
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
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Next
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2} />
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
              classes={school?.classes || []}
              schoolName={school.name}
              schoolId={schoolId}
              onClose={() => setEditingStudent(null)}
              onSuccess={fetchSchool}
            />
          )}

          {/* ID Card Preview Modal */}
          {selectedPreviewStudent && (
            (() => {
              const idCardLayout = (school.idCardLayout !== null && school.idCardLayout !== undefined) ? school.idCardLayout : 1;
              let idCardTheme = DEFAULT_THEME;
              if (school.idCardTheme) {
                try {
                  idCardTheme = JSON.parse(school.idCardTheme);
                } catch (e) {
                  console.error("Error parsing school idCardTheme:", e);
                }
              }

              const schoolForCard = {
                name: school.name,
                caption: school.caption || "",
                address: school.address || "",
                logoUrl: school.logoUrl || "",
                signatureUrl: school.signatureUrl || "",
                phone: school.phone || "",
              };

              const studentForCard = {
                name: selectedPreviewStudent.name,
                fatherName: selectedPreviewStudent.fatherName || "",
                fatherPhone: selectedPreviewStudent.fatherPhone || "",
                address: selectedPreviewStudent.address || "",
                profilePictureUrl: selectedPreviewStudent.profilePictureUrl || "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
              };

              return (
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
                          layout={idCardLayout}
                          theme={idCardTheme}
                          school={school}
                          student={selectedPreviewStudent}
                          classNameStr={selectedPreviewStudent.className || ""}
                        />
                      </div>
                    </div>

                    {/* Layout and Theme Details Footer Info */}
                    <div className="mt-6 pt-4 border-t border-gray-100 w-full flex items-center justify-between text-xs text-gray-500">
                      <span>Layout: <strong>{idCardLayout}</strong></span>
                      <div className="flex items-center gap-1">
                        <span>Theme:</span>
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: idCardTheme.primary }}
                          title={`Primary: ${idCardTheme.primary}`}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: idCardTheme.secondary }}
                          title={`Secondary: ${idCardTheme.secondary}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

        </div>
      </div>
    </div>
  );
}