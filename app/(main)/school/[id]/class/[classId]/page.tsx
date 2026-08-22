"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StudentForm from "@/components/StudentForm";
import IdCardPreviewModal from "@/components/IdCardPreviewModal";
import IdCard, { CardTheme } from "@/components/IdCard";
import { useAuth } from "@/contexts/AuthContext";

// Custom UI imports
import StudentCard from "@/components/StudentCard";
import StudentListTable from "@/components/StudentListTable";
import EditStudentModal from "@/components/EditStudentModal";
import { Student } from "@/types/student";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Search01Icon, Search02Icon, ListViewIcon, IdentityCardIcon, UserGroupIcon, ArrowLeft01Icon, ArrowRight01Icon, UserAdd02Icon, PrinterIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BulkDeleteModal from "@/components/BulkDeleteModal";
import BulkImportModal from "@/components/BulkImportModal";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ClassData {
  id: string;
  name: string;
  customValues?: any;
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
  fatherPhone: "9876543210",
  address: "Kosgi",
  profilePictureUrl:
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
  customValues: {
    motherName: "Lakshmi",
    motherPhone: "9876512340",
  }
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

export default function ClassPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const classId = params.classId as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canEditOrDelete = isAdmin || ((user?.role === "user" || user?.role === "school_admin") && user?.schoolId === schoolId);

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
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [missingFieldFilter, setMissingFieldFilter] = useState("");
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isClassDeleteOpen, setIsClassDeleteOpen] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);
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
      classCustomValues: classData.customValues,
    }));
  }, [classData]);

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
    const options: { label: string; value: string; count?: number }[] = [
      { label: "All Students", value: "", count: allStudents.length }
    ];

    let studentFields = [
      { key: "name", label: "Student Name", enabled: true },
      { key: "profilePictureUrl", label: "Profile Picture", enabled: true },
      { key: "fatherName", label: "Father Name", enabled: true },
      { key: "fatherPhone", label: "Father Phone", enabled: true },
      { key: "address", label: "Address", enabled: true },
    ];

    if (classData?.school?.customFieldsConfig) {
      let parsed = classData.school.customFieldsConfig;
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
        const count = allStudents.filter(s => isFieldMissing(s, f.key)).length;
        options.push({
          label: f.key === "profilePictureUrl" ? "Missing Photo" : `Missing ${cleanLabel}`,
          value: f.key,
          count: count
        });
      });

    return options;
  }, [allStudents, classData, isFieldMissing]);

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

    // Missing Field Filter
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
        
        if ((val === undefined || val === null || String(val).trim() === "") && customVals && typeof customVals === 'object') {
          const cv = (customVals as any)[missingFieldFilter];
          if (cv !== undefined && cv !== null) {
            val = cv;
          }
        }
        
        return val === undefined || val === null || String(val).trim() === "";
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
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
  }, [allStudents, searchQuery, sortBy, missingFieldFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, itemsPerPage, missingFieldFilter]);

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

  const handleDeleteClick = async (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName });
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      const res = await fetch(`/api/students/${studentToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Student deleted successfully!");
        fetchClass();
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

  const confirmDeleteClass = async () => {
    if (!classData) return;
    setIsDeletingClass(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete class");

      toast.success("Class deleted successfully");
      router.push(`/school/${schoolId}/students`);
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class. Please try again.");
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleExportToExcel = () => {
    if (!allStudents || allStudents.length === 0) {
      toast.error("No student data available to export.");
      return;
    }

    const config = classData?.school?.customFieldsConfig;
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
    <>
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-100px)]">
        {children}
      </div>
    </>
  );

  if (loading || !designReady)
    return (
      <Shell>
        <LoadingSpinner message="Loading class..." />
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
    <>
        <div className="max-w-7xl mx-auto mt-3">
          {/* ── Page Header & Search ────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6 flex flex-col gap-5">
            {/* Top row: Title, breadcrumb, info on left; Actions on right */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="min-w-0 text-left">
                {/* Back to School link above breadcrumb */}
                <button
                  onClick={() => router.push(`/school/${classData.school.id}`)}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-violet-600 transition-colors cursor-pointer border-0 bg-transparent p-0"
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
                  <span className="text-violet-600 flex items-center">
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
                {/* Print ID Cards */}
                {canEditOrDelete && (
                  allStudents.length > 0 ? (
                    <Link
                      href={
                        selectedStudentIds.length > 0
                          ? `/school/${schoolId}/class/${classId}/print?selected=${selectedStudentIds.join(",")}`
                          : `/school/${schoolId}/class/${classId}/print`
                      }
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer h-10 shadow-sm ${
                        selectedStudentIds.length > 0
                          ? "bg-violet-600 hover:bg-violet-700 text-white border border-violet-700 shadow-md"
                          : "bg-violet-50 hover:bg-violet-100 text-violet-750 border border-violet-200"
                      }`}
                      title={
                        selectedStudentIds.length > 0
                          ? `Print ID Cards for ${selectedStudentIds.length} selected students`
                          : "Print ID Cards for all students in this class"
                      }
                    >
                      <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                      <span>
                        {selectedStudentIds.length > 0
                          ? `Print Selected (${selectedStudentIds.length})`
                          : "Print / Export PDF"}
                      </span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-400 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold h-10 opacity-60 cursor-not-allowed border-0"
                      title="No students in this class to print"
                    >
                      <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2.5} />
                      <span>Print / Export PDF</span>
                    </button>
                  )
                )}

                {/* Export Excel (Admin only) */}
                {canEditOrDelete && (
                  <button
                    onClick={handleExportToExcel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 border-0 justify-center h-10"
                    title="Export all class student data to Excel (CSV)"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Excel</span>
                  </button>
                )}

                {canEditOrDelete && (
                  <button
                    onClick={() => setIsClassDeleteOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm active:scale-95 border border-rose-200 justify-center h-10"
                    title="Delete entire class"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                    <span>Delete Class</span>
                  </button>
                )}

                {canEditOrDelete && (
                  <>
                    {selectedStudentIds.length > 0 && (
                      <button
                        onClick={() => setIsBulkDeleteOpen(true)}
                        className="py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white transition-colors h-10 shadow-sm"
                        title="Delete selected students"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                        <span>Delete ({selectedStudentIds.length})</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsBulkImportOpen(true)}
                      className="py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors h-10 shadow-sm"
                      title="Import students from Excel"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Import</span>
                    </button>
                  </>
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
                  <span>Add Student</span>
                </button>
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
                  <div className="w-full sm:w-44 shrink-0">
                    <CustomDropdown
                      value={sortBy}
                      onChange={setSortBy}
                      placeholder="Sort By"
                      options={[
                        { value: "name-asc", label: "Sort: Name (A-Z)" },
                        { value: "name-desc", label: "Sort: Name (Z-A)" },
                        { value: "camSno-asc", label: "Sort: CAM S.No (Asc)" },
                        { value: "camSno-desc", label: "Sort: CAM S.No (Desc)" },
                        { value: "fatherName-asc", label: "Sort: Father Name (A-Z)" },
                        { value: "fatherName-desc", label: "Sort: Father Name (Z-A)" },
                      ]}
                    />
                  </div>
                )}

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
                  selectedIds={selectedStudentIds}
                  onSelectAll={handleSelectAll}
                  onSelectOne={handleSelectOne}
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
                    isSelected={selectedStudentIds.includes(student.id)}
                    onSelect={handleSelectOne}
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
                {searchQuery || missingFieldFilter
                  ? "No results matching your filter. Try adjusting it."
                  : "There are no students in this class yet."}
              </p>
              {(searchQuery || missingFieldFilter) && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setMissingFieldFilter("");
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filter
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
                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-55 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Next
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="currentColor" strokeWidth={2.5} />
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
              classes={classesList}
              schoolName={classData.school.name}
              schoolId={classData.school.id}
              onClose={() => setEditingStudent(null)}
              onSuccess={fetchClass}
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
              school={classData.school}
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

          {/* Delete Confirmation Modal */}
          {studentToDelete && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">"{studentToDelete.name}"</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setStudentToDelete(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Class Modal */}
          {isClassDeleteOpen && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                    <HugeiconsIcon icon={Cancel01Icon} size={24} className="text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Entire Class</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    You are about to delete the class <span className="font-semibold text-gray-900">"{classData?.name}"</span>. 
                    This will also permanently delete <strong>all {allStudents.length} students</strong> within this class and their associated data.
                    <br/><br/>
                    This action <strong>cannot</strong> be undone. Are you sure you want to proceed?
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setIsClassDeleteOpen(false)}
                      disabled={isDeletingClass}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteClass}
                      disabled={isDeletingClass}
                      className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isDeletingClass ? "Deleting..." : "Delete Class"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedIds={selectedStudentIds}
        onSuccess={() => {
          setSelectedStudentIds([]);
          fetchClass();
        }}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        schoolId={classData.school.id}
        classId={classId}
        customFieldsConfig={classData.school.customFieldsConfig}
        onSuccess={() => {
          fetchClass();
        }}
      />
    </>
  );
}
