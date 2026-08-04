"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import EditStudentModal from "@/components/EditStudentModal";
import StudentCard from "@/components/StudentCard";
import StudentListTable from "@/components/StudentListTable";
import { Student } from "@/types/student";
import StudentForm from "@/components/StudentForm";
import IdCardPreviewModal from "@/components/IdCardPreviewModal";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, IdentityCardIcon, Search01Icon, GridIcon, ListViewIcon, Search02Icon, LockIcon, ArrowLeft01Icon, ArrowRight01Icon, PrinterIcon, Cancel01Icon, UserAdd02Icon } from "@hugeicons/core-free-icons";
import IdCard, { CardTheme } from "@/components/IdCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
import BulkDeleteModal from "@/components/BulkDeleteModal";
import BulkImportModal from "@/components/BulkImportModal";

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
};

// ─── Component ──────────────────────────────────────────────────────────────

const CustomDropdown = ({ value, onChange, options, placeholder, searchable = false }: { value: string, onChange: (val: string) => void, options: { label: string, value: string, count?: number }[], placeholder: string, searchable?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);
  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-violet-500 transition-colors"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch("");
        }}
      >
        <span className={selectedOption ? "text-gray-900 truncate pr-2 flex items-center gap-1.5" : "text-gray-500 truncate pr-2"}>
          {selectedOption ? (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.count !== undefined && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">
                  {selectedOption.count}
                </span>
              )}
            </>
          ) : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-150 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scrollbar">
          {searchable && (
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <input
                type="text"
                autoFocus
                className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
            <div
              key={opt.value}
              className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-violet-50 hover:text-violet-700 transition-colors flex items-center justify-between gap-2 ${value === opt.value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{opt.label}</span>
              {opt.count !== undefined && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                  opt.count > 0 
                    ? value === opt.value ? "bg-violet-200 text-violet-800" : "bg-gray-100 text-gray-600"
                    : "bg-gray-50 text-gray-400"
                }`}>
                  {opt.count}
                </span>
              )}
            </div>
          )) : (
            <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 text-center">No results</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AllStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canEditOrDelete = isAdmin || ((user?.role === "user" || user?.role === "school_admin") && user?.schoolId === schoolId);

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
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [missingFieldFilter, setMissingFieldFilter] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedStudentIds(paginatedStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectOne = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedStudentIds(prev => [...prev, id]);
    } else {
      setSelectedStudentIds(prev => prev.filter(i => i !== id));
    }
  };

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

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName });
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const res = await fetch(`/api/students/${studentToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Student deleted successfully!");
        fetchSchool();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setStudentToDelete(null);
    }
  };

  useEffect(() => {
    if (schoolId) fetchSchool();
  }, [schoolId, fetchSchool]);

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

  const isFieldMissing = useCallback((student: any, fieldKey: string) => {
    if (!fieldKey) return false;
    if (fieldKey === "profilePictureUrl") {
      return !student.profilePictureUrl || student.profilePictureUrl.trim() === "";
    }
    let val = student[fieldKey];
    
    let customVals = student.customValues;
    if (typeof customVals === "string") {
      try { customVals = JSON.parse(customVals); } catch { customVals = {}; }
    }
    
    if ((val === undefined || val === null || String(val).trim() === "") && customVals && typeof customVals === 'object') {
      const cv = (customVals as any)[fieldKey];
      if (cv !== undefined && cv !== null) {
        val = cv;
      }
    }
    
    return val === undefined || val === null || String(val).trim() === "";
  }, []);

  const missingFieldOptions = useMemo(() => {
    const baseStudents = selectedClassId 
      ? allStudents.filter(s => s.classId === selectedClassId)
      : allStudents;

    const options: { label: string; value: string; count?: number }[] = [
      { label: "All Students", value: "", count: baseStudents.length }
    ];

    let studentFields = [
      { key: "name", label: "Student Name", enabled: true },
      { key: "profilePictureUrl", label: "Profile Picture", enabled: true },
      { key: "fatherName", label: "Father Name", enabled: true },
      { key: "fatherPhone", label: "Father Phone", enabled: true },
      { key: "address", label: "Address", enabled: true },
    ];

    if (school?.customFieldsConfig) {
      let parsed = school.customFieldsConfig;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
      }
      if (parsed && parsed.student && Array.isArray(parsed.student)) {
        studentFields = parsed.student;
      }
    }

    studentFields
      .filter((f: any) => f.enabled !== false && f.isActive !== false)
      .forEach((f: any) => {
        const cleanLabel = (f.label || f.key).replace(/\s*\*$/, '');
        const count = baseStudents.filter(s => isFieldMissing(s, f.key)).length;
        options.push({
          label: f.key === "profilePictureUrl" ? "Missing Photo" : `Missing ${cleanLabel}`,
          value: f.key,
          count: count
        });
      });

    return options;
  }, [allStudents, selectedClassId, school, isFieldMissing]);

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

    // 3. Missing Field Filter
    if (missingFieldFilter) {
      result = result.filter((s) => {
        if (missingFieldFilter === "profilePictureUrl") {
          return !s.profilePictureUrl || s.profilePictureUrl.trim() === "";
        }
        let val = (s as any)[missingFieldFilter];
        
        let customVals = s.customValues;
        if (typeof customVals === "string") {
          try { customVals = JSON.parse(customVals); } catch { customVals = {}; }
        }
        
        // If we don't have a valid value on the main object, check customValues
        if ((val === undefined || val === null || String(val).trim() === "") && customVals && typeof customVals === 'object') {
          const cv = (customVals as any)[missingFieldFilter];
          if (cv !== undefined && cv !== null) {
            val = cv;
          }
        }
        
        return val === undefined || val === null || String(val).trim() === "";
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "class-asc") {
        return (a.className || "").localeCompare(b.className || "");
      } else if (sortBy === "class-desc") {
        return (b.className || "").localeCompare(a.className || "");
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
  }, [allStudents, searchQuery, selectedClassId, sortBy, missingFieldFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClassId, sortBy, groupByClass, itemsPerPage, missingFieldFilter]);

  // Edit Student Navigation
  const editIndex = useMemo(() => {
    if (!editingStudent) return -1;
    return filteredStudents.findIndex((s) => s.id === editingStudent.id);
  }, [editingStudent, filteredStudents]);

  const handlePreviousEdit = useCallback(() => {
    if (editIndex > 0) {
      setEditingStudent(filteredStudents[editIndex - 1]);
    }
  }, [editIndex, filteredStudents]);

  const handleNextEdit = useCallback(() => {
    if (editIndex >= 0 && editIndex < filteredStudents.length - 1) {
      setEditingStudent(filteredStudents[editIndex + 1]);
    }
  }, [editIndex, filteredStudents]);

  // Preview Student Navigation
  const previewIndex = useMemo(() => {
    if (!selectedPreviewStudent) return -1;
    return filteredStudents.findIndex((s) => s.id === selectedPreviewStudent.id);
  }, [selectedPreviewStudent, filteredStudents]);

  const handlePreviousPreview = useCallback(() => {
    if (previewIndex > 0) {
      setSelectedPreviewStudent(filteredStudents[previewIndex - 1]);
    }
  }, [previewIndex, filteredStudents]);

  const handleNextPreview = useCallback(() => {
    if (previewIndex >= 0 && previewIndex < filteredStudents.length - 1) {
      setSelectedPreviewStudent(filteredStudents[previewIndex + 1]);
    }
  }, [previewIndex, filteredStudents]);

  const effectiveItemsPerPage = Math.max(1, itemsPerPage || 12);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / effectiveItemsPerPage));

  const paginatedStudents = useMemo(() => {
    const activePage = Math.min(currentPage, totalPages);
    const start = (activePage - 1) * effectiveItemsPerPage;
    return filteredStudents.slice(start, start + effectiveItemsPerPage);
  }, [filteredStudents, currentPage, totalPages, effectiveItemsPerPage]);

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
      toast.error("No student data available to export.");
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
    headers.push("CAM S.No");

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
      rowData.push(`"${(student.camSno || "").replace(/"/g, '""')}"`);

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
    <>
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-100px)]">
        {children}
      </div>
    </>
  );

  if (loading)
    return (
      <Shell>
        <LoadingSpinner message="Loading students..." />
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
    <>
      <div className="max-w-6xl mx-auto">

          {/* ── Page Header & Search ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 flex flex-col gap-5">
            {/* Top row: Title, breadcrumb, info on left; Export button on right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="min-w-0">
                <button
                  onClick={() => router.push(`/school/${schoolId}`)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-550 hover:text-violet-600 transition-colors cursor-pointer"
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
                  <span className="text-violet-600 flex items-center">
                    <HugeiconsIcon icon={UserGroupIcon} size={28} color="currentColor" strokeWidth={2} />
                  </span>
                  Student Directory
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg sm:ml-2">
                    Showing {filteredStudents.length} of {allStudents.length} total
                  </span>
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {canEditOrDelete && (
                  selectedClassId ? (
                    filteredStudents.length > 0 ? (
                      <Link
                        href={`/school/${schoolId}/class/${selectedClassId}/print`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-750 border border-violet-200 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer h-10 shadow-sm"
                        title="Print ID Cards for the selected class"
                      >
                        <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                        <span>Print / Export PDF</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold h-10 opacity-60 cursor-not-allowed border-0"
                        title="No students in the selected class to print"
                      >
                        <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                        <span>Print / Export PDF</span>
                      </button>
                    )
                  ) : (
                    allStudents.length > 0 ? (
                      <Link
                        href={`/school/${schoolId}/class/all/print`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-750 border border-violet-200 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer h-10 shadow-sm"
                        title="Print ID Cards for all students in the school"
                      >
                        <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                        <span>Print All Students</span>
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold h-10 opacity-60 cursor-not-allowed border-0"
                        title="No students in the school to print"
                      >
                        <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                        <span>Print All Students</span>
                      </button>
                    )
                  )
                )}

                {canEditOrDelete && (
                  <div className="shrink-0 flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {selectedStudentIds.length > 0 && (
                      <button
                        onClick={() => setIsBulkDeleteOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                        title="Delete selected students"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                        <span>Delete ({selectedStudentIds.length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsBulkImportOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                      title="Import students from Excel"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Import</span>
                    </button>
                    <button
                      onClick={() => setShowStudentForm(true)}
                      className="flex-1 sm:flex-none inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                    >
                      <HugeiconsIcon icon={UserAdd02Icon} size={16} strokeWidth={2.5} />
                      <span>Add Student</span>
                    </button>
                    <button
                      onClick={handleExportToExcel}
                      className="flex-1 sm:flex-none inline-flex items-center gap-1.5 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                      title="Export all student data to Excel (CSV)"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export Excel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row: Search & Filter Controls */}
            <div className="flex flex-col gap-3 w-full">
              {/* Primary Controls Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                {/* Search input */}
                <div className="w-full sm:flex-1 relative flex items-center shrink-0">
                  <span className="absolute left-3 text-gray-400 flex items-center">
                    <HugeiconsIcon icon={Search01Icon} size={16} color="currentColor" strokeWidth={2} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, father, cell..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all h-10"
                  />
                </div>
                
                {/* Class Filter Dropdown */}
                <div className="w-full sm:w-40 shrink-0">
                  <CustomDropdown
                    value={selectedClassId}
                    onChange={setSelectedClassId}
                    placeholder="All Classes"
                    searchable={true}
                    options={[
                      { label: "All Classes", value: "" },
                      ...(school?.classes?.map((cls) => ({
                        label: `Class ${cls.name}`,
                        value: cls.id,
                      })) || []),
                    ]}
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shrink-0 h-10 overflow-hidden w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode("card")}
                    type="button"
                    className={`px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${viewMode === "card"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                      }`}
                  >
                    <HugeiconsIcon icon={IdentityCardIcon} size={14} color="currentColor" strokeWidth={2} />
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    type="button"
                    className={`px-3 h-full rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${viewMode === "list"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                      }`}
                  >
                    <HugeiconsIcon icon={ListViewIcon} size={14} color="currentColor" strokeWidth={2} />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>

              {/* Secondary Controls Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                {/* Missing Field Dropdown */}
                <div className="w-full sm:w-48 shrink-0">
                  <CustomDropdown
                    value={missingFieldFilter}
                    onChange={setMissingFieldFilter}
                    placeholder="Filter Missing..."
                    options={missingFieldOptions}
                  />
                </div>

                {/* Sort Dropdown */}
                {viewMode === "card" && (
                  <div className="w-full sm:w-40 shrink-0">
                    <CustomDropdown
                      value={sortBy}
                      onChange={setSortBy}
                      placeholder="Sort By"
                      options={[
                        { label: "Sort: Name (A-Z)", value: "name-asc" },
                        { label: "Sort: Name (Z-A)", value: "name-desc" },
                        { label: "Sort: Class (Asc)", value: "class-asc" },
                        { label: "Sort: Class (Desc)", value: "class-desc" },
                      ]}
                    />
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
                      className="w-3.5 h-3.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
                    />
                    <label
                      htmlFor="groupByClass"
                      className="text-xs font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                    >
                      Group by Class
                    </label>
                  </div>
                )}
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
                  selectedIds={selectedStudentIds}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectOne}
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
                        <span className="text-[10px] sm:text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
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
                            isSelected={selectedStudentIds.includes(student.id)}
                            onSelect={handleSelectOne}
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
                      isSelected={selectedStudentIds.includes(student.id)}
                      onSelect={handleSelectOne}
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
                {searchQuery || selectedClassId || missingFieldFilter
                  ? "No results matching your filters. Try adjusting them."
                  : "There are no students in this school yet."}
              </p>
              {(searchQuery || selectedClassId || missingFieldFilter) && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedClassId("");
                    setMissingFieldFilter("");
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
          {filteredStudents.length > 0 && (
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-150 p-4 shadow-xs animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-xs sm:text-sm text-gray-500 font-medium">
                  Showing <span className="font-semibold text-gray-900">{Math.min(filteredStudents.length, (currentPage - 1) * effectiveItemsPerPage + 1)}</span> to{" "}
                  <span className="font-semibold text-gray-900">{Math.min(filteredStudents.length, currentPage * effectiveItemsPerPage)}</span> of{" "}
                  <span className="font-semibold text-gray-900">{filteredStudents.length}</span> students
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium border-l border-gray-200 pl-4">
                  <span>Per page:</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={itemsPerPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) {
                        setItemsPerPage(val);
                      } else if (e.target.value === "") {
                        setItemsPerPage(12);
                      }
                    }}
                    className="w-16 h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-bold text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                  />
                  <select
                    value={[10, 12, 25, 50, 100].includes(itemsPerPage) ? itemsPerPage : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setItemsPerPage(Number(e.target.value));
                      }
                    }}
                    className="h-8 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="10">10</option>
                    <option value="12">12</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    {![10, 12, 25, 50, 100].includes(itemsPerPage) && (
                      <option value="custom">Custom ({itemsPerPage})</option>
                    )}
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
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
                          ? "bg-violet-600 text-white shadow-xs"
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
              )}
            </div>
          )}

          {/* Edit Student Modal */}
          {editingStudent && (
            <EditStudentModal
              student={{
                id: editingStudent.id,
                name: editingStudent.name,
                idNo: editingStudent.idNo || "",
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
              onPrevious={handlePreviousEdit}
              onNext={handleNextEdit}
              hasPrevious={editIndex > 0}
              hasNext={editIndex >= 0 && editIndex < filteredStudents.length - 1}
              currentIndex={editIndex}
              totalCount={filteredStudents.length}
            />
          )}

          {/* ID Card Preview Modal */}
          {selectedPreviewStudent && (
            <IdCardPreviewModal
              school={school}
              student={selectedPreviewStudent}
              onClose={() => setSelectedPreviewStudent(null)}
              onPrevious={handlePreviousPreview}
              onNext={handleNextPreview}
              hasPrevious={previewIndex > 0}
              hasNext={previewIndex >= 0 && previewIndex < filteredStudents.length - 1}
              currentIndex={previewIndex}
              totalCount={filteredStudents.length}
            />
          )}

          {/* Add Student Form Modal */}
          {showStudentForm && (
            <StudentForm
              schoolId={schoolId}
              classId={selectedClassId || ""}
              schoolName={school.name}
              classes={school.classes}
              onClose={() => setShowStudentForm(false)}
              onSuccess={() => {
                fetchSchool();
                setShowStudentForm(false);
              }}
            />
          )}

          {/* Delete Confirmation Modal */}
          {studentToDelete && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete the student record for <span className="font-semibold text-gray-900">{studentToDelete.name}</span>? This action cannot be undone.
                  </p>
                  <div className="flex w-full gap-3">
                    <button
                      onClick={() => setStudentToDelete(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors cursor-pointer border border-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteStudent}
                      className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Delete Modal */}
          <BulkDeleteModal
            isOpen={isBulkDeleteOpen}
            onClose={() => setIsBulkDeleteOpen(false)}
            selectedIds={selectedStudentIds}
            onSuccess={() => {
              setSelectedStudentIds([]);
              fetchSchool();
            }}
          />

          {/* Bulk Import Modal */}
          <BulkImportModal
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            schoolId={schoolId}
            classId={selectedClassId || undefined}
            customFieldsConfig={school?.customFieldsConfig}
            onSuccess={() => {
              fetchSchool();
            }}
          />
        </div>
    </>
  );
}