"use client";

import { PDFDocument, StandardFonts, cmyk } from "pdf-lib";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import uploadImageToCloudinary from "@/utils/cloudService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete01Icon,
  PencilEdit02Icon,
  PrinterIcon
} from "@hugeicons/core-free-icons";
import { PrintSettingsPanel } from "@/components/PrintSettingsPanel";
import { PrintSettings, calculatePrintGridMm, getPaperInfo } from "@/utils/printLayoutEngine";
import ImageEnhancerModal from "@/components/ImageEnhancerModal";

// Conversion factor for display: 1 mm ≈ 3.7795 px
const MM_TO_PX = 3.7795275591;

const DUMMY_STUDENT = {
  id: "dummy1",
  name: "A. Punarvi",
  camSno: "CAM-990",
  fatherName: "Anil Kumar",
  motherName: "Lakshmi",
  fatherPhone: "9876543210",
  motherPhone: "9876512340",
  address: "Kosgi",
  profilePictureUrl:
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
};

const GOOGLE_FONTS = [
  // Standard Fonts
  "Arial",

  // Elegant Serifs & Display
  "Belleza",
  "Cinzel",
  "Cinzel Decorative",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Cormorant Garamond",
  "Marcellus",
  "Crete Round",
  "Philosopher",

  // Trendy Sans-Serifs
  "Poppins",
  "Montserrat",
  "Inter",
  "Outfit",
  "Cabin",
  "Josefin Sans",
  "Franklin Gothic",
  "Franklin Gothic Medium",

  // Decorative Display
  "Revue",
  "Berkshire Swash",
  "Righteous",
  "Alfa Slab One",
  "Carter One",
  "Uncial Antiqua",
  "Abril Fatface",
  "Bungee",
  "Monoton",
  "Special Elite",
  "Bangers",
  "Fredericka the Great",
  "Bowlby One SC",
  "Chewy",
  "Fascinate Inline",
  "Ultra"
];

const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi-Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra-Bold" },
  { value: "900", label: "Black" }
];

interface DocumentTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundUrl: string | null;
  fieldsConfig: any;
  layoutConfig: any;
}

interface DocumentStudioTabProps {
  schoolId: string;
  schoolName: string;
  students: any[];
  customFieldsConfig?: any;
  schoolClasses?: any[];
  school?: any;
}

interface CustomClassDropdownProps {
  selectedClassFilter: string;
  setSelectedClassFilter: (classId: string) => void;
  schoolClasses: any[];
  totalStudentsCount: number;
  schoolStudents: any[];
}

function CustomClassDropdown({
  selectedClassFilter,
  setSelectedClassFilter,
  schoolClasses,
  totalStudentsCount,
  schoolStudents,
}: CustomClassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeClassObj = schoolClasses.find((c: any) => c.id === selectedClassFilter);
  const activeLabel = selectedClassFilter === "all" ? "All Classes" : activeClassObj?.name || "Class";
  const activeCount = selectedClassFilter === "all"
    ? totalStudentsCount
    : schoolStudents.filter((s: any) => s.classId === selectedClassFilter || s.class?.id === selectedClassFilter).length;

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all cursor-pointer shadow-2xs group"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
          <span className="text-xs font-bold text-gray-800 truncate">{activeLabel}</span>
          <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-gray-200 text-gray-700 rounded-md shrink-0">
            ({activeCount})
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              setSelectedClassFilter("all");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors ${selectedClassFilter === "all" ? "bg-violet-600 text-white" : "hover:bg-violet-50 text-gray-700"
              }`}
          >
            <span className="truncate">All Classes</span>
            <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md shrink-0 ${selectedClassFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
              }`}>
              ({totalStudentsCount})
            </span>
          </button>

          {schoolClasses.length > 0 && <div className="my-1 border-t border-gray-100" />}

          {schoolClasses.map((cls: any) => {
            const isSelected = selectedClassFilter === cls.id;
            const count = schoolStudents.filter((s: any) => s.classId === cls.id || s.class?.id === cls.id).length;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClassFilter(cls.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs transition-colors ${isSelected ? "bg-violet-600 text-white font-bold" : "hover:bg-violet-50 text-gray-800 font-semibold"
                  }`}
              >
                <span className="truncate">{cls.name}</span>
                <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-800"
                  }`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CustomStudentDropdownProps {
  previewStudentIndex: number;
  setPreviewStudentIndex: (idx: number) => void;
  filteredPreviewStudents: any[];
  schoolClasses: any[];
}

function CustomStudentDropdown({
  previewStudentIndex,
  setPreviewStudentIndex,
  filteredPreviewStudents,
  schoolClasses,
}: CustomStudentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeStudent =
    previewStudentIndex >= 0 && previewStudentIndex < filteredPreviewStudents.length
      ? filteredPreviewStudents[previewStudentIndex]
      : null;

  const activeClass = activeStudent
    ? schoolClasses.find((c: any) => c.id === (activeStudent.classId || activeStudent.class?.id))?.name || activeStudent.className || activeStudent.class?.name || ""
    : "";

  return (
    <div className="relative flex-1 min-w-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-violet-50/70 hover:bg-violet-100/80 border border-violet-200/80 rounded-xl transition-all cursor-pointer shadow-2xs group"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          {activeStudent?.profilePictureUrl ? (
            <img
              src={activeStudent.profilePictureUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0 border border-violet-200"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 font-bold text-[10px] flex items-center justify-center shrink-0">
              {activeStudent ? activeStudent.name.charAt(0).toUpperCase() : "★"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-violet-950 truncate">
                {previewStudentIndex === -1 ? "Demo Sample Student" : `${previewStudentIndex + 1}. ${activeStudent?.name}`}
              </span>
              {activeClass && previewStudentIndex !== -1 && (
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-violet-200/60 text-violet-800 rounded-md shrink-0 uppercase tracking-tight">
                  {activeClass}
                </span>
              )}
            </div>
          </div>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-violet-600 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              setPreviewStudentIndex(-1);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors ${previewStudentIndex === -1 ? "bg-violet-600 text-white" : "hover:bg-violet-50 text-gray-700"
              }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${previewStudentIndex === -1 ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
              ★
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate">Demo Sample Student</p>
              <p className={`text-[10px] font-medium ${previewStudentIndex === -1 ? "text-violet-100" : "text-gray-400"}`}>
                Sample placeholder data
              </p>
            </div>
          </button>

          {filteredPreviewStudents.length > 0 && <div className="my-1 border-t border-gray-100" />}

          {filteredPreviewStudents.length === 0 ? (
            <div className="p-3 text-center text-xs font-medium text-gray-400">
              No matching students found
            </div>
          ) : (
            filteredPreviewStudents.map((st: any, idx: number) => {
              const clsName = schoolClasses.find((c: any) => c.id === (st.classId || st.class?.id))?.name || st.className || st.class?.name || "";
              const isSelected = previewStudentIndex === idx;

              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => {
                    setPreviewStudentIndex(idx);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${isSelected ? "bg-violet-600 text-white font-bold" : "hover:bg-violet-50 text-gray-800 font-semibold"
                    }`}
                >
                  {st.profilePictureUrl ? (
                    <img
                      src={st.profilePictureUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-black/10"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                      }`}>
                      {st.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate">
                        {idx + 1}. {st.name}
                      </span>
                      {clsName && (
                        <span className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-md shrink-0 uppercase ${isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-800"
                          }`}>
                          {clsName}
                        </span>
                      )}
                    </div>
                    {st.camSno && (
                      <span className={`text-[10px] font-medium block truncate ${isSelected ? "text-violet-200" : "text-gray-400"
                        }`}>
                        S.No: {st.camSno}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function DocumentStudioTab({ schoolId, schoolName, students, customFieldsConfig, schoolClasses = [], school }: DocumentStudioTabProps) {
  const [documents, setDocuments] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentTemplate | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [schoolId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        toast.error("Failed to fetch documents");
      }
    } catch (err) {
      toast.error("An error occurred while fetching documents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Document",
          width: 210, // A4 Width in mm
          height: 297, // A4 Height in mm
          layoutConfig: { fields: {} },
        }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments([newDoc, ...documents]);
        setSelectedDoc(newDoc);
        toast.success("Document created");
      } else {
        toast.error("Failed to create document");
      }
    } catch (err) {
      toast.error("An error occurred while creating document");
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      const res = await fetch(`/api/documents/${docToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(documents.filter((d) => d.id !== docToDelete));
        if (selectedDoc?.id === docToDelete) setSelectedDoc(null);
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setDocToDelete(null);
    }
  };

  const handleDelete = (id: string) => {
    setDocToDelete(id);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selectedDoc) {
    return (
      <DocumentDesigner
        doc={selectedDoc}
        onBack={() => { setSelectedDoc(null); fetchDocuments(); }}
        schoolName={schoolName}
        students={students}
        customFieldsConfig={customFieldsConfig}
        schoolClasses={schoolClasses}
        school={school}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Document Studio</h2>
          <p className="text-sm text-gray-500">Create custom printable documents for your students like Hall Tickets or Certificates.</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-2">
          <HugeiconsIcon icon={Add01Icon} size={20} color="currentColor" />
          Create New Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={Add01Icon} size={32} color="#7c3aed" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">You haven't created any custom documents yet. Click the button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[1/1.4] bg-gray-100 relative w-full flex items-center justify-center overflow-hidden p-2">
                {doc.backgroundUrl ? (
                  <Image src={doc.backgroundUrl} alt={doc.name} fill className="object-contain p-2" />
                ) : (
                  <span className="text-gray-400 text-sm">No Background</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button className="bg-white text-gray-900 hover:bg-[#7f22ff] hover:text-white px-4" onClick={() => setSelectedDoc(doc)}>
                    <HugeiconsIcon icon={PencilEdit02Icon} size={16} color="currentColor" />
                    <span className="ml-2">Edit</span>
                  </Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-white border-t border-gray-100">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
                  <p className="text-xs text-gray-500">{doc.width}mm × {doc.height}mm</p>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <HugeiconsIcon icon={Delete01Icon} size={20} color="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDocToDelete(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up border border-rose-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-950">Delete Document</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete this document template? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 border-0"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// DESIGNER COMPONENT
// ----------------------------------------------------------------------

interface DocumentDesignerProps {
  doc: DocumentTemplate;
  onBack: () => void;
  schoolName: string;
  students: any[];
  customFieldsConfig?: any;
  schoolClasses?: any[];
  school?: any;
}

const AVAILABLE_FIELDS = [
  { key: "student_name", label: "Student Name", defaultLabel: "Student Name", isImage: false },
  { key: "student_class", label: "Class", defaultLabel: "Class", isImage: false },
  { key: "student_camSno", label: "CAM S.No", defaultLabel: "CAM-123", isImage: false },
  { key: "student_idNo", label: "ID No.", defaultLabel: "ID-123", isImage: false },
  { key: "student_fatherName", label: "Father Name", defaultLabel: "Father Name", isImage: false },
  { key: "student_motherName", label: "Mother Name", defaultLabel: "Mother Name", isImage: false },
  { key: "student_fatherPhone", label: "Father Phone", defaultLabel: "Father Phone", isImage: false },
  { key: "student_motherPhone", label: "Mother Phone", defaultLabel: "Mother Phone", isImage: false },
  { key: "student_address", label: "Student Address", defaultLabel: "Student Address", isImage: false },
  { key: "student_photo", label: "Student Photo", defaultLabel: "", isImage: true },
  { key: "school_name", label: "School Name", defaultLabel: "School Name", isImage: false },
  { key: "school_caption", label: "School Caption", defaultLabel: "School Caption", isImage: false },
  { key: "school_address", label: "School Address", defaultLabel: "School Address", isImage: false },
  { key: "school_phone", label: "School Phone", defaultLabel: "School Phone", isImage: false },
  { key: "school_logo", label: "School Logo", defaultLabel: "", isImage: true },
  { key: "school_signature", label: "Principal Signature", defaultLabel: "", isImage: true },
];

function DocumentDesigner({ doc, onBack, schoolName, students, customFieldsConfig, schoolClasses = [], school }: DocumentDesignerProps) {
  const [name, setName] = useState(doc.name);
  const [widthMm, setWidthMm] = useState(doc.width);
  const [heightMm, setHeightMm] = useState(doc.height);
  const [backgroundUrl, setBackgroundUrl] = useState(doc.backgroundUrl || "");
  const [fields, setFields] = useState<any>(() => {
    let config = doc.layoutConfig;
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (e) { }
    }
    return config?.fields || {};
  });

  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Preview Navigator & Filtering State
  const [previewStudentIndex, setPreviewStudentIndex] = useState<number>(-1);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [editingStudentForBrightness, setEditingStudentForBrightness] = useState<any>(null);

  // Ruler Scale, Grid & Guideline Snapping State
  const [showRulerScale, setShowRulerScale] = useState<boolean>(true);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [snapThreshold, setSnapThreshold] = useState<number>(8);
  const [editorUnit, setEditorUnit] = useState<"mm" | "px">("mm");
  const [userXGuides, setUserXGuides] = useState<number[]>([]);
  const [userYGuides, setUserYGuides] = useState<number[]>([]);

  const [activeGuideDrag, setActiveGuideDrag] = useState<{
    type: "x" | "y";
    originalPx: number;
    currentPx: number;
    currentMm: number;
  } | null>(null);

  const topRulerRef = useRef<HTMLDivElement>(null);
  const leftRulerRef = useRef<HTMLDivElement>(null);
  const fieldBoundsRef = useRef<Record<string, { w: number; h: number }>>({});

  const handleBoundsUpdate = (key: string, w: number, h: number) => {
    fieldBoundsRef.current[key] = { w, h };
  };

  const availableFields = useMemo(() => {
    const baseFields = [...AVAILABLE_FIELDS];

    if (customFieldsConfig) {
      const { school = [], class: classFields = [], student = [] } = customFieldsConfig;

      school.filter((f: any) => !f.default && f.enabled).forEach((f: any) => {
        baseFields.push({ key: `school_custom_${f.key}`, label: `(School) ${f.label}`, defaultLabel: `[${f.label}]`, isImage: false });
      });
      classFields.filter((f: any) => !f.default && f.enabled).forEach((f: any) => {
        baseFields.push({ key: `class_custom_${f.key}`, label: `(Class) ${f.label}`, defaultLabel: `[${f.label}]`, isImage: false });
      });
      student.filter((f: any) => !f.default && f.enabled && f.key !== "designation").forEach((f: any) => {
        baseFields.push({ key: `student_custom_${f.key}`, label: `(Student) ${f.label}`, defaultLabel: `[${f.label}]`, isImage: false });
      });
    }

    return baseFields;
  }, [customFieldsConfig]);

  const canvasWidthPx = widthMm * MM_TO_PX;
  const canvasHeightPx = heightMm * MM_TO_PX;

  // Zoom to fit canvas in container
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragState, setDragState] = useState<{ activeKey: string; x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 64;
      const containerHeight = containerRef.current.clientHeight - 64;
      const scaleX = containerWidth / canvasWidthPx;
      const scaleY = containerHeight / canvasHeightPx;
      const minScale = Math.max(0.1, Math.min(scaleX, scaleY, 1));
      setScale(minScale);
    }
  }, [canvasWidthPx, canvasHeightPx]);

  // Student filtering logic
  const filteredPreviewStudents = useMemo(() => {
    let list = students || [];

    if (selectedClassFilter !== "all") {
      list = list.filter((st: any) => st.classId === selectedClassFilter || st.class?.id === selectedClassFilter);
    }

    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.trim().toLowerCase();
      list = list.filter((st: any) => {
        const nameMatch = st.name?.toLowerCase().includes(q);
        const camMatch = st.camSno?.toLowerCase().includes(q);
        const fatherMatch = st.fatherName?.toLowerCase().includes(q);
        return nameMatch || camMatch || fatherMatch;
      });
    }

    const classOrderMap = new Map((schoolClasses || []).map((c: any, index: number) => [c.id, index]));
    return [...list].sort((a: any, b: any) => {
      const classIdA = a.classId || a.class?.id;
      const classIdB = b.classId || b.class?.id;
      const orderA = Number(classOrderMap.get(classIdA) ?? 9999);
      const orderB = Number(classOrderMap.get(classIdB) ?? 9999);
      if (orderA !== orderB) return orderA - orderB;

      const idA = (a.idNo || a.camSno || a.name || "").toString();
      const idB = (b.idNo || b.camSno || b.name || "").toString();
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [students, selectedClassFilter, studentSearchQuery, schoolClasses]);

  useEffect(() => {
    if (filteredPreviewStudents.length > 0) {
      setPreviewStudentIndex(0);
    } else {
      setPreviewStudentIndex(-1);
    }
  }, [selectedClassFilter, studentSearchQuery, filteredPreviewStudents.length]);

  const activePreviewStudent = useMemo(() => {
    if (previewStudentIndex >= 0 && previewStudentIndex < filteredPreviewStudents.length) {
      const st = filteredPreviewStudents[previewStudentIndex];
      const clsName = schoolClasses.find((c: any) => c.id === (st.classId || st.class?.id))?.name || st.className || st.class?.name || "";
      return {
        ...st,
        classNameStr: clsName,
      };
    }
    return {
      ...DUMMY_STUDENT,
      classNameStr: "Demo Class",
    };
  }, [previewStudentIndex, filteredPreviewStudents, schoolClasses]);

  const handlePrevStudent = () => {
    if (filteredPreviewStudents.length === 0) return;
    setPreviewStudentIndex((prev) => {
      if (prev <= 0) return filteredPreviewStudents.length - 1;
      return prev - 1;
    });
  };

  const handleNextStudent = () => {
    if (filteredPreviewStudents.length === 0) return;
    setPreviewStudentIndex((prev) => {
      if (prev >= filteredPreviewStudents.length - 1) return 0;
      return prev + 1;
    });
  };

  // Alignment Guide Dragging Logic
  const handleStartDragXGuide = (e: React.MouseEvent, originalPx = -1) => {
    e.preventDefault();
    e.stopPropagation();

    if (!topRulerRef.current) return;
    const rect = topRulerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(canvasWidthPx * scale, e.clientX - rect.left));
    const mmVal = parseFloat((((clickX / scale) / canvasWidthPx) * widthMm).toFixed(1));
    const pxVal = parseFloat(((mmVal / widthMm) * canvasWidthPx).toFixed(1));

    setActiveGuideDrag({
      type: "x",
      originalPx: originalPx >= 0 ? originalPx : -1,
      currentPx: pxVal,
      currentMm: mmVal,
    });
  };

  const handleStartDragYGuide = (e: React.MouseEvent, originalPx = -1) => {
    e.preventDefault();
    e.stopPropagation();

    if (!leftRulerRef.current) return;
    const rect = leftRulerRef.current.getBoundingClientRect();
    const clickY = Math.max(0, Math.min(canvasHeightPx * scale, e.clientY - rect.top));
    const mmVal = parseFloat((((clickY / scale) / canvasHeightPx) * heightMm).toFixed(1));
    const pxVal = parseFloat(((mmVal / heightMm) * canvasHeightPx).toFixed(1));

    setActiveGuideDrag({
      type: "y",
      originalPx: originalPx >= 0 ? originalPx : -1,
      currentPx: pxVal,
      currentMm: mmVal,
    });
  };

  useEffect(() => {
    if (!activeGuideDrag) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (activeGuideDrag.type === "x" && topRulerRef.current) {
        const rect = topRulerRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(canvasWidthPx * scale, e.clientX - rect.left));
        const mmVal = parseFloat((((clickX / scale) / canvasWidthPx) * widthMm).toFixed(1));
        const pxVal = parseFloat(((mmVal / widthMm) * canvasWidthPx).toFixed(1));
        setActiveGuideDrag((prev) => (prev ? { ...prev, currentPx: pxVal, currentMm: mmVal } : null));
      } else if (activeGuideDrag.type === "y" && leftRulerRef.current) {
        const rect = leftRulerRef.current.getBoundingClientRect();
        const clickY = Math.max(0, Math.min(canvasHeightPx * scale, e.clientY - rect.top));
        const mmVal = parseFloat((((clickY / scale) / canvasHeightPx) * heightMm).toFixed(1));
        const pxVal = parseFloat(((mmVal / heightMm) * canvasHeightPx).toFixed(1));
        setActiveGuideDrag((prev) => (prev ? { ...prev, currentPx: pxVal, currentMm: mmVal } : null));
      }
    };

    const handleWindowMouseUp = () => {
      if (activeGuideDrag) {
        const { type, originalPx, currentPx } = activeGuideDrag;
        if (type === "x") {
          setUserXGuides((prev) => {
            let next = [...prev];
            if (originalPx >= 0) {
              next = next.filter((g) => g !== originalPx);
            }
            if (!next.includes(currentPx)) {
              next.push(currentPx);
            }
            return next;
          });
        } else if (type === "y") {
          setUserYGuides((prev) => {
            let next = [...prev];
            if (originalPx >= 0) {
              next = next.filter((g) => g !== originalPx);
            }
            if (!next.includes(currentPx)) {
              next.push(currentPx);
            }
            return next;
          });
        }
      }
      setActiveGuideDrag(null);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [activeGuideDrag, canvasWidthPx, canvasHeightPx, heightMm, scale, widthMm]);

  // Live Dynamic Smart Alignment Lines while Dragging
  const getActiveSnapLines = () => {
    if (!dragState || snapThreshold <= 0) return { xLines: [], yLines: [] };

    const activeKey = dragState.activeKey;
    const x = dragState.x;
    const y = dragState.y;
    const w = dragState.width || fieldBoundsRef.current[activeKey]?.w || 100;
    const h = dragState.height || fieldBoundsRef.current[activeKey]?.h || 30;

    const threshold = snapThreshold;
    const xLines: { pos: number; label: string }[] = [];
    const yLines: { pos: number; label: string }[] = [];

    const activeEdgesX = [x, x + w / 2, x + w];
    const activeEdgesY = [y, y + h / 2, y + h];

    const canvasCenterX = canvasWidthPx / 2;
    const canvasCenterY = canvasHeightPx / 2;

    // 1. Center of Canvas
    if (Math.abs(x + w / 2 - canvasCenterX) < threshold) {
      xLines.push({ pos: canvasCenterX, label: "Center X" });
    }
    if (Math.abs(x - canvasCenterX) < threshold) {
      xLines.push({ pos: canvasCenterX, label: "Center X" });
    }
    if (Math.abs(y + h / 2 - canvasCenterY) < threshold) {
      yLines.push({ pos: canvasCenterY, label: "Center Y" });
    }
    if (Math.abs(y - canvasCenterY) < threshold) {
      yLines.push({ pos: canvasCenterY, label: "Center Y" });
    }

    // 2. User MM/PX Guidelines
    userXGuides.forEach((g) => {
      if (activeEdgesX.some((e) => Math.abs(e - g) < threshold)) {
        xLines.push({ pos: g, label: `${((g / canvasWidthPx) * widthMm).toFixed(1)}mm Guide` });
      }
    });
    userYGuides.forEach((g) => {
      if (activeEdgesY.some((e) => Math.abs(e - g) < threshold)) {
        yLines.push({ pos: g, label: `${((g / canvasHeightPx) * heightMm).toFixed(1)}mm Guide` });
      }
    });

    // 3. Other Visible Fields
    Object.entries(fields).forEach(([otherKey, otherField]: [string, any]) => {
      if (otherKey === activeKey || !otherField || !otherField.visible) return;

      const oX = otherField.x || 0;
      const oY = otherField.y || 0;
      const bounds = fieldBoundsRef.current[otherKey];
      const oW = otherField.width || bounds?.w || 100;
      const oH = otherField.height || bounds?.h || 30;

      const otherEdgesX = [oX, oX + oW / 2, oX + oW];
      const otherEdgesY = [oY, oY + oH / 2, oY + oH];

      activeEdgesX.forEach((ae, aIdx) => {
        otherEdgesX.forEach((oe, oIdx) => {
          if (Math.abs(ae - oe) < threshold) {
            let label = "Align X";
            if (aIdx === 0 && oIdx === 0) label = "Left Align";
            else if (aIdx === 2 && oIdx === 2) label = "Right Align";
            else if (aIdx === 1 && oIdx === 1) label = "Center X";
            else if ((aIdx === 0 && oIdx === 2) || (aIdx === 2 && oIdx === 0)) label = "Side Align";
            xLines.push({ pos: oe, label });
          }
        });
      });

      activeEdgesY.forEach((ae, aIdx) => {
        otherEdgesY.forEach((oe, oIdx) => {
          if (Math.abs(ae - oe) < threshold) {
            let label = "Align Y";
            if (aIdx === 0 && oIdx === 0) label = "Top Align";
            else if (aIdx === 2 && oIdx === 2) label = "Bottom Align";
            else if (aIdx === 1 && oIdx === 1) label = "Center Y";
            else if (aIdx === 0 && oIdx === 2) label = "Below Align";
            else if (aIdx === 2 && oIdx === 0) label = "Above Align";
            yLines.push({ pos: oe, label });
          }
        });
      });
    });

    return {
      xLines: Array.from(new Map(xLines.map((l) => [l.pos, l])).values()),
      yLines: Array.from(new Map(yLines.map((l) => [l.pos, l])).values()),
    };
  };

  const handleSave = async () => {
    if (widthMm <= 0 || heightMm <= 0) {
      toast.error("Width and height must be greater than 0");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          width: widthMm,
          height: heightMm,
          backgroundUrl,
          layoutConfig: { fields },
        }),
      });

      if (res.ok) {
        toast.success("Document saved successfully");
      } else {
        toast.error("Failed to save document");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const folderName = schoolName.trim().split(/\s+/)[0] || "custom";
      const url = await uploadImageToCloudinary(file, folderName);
      setBackgroundUrl(url);
      toast.success("Background image uploaded");
    } catch (err) {
      toast.error("Failed to upload background");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddField = (fieldKey: string) => {
    if ((fields || {})[fieldKey]) return; // Already exists
    const isImage = availableFields.find((f: any) => f.key === fieldKey)?.isImage;

    setFields((prev: any) => ({
      ...(prev || {}),
      [fieldKey]: {
        x: 50,
        y: 50,
        fontSize: isImage ? undefined : 18,
        color: isImage ? undefined : "#000000",
        fontWeight: isImage ? undefined : "500",
        fontFamily: isImage ? undefined : "Inter",
        align: isImage ? undefined : "left",
        verticalAlign: isImage ? undefined : "center",
        labelVisible: true,
        width: isImage ? 100 : undefined,
        height: isImage ? 100 : undefined,
        visible: true,
      }
    }));
    setSelectedFieldKey(fieldKey);
  };

  const handleRemoveField = (fieldKey: string) => {
    setFields((prev: any) => {
      const newFields = { ...(prev || {}) };
      delete newFields[fieldKey];
      return newFields;
    });
    if (selectedFieldKey === fieldKey) setSelectedFieldKey(null);
  };

  const updateFieldProperty = (key: string, value: any) => {
    if (!selectedFieldKey) return;
    setFields((prev: any) => {
      const currentFields = prev || {};
      const updatedField = {
        ...currentFields[selectedFieldKey],
        [key]: value
      };

      if (key === 'fontSize') {
        delete updatedField.width;
        delete updatedField.height;
        delete updatedField.scaleX;
        delete updatedField.scaleY;
      }

      return {
        ...currentFields,
        [selectedFieldKey]: updatedField
      };
    });
  };

  const handleDragStart = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleDragMove = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleFieldResize = (fieldKey: string, width: number, height: number, scaleX: number, scaleY: number, x: number, y: number) => {
    setFields((prev: any) => ({
      ...(prev || {}),
      [fieldKey]: {
        ...(prev || {})[fieldKey],
        width,
        height,
        scaleX,
        scaleY,
        x,
        y
      }
    }));
  };

  const handleDragStop = (fieldKey: string, x: number, y: number) => {
    let snappedX = Math.round(x);
    let snappedY = Math.round(y);
    const threshold = snapThreshold;

    if (threshold > 0) {
      let w = 0;
      let h = 0;
      if (dragState && dragState.activeKey === fieldKey) {
        w = dragState.width;
        h = dragState.height;
      }

      const centerX = canvasWidthPx / 2;
      const centerY = canvasHeightPx / 2;

      if (w > 0 && Math.abs((snappedX + w / 2) - centerX) < threshold) snappedX = Math.round(centerX - w / 2);
      if (Math.abs(snappedX - centerX) < threshold) snappedX = Math.round(centerX);

      if (h > 0 && Math.abs((snappedY + h / 2) - centerY) < threshold) snappedY = Math.round(centerY - h / 2);
      if (Math.abs(snappedY - centerY) < threshold) snappedY = Math.round(centerY);

      userXGuides.forEach((g) => {
        if (Math.abs(snappedX - g) < threshold) snappedX = g;
      });
      userYGuides.forEach((g) => {
        if (Math.abs(snappedY - g) < threshold) snappedY = g;
      });

      Object.entries(fields).forEach(([otherKey, otherField]: [string, any]) => {
        if (otherKey === fieldKey || !otherField || !otherField.visible) return;
        if (Math.abs(snappedX - (otherField.x || 0)) < threshold) snappedX = otherField.x || 0;
        if (Math.abs(snappedY - (otherField.y || 0)) < threshold) snappedY = otherField.y || 0;
      });
    }

    setFields((prev: any) => ({
      ...(prev || {}),
      [fieldKey]: {
        ...(prev || {})[fieldKey],
        x: snappedX,
        y: snappedY
      }
    }));
    setDragState(null);
  };

  if (showPrintView) {
    return (
      <DocumentPrintView
        students={students}
        widthMm={widthMm}
        heightMm={heightMm}
        backgroundUrl={backgroundUrl}
        fields={fields}
        onBack={() => setShowPrintView(false)}
      />
    );
  }

  const selectedField = selectedFieldKey ? fields[selectedFieldKey] : null;
  const isSelectedImage = selectedFieldKey ? availableFields.find(f => f.key === selectedFieldKey)?.isImage : false;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] animate-fade-in">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full truncate text-base"
              placeholder="Document Name"
            />
          </div>
        </div>

        {/* Student Preview Switcher & Filter Navigator Card (FIXED below heading) */}
        <div className="p-3 border-b border-gray-200 bg-slate-50/70 space-y-2.5 shrink-0 select-none">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎓</span> Student Preview Navigator
            </h4>
            <span className="text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">Live Preview</span>
          </div>

          {/* Filter & Search Inputs */}
          <div className="flex flex-col gap-1.5">
            <CustomClassDropdown
              selectedClassFilter={selectedClassFilter}
              setSelectedClassFilter={setSelectedClassFilter}
              schoolClasses={schoolClasses}
              totalStudentsCount={students.length}
              schoolStudents={students}
            />

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search student..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-gray-200 rounded-xl pl-3 pr-7 py-1.5 focus:ring-1 focus:ring-violet-500 truncate"
              />
              {studentSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery("")}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          {/* Arrow Navigation & Student Selector Dropdown */}
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevStudent}
              disabled={filteredPreviewStudents.length === 0}
              className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-violet-50 text-gray-700 hover:text-violet-700 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
              title="Previous Student"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <CustomStudentDropdown
              previewStudentIndex={previewStudentIndex}
              setPreviewStudentIndex={setPreviewStudentIndex}
              filteredPreviewStudents={filteredPreviewStudents}
              schoolClasses={schoolClasses}
            />

            <button
              type="button"
              onClick={handleNextStudent}
              disabled={filteredPreviewStudents.length === 0}
              className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-violet-50 text-gray-700 hover:text-violet-700 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
              title="Next Student"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Photo Brightness Tool for Current Previewed Student */}
          {activePreviewStudent && (
            <button
              type="button"
              onClick={() => setEditingStudentForBrightness(activePreviewStudent)}
              className="w-full py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>☀️</span> Photo Brightness ({activePreviewStudent.name})
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Canvas Settings */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Canvas Size (mm)</h3>
            <div className="flex gap-3">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase font-bold">Width</label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWidthMm(val === "" ? 0 : parseFloat(val));
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block uppercase font-bold">Height</label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHeightMm(val === "" ? 0 : parseFloat(val));
                  }}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Background Upload */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Background Image</h3>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploading}
              />
              <div className={`w-full px-4 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${isUploading ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-violet-50/50 border-violet-200 hover:bg-violet-50 text-violet-600'
                }`}>
                {isUploading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-bold">{backgroundUrl ? 'Change Background' : 'Upload Image'}</span>
                  </>
                )}
              </div>
            </div>
            {backgroundUrl && (
              <button
                onClick={() => setBackgroundUrl("")}
                className="text-xs text-rose-500 font-semibold mt-2 hover:underline cursor-pointer"
              >
                Remove background
              </button>
            )}
          </div>

          {/* Add Fields */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">Add Fields</h4>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map((f: any) => (
                <button
                  key={f.key}
                  onClick={() => fields[f.key] ? handleRemoveField(f.key) : handleAddField(f.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${fields[f.key]
                      ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Field Formatting Controls (Text & Image options synced with ID Card Studio) */}
          {selectedFieldKey && selectedField && (
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-violet-200 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-violet-950 uppercase tracking-wider">
                    {availableFields.find((f: any) => f.key === selectedFieldKey)?.label || "Field"} Properties
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">In {editorUnit.toUpperCase()} mode</p>
                </div>
                <button onClick={() => setSelectedFieldKey(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">
                  ✕
                </button>
              </div>

              <div className="mb-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveField(selectedFieldKey); }}
                  className="w-full text-xs h-8 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border-0 shadow-none font-bold"
                >
                  <HugeiconsIcon icon={Delete01Icon} size={14} color="currentColor" />
                  <span className="ml-1">Remove Field</span>
                </Button>
              </div>

              {isSelectedImage ? (
                /* Image Editing Options */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase mb-1">
                        <span>Width ({editorUnit})</span>
                      </div>
                      {editorUnit === "mm" ? (
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={((selectedField.width || 100) / MM_TO_PX).toFixed(1)}
                          onChange={e => updateFieldProperty("width", Math.round((parseFloat(e.target.value) || 1) * MM_TO_PX))}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <input
                          type="number"
                          value={selectedField.width || 100}
                          onChange={e => updateFieldProperty("width", parseInt(e.target.value) || 100)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase mb-1">
                        <span>Height ({editorUnit})</span>
                      </div>
                      {editorUnit === "mm" ? (
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={((selectedField.height || 100) / MM_TO_PX).toFixed(1)}
                          onChange={e => updateFieldProperty("height", Math.round((parseFloat(e.target.value) || 1) * MM_TO_PX))}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <input
                          type="number"
                          value={selectedField.height || 100}
                          onChange={e => updateFieldProperty("height", parseInt(e.target.value) || 100)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        />
                      )}
                    </div>
                  </div>

                  {/* Photo Border & Corner Radius Controls */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                        <span>Photo Border Width ({editorUnit})</span>
                        <div className="flex items-center gap-1">
                          {editorUnit === "mm" ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={((selectedField.borderWidth || 0) / MM_TO_PX).toFixed(1)}
                              onChange={e => updateFieldProperty("borderWidth", Math.max(0, Math.round((parseFloat(e.target.value) || 0) * MM_TO_PX)))}
                              className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={selectedField.borderWidth || 0}
                              onChange={e => updateFieldProperty("borderWidth", parseInt(e.target.value) || 0)}
                              className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          )}
                          <span className="text-[9px] text-gray-400">{editorUnit}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={selectedField.borderWidth || 0}
                        onChange={e => updateFieldProperty("borderWidth", parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Photo Border Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={selectedField.borderColor || "#000000"}
                          onChange={e => updateFieldProperty("borderColor", e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border shadow-2xs bg-white"
                        />
                        <input
                          type="text"
                          value={selectedField.borderColor || "#000000"}
                          onChange={e => updateFieldProperty("borderColor", e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                        <span>Photo Corner Radius ({editorUnit})</span>
                        <div className="flex items-center gap-1">
                          {editorUnit === "mm" ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="50"
                              value={((typeof selectedField.borderRadius === "number" ? selectedField.borderRadius : parseFloat(selectedField.borderRadius || "0")) / MM_TO_PX).toFixed(1)}
                              onChange={e => updateFieldProperty("borderRadius", Math.max(0, Math.round((parseFloat(e.target.value) || 0) * MM_TO_PX)))}
                              className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={typeof selectedField.borderRadius === "number" ? selectedField.borderRadius : parseInt(selectedField.borderRadius || "0")}
                              onChange={e => updateFieldProperty("borderRadius", parseInt(e.target.value) || 0)}
                              className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          )}
                          <span className="text-[9px] text-gray-400">{editorUnit}</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={typeof selectedField.borderRadius === "number" ? selectedField.borderRadius : parseInt(selectedField.borderRadius || "0")}
                        onChange={e => updateFieldProperty("borderRadius", parseInt(e.target.value) || 0)}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                    </div>
                  </div>

                  {selectedFieldKey === "student_photo" && activePreviewStudent && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span>☀️ Photo Enhancement Tool</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Adjust photo brightness & contrast directly on the platform and save to server.
                      </p>
                      <button
                        type="button"
                        onClick={() => setEditingStudentForBrightness(activePreviewStudent)}
                        className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>☀️</span> Adjust Photo Brightness ({activePreviewStudent.name})
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Comprehensive Text Editing Options (Synced with ID Card Studio) */
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Font Family</label>
                    <select
                      value={selectedField.fontFamily || "Inter"}
                      onChange={e => updateFieldProperty("fontFamily", e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    >
                      {GOOGLE_FONTS.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Font Weight</label>
                    <select
                      value={selectedField.fontWeight || "500"}
                      onChange={e => updateFieldProperty("fontWeight", e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    >
                      {FONT_WEIGHTS.map(fw => (
                        <option key={fw.value} value={fw.value}>{fw.label} ({fw.value})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase mb-1">
                      <span>Font Size ({editorUnit})</span>
                      <div className="flex items-center gap-1">
                        {editorUnit === "mm" ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="40"
                            value={((selectedField.fontSize || 16) / MM_TO_PX).toFixed(1)}
                            onChange={e => updateFieldProperty("fontSize", Math.max(1, Math.round((parseFloat(e.target.value) || 1) * MM_TO_PX)))}
                            className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        ) : (
                          <input
                            type="number"
                            min="6"
                            max="300"
                            value={selectedField.fontSize || 16}
                            onChange={e => updateFieldProperty("fontSize", parseInt(e.target.value) || 16)}
                            className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        )}
                        <span className="text-[9px] text-gray-400">{editorUnit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="120"
                      value={selectedField.fontSize || 16}
                      onChange={e => updateFieldProperty("fontSize", parseInt(e.target.value) || 16)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Text Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={selectedField.color || "#000000"}
                        onChange={e => updateFieldProperty("color", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border shadow-2xs bg-white"
                      />
                      <input
                        type="text"
                        value={selectedField.color || "#000000"}
                        onChange={e => updateFieldProperty("color", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                      <span>Stroke Outline Width ({editorUnit})</span>
                      <div className="flex items-center gap-1">
                        {editorUnit === "mm" ? (
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={((selectedField.strokeWidth || 0) / MM_TO_PX).toFixed(1)}
                            onChange={e => updateFieldProperty("strokeWidth", Math.max(0, Math.round((parseFloat(e.target.value) || 0) * MM_TO_PX)))}
                            className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={selectedField.strokeWidth || 0}
                            onChange={e => updateFieldProperty("strokeWidth", parseInt(e.target.value) || 0)}
                            className="w-14 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        )}
                        <span className="text-[9px] text-gray-400">{editorUnit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={selectedField.strokeWidth || 0}
                      onChange={e => updateFieldProperty("strokeWidth", parseInt(e.target.value) || 0)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stroke Outline Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={selectedField.strokeColor || "#ffffff"}
                        onChange={e => updateFieldProperty("strokeColor", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border shadow-2xs bg-white"
                      />
                      <input
                        type="text"
                        value={selectedField.strokeColor || "#ffffff"}
                        onChange={e => updateFieldProperty("strokeColor", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Horizontal Alignment</label>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      {["left", "center", "right", "justify"].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateFieldProperty("align", align)}
                          className={`flex-1 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${(selectedField.align || "left") === align ? "bg-white text-violet-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Vertical Alignment</label>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      {["top", "center", "bottom"].map((vAlign) => (
                        <button
                          key={vAlign}
                          type="button"
                          onClick={() => updateFieldProperty("verticalAlign", vAlign)}
                          className={`flex-1 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${(selectedField.verticalAlign || "center") === vAlign ? "bg-white text-violet-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                          {vAlign}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Text / Address Line Format</label>
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateFieldProperty("addressFormat", "submitted")}
                        className={`py-1 px-1 text-[10px] font-semibold rounded-md transition-colors text-center ${!selectedField.addressFormat || selectedField.addressFormat === "submitted" ? "bg-white text-violet-600 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Multiline
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFieldProperty("addressFormat", "singleline_space")}
                        className={`py-1 px-1 text-[10px] font-semibold rounded-md transition-colors text-center ${selectedField.addressFormat === "singleline_space" || selectedField.addressFormat === "singleline" ? "bg-white text-violet-600 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Single (No Comma)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFieldProperty("addressFormat", "singleline_comma")}
                        className={`py-1 px-1 text-[10px] font-semibold rounded-md transition-colors text-center ${selectedField.addressFormat === "singleline_comma" ? "bg-white text-violet-600 shadow-2xs font-bold" : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Single (With Comma)
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={selectedField.labelVisible !== false}
                      onChange={(e) => updateFieldProperty("labelVisible", e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                    <span>Show Field Label Prefix</span>
                  </label>

                  {/* Dedicated Character Stretch Controls (Scale X & Scale Y) for text fields */}
                  <div className="pt-2 border-t border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Character Stretch Distortion</label>
                      {((selectedField.scaleX && selectedField.scaleX !== 1) || (selectedField.scaleY && selectedField.scaleY !== 1)) && (
                        <button
                          type="button"
                          onClick={() => {
                            updateFieldProperty("scaleX", 1);
                            updateFieldProperty("scaleY", 1);
                          }}
                          className="text-[10px] font-bold text-violet-600 hover:text-violet-800 underline cursor-pointer"
                        >
                          Reset Stretch (1.0x)
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                          <span>Horizontal (X)</span>
                          <span className="text-violet-600 font-extrabold">{(selectedField.scaleX || 1).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          step="0.05"
                          min="0.5"
                          max="3.0"
                          value={selectedField.scaleX || 1}
                          onChange={(e) => updateFieldProperty("scaleX", parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                          <span>Vertical (Y)</span>
                          <span className="text-violet-600 font-extrabold">{(selectedField.scaleY || 1).toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          step="0.05"
                          min="0.5"
                          max="3.0"
                          value={selectedField.scaleY || 1}
                          onChange={(e) => updateFieldProperty("scaleY", parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Box Dimensions ({editorUnit})</label>
                      {(selectedField.width !== undefined || selectedField.height !== undefined) && (
                        <button
                          type="button"
                          onClick={() => {
                            updateFieldProperty("width", undefined);
                            updateFieldProperty("height", undefined);
                            updateFieldProperty("scaleX", undefined);
                            updateFieldProperty("scaleY", undefined);
                          }}
                          className="text-[10px] font-bold text-violet-600 hover:underline cursor-pointer"
                        >
                          Auto Reset
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block mb-0.5">Width</span>
                        {editorUnit === "mm" ? (
                          <input
                            type="number"
                            step="0.1"
                            value={selectedField.width ? ((selectedField.width) / MM_TO_PX).toFixed(1) : ""}
                            placeholder="Auto"
                            onChange={e => updateFieldProperty("width", e.target.value ? Math.round(parseFloat(e.target.value) * MM_TO_PX) : undefined)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold"
                          />
                        ) : (
                          <input
                            type="number"
                            value={selectedField.width || ""}
                            placeholder="Auto"
                            onChange={e => updateFieldProperty("width", e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold"
                          />
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold block mb-0.5">Height</span>
                        {editorUnit === "mm" ? (
                          <input
                            type="number"
                            step="0.1"
                            value={selectedField.height ? ((selectedField.height) / MM_TO_PX).toFixed(1) : ""}
                            placeholder="Auto"
                            onChange={e => updateFieldProperty("height", e.target.value ? Math.round(parseFloat(e.target.value) * MM_TO_PX) : undefined)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold"
                          />
                        ) : (
                          <input
                            type="number"
                            value={selectedField.height || ""}
                            placeholder="Auto"
                            onChange={e => updateFieldProperty("height", e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-2 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
          <Button onClick={() => setShowPrintView(true)} variant="outline" className="w-full flex items-center justify-center gap-2">
            <HugeiconsIcon icon={PrinterIcon} size={16} color="currentColor" />
            Print
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner flex flex-col">
        {/* Toolbar Header (Scale Ruler, Grid Overlay, Unit Toggle, Snap Threshold, Zoom) */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
          {/* Studio Canvas Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRulerScale(!showRulerScale)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${showRulerScale
                  ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              title="Toggle Alignment Scale Ruler in mm/px"
            >
              📏 Scale ({editorUnit})
            </button>

            <button
              type="button"
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${showGridOverlay
                  ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              title="Toggle Grid Overlay"
            >
              🌐 Grid
            </button>

            {/* Unit Mode Selector (mm / px) */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setEditorUnit("mm")}
                className={`px-2 py-0.5 text-xs font-extrabold rounded-md transition-all cursor-pointer ${editorUnit === "mm" ? "bg-violet-600 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                mm
              </button>
              <button
                type="button"
                onClick={() => setEditorUnit("px")}
                className={`px-2 py-0.5 text-xs font-extrabold rounded-md transition-all cursor-pointer ${editorUnit === "px" ? "bg-violet-600 text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                px
              </button>
            </div>

            {/* Configurable Magnetic Snap Distance */}
            <div
              className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-lg shadow-2xs"
              title={`Magnetic snap distance threshold in ${editorUnit}. Set to 0 to turn off snapping.`}
            >
              <span className="select-none">🧲 Snap:</span>
              {editorUnit === "mm" ? (
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={(snapThreshold / MM_TO_PX).toFixed(1)}
                  onChange={(e) => {
                    const mmVal = parseFloat(e.target.value || "0");
                    setSnapThreshold(Math.max(0, Math.round(mmVal * MM_TO_PX)));
                  }}
                  className="w-12 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              ) : (
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={snapThreshold}
                  onChange={(e) => setSnapThreshold(Math.max(0, parseInt(e.target.value || "0", 10)))}
                  className="w-12 px-1 py-0.5 text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              )}
              <span className="text-[10px] text-gray-400">{editorUnit}</span>
            </div>

            {(userXGuides.length > 0 || userYGuides.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setUserXGuides([]);
                  setUserYGuides([]);
                }}
                className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer select-none"
                title="Clear all alignment guide lines"
              >
                🗑️ Clear ({userXGuides.length + userYGuides.length})
              </button>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.1, s - 0.1))}>-</Button>
            <span className="text-xs font-semibold w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setScale(s => s + 0.1)}>+</Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const containerWidth = containerRef.current?.clientWidth || canvasWidthPx;
              const containerHeight = containerRef.current?.clientHeight || canvasHeightPx;
              setScale(Math.max(0.1, Math.min((containerWidth - 64) / canvasWidthPx, (containerHeight - 64) / canvasHeightPx, 1)));
            }}>Fit Screen</Button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-auto relative p-8" ref={containerRef}>
          <div className="flex flex-col items-start gap-6">

            {/* Scale Rulers + Canvas Wrapper */}
            <div className="flex flex-col items-start">
              {/* Top Horizontal Scale Ruler */}
              {showRulerScale && (
                <div className="flex items-end select-none">
                  <div className="w-6 h-5 bg-slate-200 border border-slate-300 rounded-tl-lg flex items-center justify-center text-[8px] font-extrabold text-slate-700 shrink-0">
                    {editorUnit}
                  </div>
                  <div
                    ref={topRulerRef}
                    onMouseDown={(e) => handleStartDragXGuide(e, -1)}
                    className="h-5 bg-slate-100 border-t border-r border-b border-slate-300 relative overflow-hidden select-none cursor-col-resize group"
                    style={{ width: `${canvasWidthPx * scale}px` }}
                    title="Click and drag horizontally from scale to place vertical guide line at any position"
                  >
                    {Array.from({ length: Math.floor(widthMm / 10) + 1 }, (_, i) => i * 10)
                      .concat(widthMm % 10 !== 0 ? [widthMm] : [])
                      .map((mmVal) => {
                        const pct = (mmVal / widthMm) * 100;
                        const pxVal = Math.round((mmVal / widthMm) * canvasWidthPx);
                        const hasGuide = userXGuides.includes(pxVal);

                        return (
                          <div
                            key={`top-tick-${mmVal}`}
                            onMouseDown={(e) => handleStartDragXGuide(e, hasGuide ? pxVal : -1)}
                            className={`absolute top-0 bottom-0 border-l transition-colors hover:bg-violet-200/60 cursor-col-resize ${hasGuide ? "border-rose-500 border-l-2" : "border-slate-350"
                              }`}
                            style={{ left: `${pct}%` }}
                            title={`Drag to move or place ${editorUnit === "mm" ? `${mmVal}mm` : `${pxVal}px`} vertical guide line`}
                          >
                            <span className={`absolute top-0 left-0.5 text-[7.5px] font-bold leading-none ${hasGuide ? "text-rose-600 font-extrabold" : "text-slate-600"
                              }`}>
                              {editorUnit === "mm" ? mmVal : pxVal}
                            </span>
                          </div>
                        );
                      })}

                    {selectedFieldKey && fields[selectedFieldKey] && (
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-violet-600 z-10 pointer-events-none"
                        style={{ left: `${((fields[selectedFieldKey].x || 0) / canvasWidthPx) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start">
                {/* Left Vertical Scale Ruler */}
                {showRulerScale && (
                  <div
                    ref={leftRulerRef}
                    onMouseDown={(e) => handleStartDragYGuide(e, -1)}
                    className="w-6 bg-slate-100 border-l border-b border-r border-slate-300 relative overflow-hidden shrink-0 select-none rounded-bl-lg cursor-row-resize group"
                    style={{ height: `${canvasHeightPx * scale}px` }}
                    title="Click and drag vertically from scale to place horizontal guide line at any position"
                  >
                    {Array.from({ length: Math.floor(heightMm / 10) + 1 }, (_, i) => i * 10)
                      .concat(heightMm % 10 !== 0 ? [heightMm] : [])
                      .map((mmVal) => {
                        const pct = (mmVal / heightMm) * 100;
                        const pxVal = Math.round((mmVal / heightMm) * canvasHeightPx);
                        const hasGuide = userYGuides.includes(pxVal);

                        return (
                          <div
                            key={`left-tick-${mmVal}`}
                            onMouseDown={(e) => handleStartDragYGuide(e, hasGuide ? pxVal : -1)}
                            className={`absolute left-0 right-0 border-t transition-colors hover:bg-violet-200/60 cursor-row-resize ${hasGuide ? "border-rose-500 border-t-2" : "border-slate-350"
                              }`}
                            style={{ top: `${pct}%` }}
                            title={`Drag to move or place ${editorUnit === "mm" ? `${mmVal}mm` : `${pxVal}px`} horizontal guide line`}
                          >
                            <span className={`absolute left-0.5 top-0.5 text-[7px] font-bold leading-none ${hasGuide ? "text-rose-600 font-extrabold" : "text-slate-600"
                              }`}>
                              {editorUnit === "mm" ? mmVal : pxVal}
                            </span>
                          </div>
                        );
                      })}

                    {selectedFieldKey && fields[selectedFieldKey] && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-violet-600 z-10 pointer-events-none"
                        style={{ top: `${((fields[selectedFieldKey].y || 0) / canvasHeightPx) * 100}%` }}
                      />
                    )}
                  </div>
                )}

                {/* Main Canvas Node */}
                <div
                  className="relative bg-white shadow-2xl transition-transform origin-top-left border border-gray-300"
                  style={{
                    width: `${canvasWidthPx}px`,
                    height: `${canvasHeightPx}px`,
                    transform: `scale(${scale})`,
                    marginBottom: `${Math.max(0, canvasHeightPx * scale - canvasHeightPx)}px`,
                    marginRight: `${Math.max(0, canvasWidthPx * scale - canvasWidthPx)}px`
                  }}
                  onClick={() => setSelectedFieldKey(null)}
                >
                  {/* Grid Overlay */}
                  {showGridOverlay && (
                    <div
                      className="absolute inset-0 pointer-events-none z-40 opacity-25"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(124, 58, 237, 0.4) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(124, 58, 237, 0.4) 1px, transparent 1px)
                        `,
                        backgroundSize: `25px 25px`,
                      }}
                    />
                  )}

                  {backgroundUrl && (
                    <Image src={backgroundUrl} alt="Background" fill className="object-fill pointer-events-none" unoptimized />
                  )}

                  {/* Live Dragging Guide Line Indicator */}
                  {activeGuideDrag && (
                    <div
                      className={`absolute border-rose-500 z-50 pointer-events-none ${activeGuideDrag.type === "x"
                          ? "top-0 bottom-0 border-l-2 border-dashed w-0 h-full"
                          : "left-0 right-0 border-t-2 border-dashed h-0 w-full"
                        }`}
                      style={{
                        left: activeGuideDrag.type === "x" ? `${activeGuideDrag.currentPx}px` : 0,
                        top: activeGuideDrag.type === "y" ? `${activeGuideDrag.currentPx}px` : 0,
                      }}
                    >
                      <span className="bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md absolute top-2 left-2 whitespace-nowrap shadow-md">
                        📍 {editorUnit === "mm" ? `${activeGuideDrag.currentMm}mm` : `${activeGuideDrag.currentPx}px`}
                      </span>
                    </div>
                  )}

                  {/* Vertical User Alignment Guide Lines */}
                  {userXGuides.map((xVal, idx) => {
                    const labelStr = editorUnit === "mm" ? `${((xVal / canvasWidthPx) * widthMm).toFixed(1)}mm` : `${xVal}px`;
                    return (
                      <div
                        key={`v-guide-${idx}`}
                        onMouseDown={(e) => handleStartDragXGuide(e, xVal)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserXGuides((prev) => prev.filter((g) => g !== xVal));
                        }}
                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-rose-500 z-50 cursor-col-resize group"
                        style={{ left: `${xVal}px`, width: "0px", height: "100%" }}
                        title={`Drag to reposition or click to remove ${labelStr} vertical guide line`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 bg-rose-600 text-white text-[9px] font-bold px-1 rounded absolute top-2 left-1 whitespace-nowrap shadow-xs pointer-events-none">
                          {labelStr}
                        </span>
                      </div>
                    );
                  })}

                  {/* Horizontal User Alignment Guide Lines */}
                  {userYGuides.map((yVal, idx) => {
                    const labelStr = editorUnit === "mm" ? `${((yVal / canvasHeightPx) * heightMm).toFixed(1)}mm` : `${yVal}px`;
                    return (
                      <div
                        key={`h-guide-${idx}`}
                        onMouseDown={(e) => handleStartDragYGuide(e, yVal)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserYGuides((prev) => prev.filter((g) => g !== yVal));
                        }}
                        className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500 z-50 cursor-row-resize group"
                        style={{ top: `${yVal}px`, height: "0px", width: "100%" }}
                        title={`Drag to reposition or click to remove ${labelStr} horizontal guide line`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 bg-rose-600 text-white text-[9px] font-bold px-1 rounded absolute left-2 top-1 whitespace-nowrap shadow-xs pointer-events-none">
                          {labelStr}
                        </span>
                      </div>
                    );
                  })}

                  {/* Live Dynamic Smart Alignment Lines while Dragging */}
                  {dragState && (() => {
                    const { xLines, yLines } = getActiveSnapLines();
                    return (
                      <>
                        {xLines.map((l, idx) => (
                          <div
                            key={`active-snap-x-${idx}`}
                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-violet-600 z-40 pointer-events-none shadow-md"
                            style={{ left: `${l.pos}px`, width: "0px", height: "100%" }}
                          >
                            <span className="bg-violet-600 text-white text-[9px] font-extrabold px-1 rounded absolute top-1 left-1 whitespace-nowrap shadow-xs">
                              {l.label}
                            </span>
                          </div>
                        ))}

                        {yLines.map((l, idx) => (
                          <div
                            key={`active-snap-y-${idx}`}
                            className="absolute left-0 right-0 border-t-2 border-dashed border-violet-600 z-40 pointer-events-none shadow-md"
                            style={{ top: `${l.pos}px`, height: "0px", width: "100%" }}
                          >
                            <span className="bg-violet-600 text-white text-[9px] font-extrabold px-1 rounded absolute left-1 top-1 whitespace-nowrap shadow-xs">
                              {l.label}
                            </span>
                          </div>
                        ))}
                      </>
                    );
                  })()}

                  {/* Placed Fields */}
                  {Object.entries(fields).map(([key, f]: [string, any]) => {
                    const fieldInfo = availableFields.find((af: any) => af.key === key);
                    if (!fieldInfo) return null;

                    return (
                      <StudioDraggableField
                        key={key}
                        fieldKey={key}
                        f={f}
                        scale={scale}
                        fieldInfo={fieldInfo}
                        isSelected={selectedFieldKey === key}
                        setSelectedFieldKey={setSelectedFieldKey}
                        handleDragStop={handleDragStop}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        handleFieldResize={handleFieldResize}
                        activePreviewStudent={activePreviewStudent}
                        schoolName={schoolName}
                        school={school}
                        onBoundsUpdate={handleBoundsUpdate}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Image Enhancer Modal */}
      <ImageEnhancerModal
        isOpen={!!editingStudentForBrightness}
        onClose={() => setEditingStudentForBrightness(null)}
        student={editingStudentForBrightness}
        onPhotoUpdated={() => {
          // Photo updated
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// DRAGGABLE FIELD COMPONENT
// ----------------------------------------------------------------------

function StudioDraggableField({
  fieldKey,
  f,
  scale,
  fieldInfo,
  isSelected,
  setSelectedFieldKey,
  handleDragStop,
  onDragStart,
  onDragMove,
  handleFieldResize,
  activePreviewStudent,
  schoolName,
  school,
  onBoundsUpdate
}: any) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      const w = innerRef.current.offsetWidth || f.width || 100;
      const h = innerRef.current.offsetHeight || f.height || 30;
      onBoundsUpdate?.(fieldKey, w, h);
    }
  });

  const handleStyle = {
    background: '#8b5cf6', // violet-500
    border: '1px solid white',
    boxShadow: '0 0 2px rgba(0,0,0,0.3)'
  };

  const resizeHandleStyles = {
    bottomRight: { ...handleStyle, width: '10px', height: '10px', right: '-5px', bottom: '-5px', cursor: 'se-resize' },
    bottomLeft: { ...handleStyle, width: '10px', height: '10px', left: '-5px', bottom: '-5px', cursor: 'sw-resize' },
    topRight: { ...handleStyle, width: '10px', height: '10px', right: '-5px', top: '-5px', cursor: 'ne-resize' },
    topLeft: { ...handleStyle, width: '10px', height: '10px', left: '-5px', top: '-5px', cursor: 'nw-resize' },
    top: { ...handleStyle, width: '16px', height: '8px', left: '50%', top: '-4px', transform: 'translateX(-50%)', cursor: 'n-resize' },
    bottom: { ...handleStyle, width: '16px', height: '8px', left: '50%', bottom: '-4px', transform: 'translateX(-50%)', cursor: 's-resize' },
    left: { ...handleStyle, width: '8px', height: '16px', top: '50%', left: '-4px', transform: 'translateY(-50%)', cursor: 'w-resize' },
    right: { ...handleStyle, width: '8px', height: '16px', top: '50%', right: '-4px', transform: 'translateY(-50%)', cursor: 'e-resize' },
  };

  const imgBorderW = typeof f.borderWidth === "number" ? f.borderWidth : (parseInt(f.borderWidth || "0", 10) || 0);
  const imgBorderC = f.borderColor || "#000000";
  const imgRadius = f.borderRadius ? (typeof f.borderRadius === "number" ? `${f.borderRadius}px` : f.borderRadius) : "0";

  const imgStyle: React.CSSProperties = {
    borderRadius: imgRadius,
    border: imgBorderW > 0 ? `${imgBorderW}px solid ${imgBorderC}` : undefined,
    boxSizing: "border-box",
  };

  let displayContent: React.ReactNode = "";
  if (fieldKey === "school_logo") {
    const logoUrl = school?.logoUrl;
    displayContent = logoUrl ? (
      <img src={logoUrl} alt="Logo" style={imgStyle} className="w-full h-full object-contain pointer-events-none" />
    ) : (
      <div style={imgStyle} className="w-full h-full border flex flex-col items-center justify-center text-[10px] font-bold text-slate-400">
        <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span>School Logo</span>
      </div>
    );
  } else if (fieldKey === "student_photo") {
    const photoUrl = activePreviewStudent?.profilePictureUrl || DUMMY_STUDENT.profilePictureUrl;
    displayContent = (
      <img src={photoUrl} alt="Photo" style={imgStyle} className="w-full h-full object-cover pointer-events-none" />
    );
  } else if (fieldKey === "school_signature") {
    const sigUrl = school?.signatureUrl;
    displayContent = sigUrl ? (
      <img src={sigUrl} alt="Signature" style={imgStyle} className="w-full h-full object-contain pointer-events-none" />
    ) : (
      <div style={imgStyle} className="w-full h-full border flex flex-col items-center justify-center text-[10px] font-bold text-slate-400">
        <span>Principal Signature</span>
      </div>
    );
  } else {
    let label = "";
    let val = "";
    let customVals = activePreviewStudent?.customValues;
    if (typeof customVals === "string") {
      try { customVals = JSON.parse(customVals); } catch { customVals = null; }
    }

    if (fieldKey === "school_name") val = school?.name || schoolName || "School Name";
    else if (fieldKey === "school_caption") val = school?.caption || "School Caption";
    else if (fieldKey === "school_address") val = school?.address || "School Address";
    else if (fieldKey === "school_phone") val = school?.phone || "School Phone";
    else if (fieldKey === "student_name") val = activePreviewStudent?.name || "Student Name";
    else if (fieldKey === "student_class") { val = activePreviewStudent?.classNameStr || activePreviewStudent?.className || activePreviewStudent?.class?.name || "Demo Class"; label = "Class: "; }
    else if (fieldKey === "student_fatherName") { val = activePreviewStudent?.fatherName || "Father Name"; label = "Father: "; }
    else if (fieldKey === "student_motherName") { val = activePreviewStudent?.motherName || customVals?.motherName || customVals?.mother_name || "Mother Name"; label = "Mother: "; }
    else if (fieldKey === "student_fatherPhone") { val = activePreviewStudent?.fatherPhone || "Father Phone"; label = "Cell: "; }
    else if (fieldKey === "student_motherPhone") { val = activePreviewStudent?.motherPhone || customVals?.motherPhone || customVals?.mother_phone || "Mother Phone"; label = "Cell: "; }
    else if (fieldKey === "student_address") { val = activePreviewStudent?.address || "Student Address"; label = "Address: "; }
    else if (fieldKey === "student_idNo") { val = activePreviewStudent?.idNo || "ID-123"; label = "ID No: "; }
    else if (fieldKey === "student_camSno") { val = activePreviewStudent?.camSno || "CAM-123"; label = "CAM S.No: "; }
    else if (fieldKey.startsWith("student_custom_")) {
      const key = fieldKey.replace("student_custom_", "");
      val = customVals?.[key] || `[${key}]`;
      label = `${key.charAt(0).toUpperCase() + key.slice(1)}: `;
    } else if (fieldKey.startsWith("school_custom_")) {
      const key = fieldKey.replace("school_custom_", "");
      val = `[${key}]`;
      label = `${key.charAt(0).toUpperCase() + key.slice(1)}: `;
    } else if (fieldKey.startsWith("class_custom_")) {
      const key = fieldKey.replace("class_custom_", "");
      val = `[${key}]`;
      label = `${key.charAt(0).toUpperCase() + key.slice(1)}: `;
    }

    const isSingleLine = f.addressFormat === "singleline_space" || f.addressFormat === "singleline_comma" || f.addressFormat === "singleline";
    if (isSingleLine && typeof val === "string") {
      if (f.addressFormat === "singleline_comma") {
        val = val.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ",").trim();
      } else {
        val = val.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
      }
    }

    const isAddr = (fieldKey === "school_address" || fieldKey === "student_address") && !isSingleLine;
    const isMulti = isAddr || fieldKey === "school_name" || fieldKey === "school_caption";

    displayContent = (
      <div
        className={`leading-tight select-none overflow-hidden w-full ${f.width ? (isSingleLine ? "whitespace-normal break-words" : "whitespace-pre-line break-words") : isAddr ? "whitespace-pre-line break-words" : isMulti ? "whitespace-normal break-words" : "whitespace-nowrap"}`}
        style={{ textAlign: (f.align || "left") as React.CSSProperties["textAlign"] }}
      >
        {f.labelVisible !== false && label ? <span className="font-bold opacity-80 mr-1">{label}</span> : null}
        <span className={isAddr || (f.width && !isSingleLine) ? "whitespace-pre-line break-words" : ""}>{val}</span>
      </div>
    );
  }

  return (
    <Rnd
      bounds="parent"
      position={{ x: f.x || 0, y: f.y || 0 }}
      size={{ width: f.width || 'auto', height: f.height || 'auto' }}
      scale={scale}
      onDragStart={(e, data) => onDragStart && onDragStart(fieldKey, data.x, data.y, innerRef.current?.offsetWidth || 0, innerRef.current?.offsetHeight || 0)}
      onDrag={(e, data) => onDragMove && onDragMove(fieldKey, data.x, data.y, innerRef.current?.offsetWidth || 0, innerRef.current?.offsetHeight || 0)}
      onDragStop={(e, data) => handleDragStop(fieldKey, data.x, data.y)}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newW = parseInt(ref.style.width, 10);
        const newH = parseInt(ref.style.height, 10);
        handleFieldResize && handleFieldResize(fieldKey, newW, newH, f.scaleX || 1, f.scaleY || 1, position.x, position.y);
      }}
      resizeHandleStyles={resizeHandleStyles}
      className={`absolute flex items-center justify-center ${isSelected ? 'ring-2 ring-violet-500 shadow-md z-50' : 'ring-1 ring-transparent hover:ring-gray-300 hover:ring-dashed z-10'}`}
      enableResizing={isSelected}
      style={{ padding: 0 }}
    >
      <div
        ref={innerRef}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFieldKey(fieldKey);
        }}
        className="w-full h-full flex flex-col cursor-move select-none"
        style={{
          justifyContent: f.verticalAlign === "top" ? "flex-start" : f.verticalAlign === "bottom" ? "flex-end" : "center",
          alignItems: f.align === "center" ? "center" : f.align === "right" ? "flex-end" : f.align === "justify" ? "stretch" : "flex-start",
          width: fieldInfo.isImage ? '100%' : (f.width ? `${f.width}px` : 'max-content'),
          height: fieldInfo.isImage ? '100%' : (f.height ? `${f.height}px` : 'max-content'),
          fontSize: `${f.fontSize || 16}px`,
          color: f.color || "#000000",
          fontFamily: `'${f.fontFamily || "Inter"}', sans-serif`,
          fontWeight: f.fontWeight || "500",
          textAlign: (f.align || "left") as React.CSSProperties["textAlign"],
          background: fieldInfo.isImage ? 'rgba(0,0,0,0.05)' : 'transparent',
          border: fieldInfo.isImage && imgBorderW > 0 ? `${imgBorderW}px solid ${imgBorderC}` : (fieldInfo.isImage && !isSelected ? '1px dashed #cbd5e1' : 'none'),
          borderRadius: fieldInfo.isImage ? imgRadius : undefined,
          boxSizing: "border-box",
          overflow: "hidden",
          transform: fieldInfo.isImage ? 'none' : `scale(${f.scaleX || 1}, ${f.scaleY || 1})`,
          transformOrigin: 'top left',
          WebkitTextStroke: !fieldInfo.isImage && f.strokeWidth ? `${f.strokeWidth}px ${f.strokeColor || "#ffffff"}` : undefined,
          paintOrder: !fieldInfo.isImage && f.strokeWidth ? "stroke fill" : undefined,
        }}
      >
        {displayContent}
      </div>
    </Rnd>
  );
}

// ----------------------------------------------------------------------
// PRINT VIEW COMPONENT
// ----------------------------------------------------------------------

function DocumentPrintView({ students, widthMm, heightMm, backgroundUrl, fields, onBack }: any) {
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    paperSize: "A4",
    paperOrientation: "portrait",
    documentHorizontal: false,
    gapX: 2,
    gapY: 2,
  });

  const printGrid = useMemo(() => {
    return calculatePrintGridMm(printSettings, widthMm, heightMm, 2);
  }, [printSettings, widthMm, heightMm]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-root, #print-root * { visibility: visible; }
        #print-root { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
        @page { size: ${printGrid.paperWMm}mm ${printGrid.paperHMm}mm; margin: 0mm; }
        .no-print { display: none !important; }
        .sheet {
          position: relative;
          width: ${printGrid.paperWMm}mm;
          height: ${printGrid.paperHMm}mm;
          page-break-after: always;
          overflow: hidden;
          background: white !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [printGrid]);

  const handlePrint = () => {
    window.print();
  };

  const [isGeneratingCmyk, setIsGeneratingCmyk] = useState(false);

  const handleDownloadCmyk = async () => {
    setIsGeneratingCmyk(true);
    try {
      const h2iMod = await import("html-to-image");
      const jsPDFMod = await import("jspdf");

      const { toPng } = h2iMod;
      const jsPDF = jsPDFMod.default || (jsPDFMod as any).jsPDF;

      // Determine orientation based on aspect ratio so jsPDF never auto-swaps width & height
      const pdfOrientation = printGrid.paperWMm > printGrid.paperHMm ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: "mm",
        format: [printGrid.paperWMm, printGrid.paperHMm],
      });

      const sheets = document.querySelectorAll('.sheet');

      for (let i = 0; i < sheets.length; i++) {
        const el = sheets[i] as HTMLElement;
        const dataUrl = await toPng(el, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });

        if (i > 0) pdf.addPage([printGrid.paperWMm, printGrid.paperHMm], pdfOrientation);
        pdf.addImage(dataUrl, "PNG", 0, 0, printGrid.paperWMm, printGrid.paperHMm, undefined, "FAST", 0);
      }

      const { PDFDocument, PDFName } = await import("pdf-lib");
      const pdfBytes = pdf.output("arraybuffer");
      const pdfDoc = await PDFDocument.load(pdfBytes);

      try {
        const iccRes = await fetch("/icc/default_cmyk.icc");
        if (iccRes.ok) {
          const iccProfile = await iccRes.arrayBuffer();
          const iccStream = pdfDoc.context.stream(new Uint8Array(iccProfile), {
            Length: iccProfile.byteLength,
          });
          const iccRef = pdfDoc.context.register(iccStream);

          const outputIntent = pdfDoc.context.obj({
            Type: PDFName.of("OutputIntent"),
            S: PDFName.of("GTS_PDFX"),
            OutputConditionIdentifier: "Fogra39",
            DestOutputProfile: iccRef,
          });

          pdfDoc.catalog.set(
            PDFName.of("OutputIntents"),
            pdfDoc.context.obj([outputIntent])
          );
        }
      } catch (e) {
        console.warn("Could not inject ICC profile, continuing without it.");
      }

      const finalPdfBytes = await pdfDoc.save();

      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        toast.loading("Sending to local printer...");
        try {
          await (window as any).electronAPI.printPdf(Array.from(finalPdfBytes));
          toast.dismiss();
          toast.success("Sent to local printer successfully!");
        } catch (e: any) {
          console.error("Print failed:", e);
          toast.dismiss();
          toast.error("Local print failed: " + e.message);
        }
      } else {
        const blob = new Blob([finalPdfBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "Document_CMYK.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CMYK PDF.");
    } finally {
      setIsGeneratingCmyk(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-full pb-20">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Print Preview</h2>
            <p className="text-sm text-gray-500">
              {students.length} documents to print
              {!printGrid.fits && <span className="text-rose-500 font-bold ml-2">Error: Paper size too small.</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleDownloadCmyk} disabled={isGeneratingCmyk} className="bg-black hover:bg-gray-800 text-white">
            <span className="ml-2">{isGeneratingCmyk ? "Generating CMYK..." : "Download CMYK PDF"}</span>
          </Button>
          <Button onClick={handlePrint} className="bg-violet-600 hover:bg-violet-700 text-white">
            <HugeiconsIcon icon={PrinterIcon} size={16} color="currentColor" />
            <span className="ml-2">Print Documents</span>
          </Button>
        </div>
      </div>

      <PrintSettingsPanel
        settings={printSettings}
        onChange={setPrintSettings}
        showDocumentOrientation={true}
        showPaperOrientation={false}
      />

      <div id="print-root" className="flex flex-col items-center gap-8 py-8 w-full max-w-full overflow-x-auto">
        {!printGrid.fits && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl max-w-xl text-center shadow-sm">
            <strong>Paper size is too small</strong> to fit the document. Please select a larger paper size or change orientation.
          </div>
        )}

        {printGrid.fits && Array.from({ length: Math.ceil(students.length / Math.max(1, printGrid.itemsPerPage)) }).map((_, sheetIdx) => {
          const sheetStudents = students.slice(sheetIdx * printGrid.itemsPerPage, (sheetIdx + 1) * printGrid.itemsPerPage);
          return (
            <div
              key={`sheet-${sheetIdx}`}
              className="sheet bg-white shadow-2xl relative"
              style={{
                width: `${printGrid.paperWMm}mm`,
                height: `${printGrid.paperHMm}mm`,
              }}
            >
              {sheetStudents.map((student: any, i: number) => {
                const col = i % printGrid.cols;
                const row = Math.floor(i / printGrid.cols);
                const actualGapX = printSettings.gapX ?? 2;
                const actualGapY = printSettings.gapY ?? 2;
                const xMm = printGrid.offsetX + col * (printGrid.docW + actualGapX);
                const yMm = printGrid.offsetY + row * (printGrid.docH + actualGapY);

                const isRotated = printSettings.documentHorizontal;
                const docWrapperWidth = isRotated ? printGrid.docH : printGrid.docW;
                const docWrapperHeight = isRotated ? printGrid.docW : printGrid.docH;
                const transform = isRotated ? `translate(${(printGrid.docW - docWrapperWidth) / 2}mm, ${(printGrid.docH - docWrapperHeight) / 2}mm) rotate(-90deg)` : 'none';

                return (
                  <div
                    key={student.id || i}
                    style={{
                      position: "absolute",
                      left: `${xMm}mm`,
                      top: `${yMm}mm`,
                      width: `${printGrid.docW}mm`,
                      height: `${printGrid.docH}mm`,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="relative bg-white border-[0.5px] border-gray-300 box-border"
                      style={{
                        width: `${docWrapperWidth}mm`,
                        height: `${docWrapperHeight}mm`,
                        transform: transform,
                        transformOrigin: "center center",
                      }}
                    >
                      {backgroundUrl && (
                        <Image src={backgroundUrl} alt="Background" fill className="object-fill" unoptimized priority />
                      )}

                      {Object.entries(fields).map(([key, f]: [string, any]) => {
                        if (!f || !f.visible) return null;

                        let content: React.ReactNode = null;
                        let labelStr = "";

                        if (key === "student_name") content = student.name;
                        else if (key === "student_class") { content = student.classNameStr || student.className || student.class?.name || "-"; labelStr = "Class: "; }
                        else if (key === "student_camSno") { content = student.camSno || "-"; labelStr = "CAM S.No: "; }
                        else if (key === "student_idNo") { content = student.idNo || "-"; labelStr = "ID No: "; }
                        else if (key === "student_fatherName") { content = student.fatherName || "-"; labelStr = "Father: "; }
                        else if (key === "student_motherName") { content = student.motherName || "-"; labelStr = "Mother: "; }
                        else if (key === "student_fatherPhone") { content = student.fatherPhone || "-"; labelStr = "Cell: "; }
                        else if (key === "student_motherPhone") { content = student.motherPhone || "-"; labelStr = "Cell: "; }
                        else if (key === "student_address") { content = student.address || "-"; labelStr = "Address: "; }
                        else if (key === "school_name") content = student.school?.name || "-";
                        else if (key === "school_caption") content = student.school?.caption || "-";
                        else if (key === "school_address") content = student.school?.address || "-";
                        else if (key === "school_phone") content = student.school?.phone || "-";
                        else if (key === "school_logo" && student.school?.logoUrl) {
                          content = <Image src={student.school.logoUrl} alt="Logo" fill className="object-contain" unoptimized />;
                        } else if (key === "school_signature" && student.school?.signatureUrl) {
                          content = <Image src={student.school.signatureUrl} alt="Signature" fill className="object-contain" unoptimized />;
                        } else if (key === "student_photo" && student.profilePictureUrl) {
                          content = <Image src={student.profilePictureUrl} alt="Photo" fill className="object-cover" unoptimized />;
                        } else if (key.startsWith("student_custom_")) {
                          const customKey = key.replace("student_custom_", "");
                          const values = typeof student.customValues === 'string' ? JSON.parse(student.customValues || '{}') : (student.customValues || {});
                          content = values[customKey] || "-";
                          labelStr = `${customKey.charAt(0).toUpperCase() + customKey.slice(1)}: `;
                        } else if (key.startsWith("school_custom_")) {
                          const customKey = key.replace("school_custom_", "");
                          const values = typeof student.school?.customValues === 'string' ? JSON.parse(student.school.customValues || '{}') : (student.school?.customValues || {});
                          content = values[customKey] || "-";
                          labelStr = `${customKey.charAt(0).toUpperCase() + customKey.slice(1)}: `;
                        } else if (key.startsWith("class_custom_")) {
                          const customKey = key.replace("class_custom_", "");
                          const values = typeof student.class?.customValues === 'string' ? JSON.parse(student.class.customValues || '{}') : (student.class?.customValues || {});
                          content = values[customKey] || "-";
                          labelStr = `${customKey.charAt(0).toUpperCase() + customKey.slice(1)}: `;
                        }

                        const isPrintSingleLine = f.addressFormat === "singleline_space" || f.addressFormat === "singleline_comma" || f.addressFormat === "singleline";
                        if (isPrintSingleLine && typeof content === "string") {
                          if (f.addressFormat === "singleline_comma") {
                            content = content.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ",").trim();
                          } else {
                            content = content.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
                          }
                        }

                        if (!content) return null;

                        const isImage = key === "school_logo" || key === "student_photo" || key === "school_signature";

                        return (
                          <div
                            key={key}
                            className="absolute"
                            style={{
                              left: `${f.x}px`,
                              top: `${f.y}px`,
                              width: isImage ? `${f.width || 100}px` : (f.width ? `${f.width}px` : 'auto'),
                              height: isImage ? `${f.height || 100}px` : (f.height ? `${f.height}px` : 'auto'),
                              fontSize: isImage ? undefined : `${f.fontSize || 16}px`,
                              color: f.color || "#000000",
                              fontFamily: `'${f.fontFamily || "Inter"}', sans-serif`,
                              fontWeight: f.fontWeight || "500",
                              textAlign: (f.align || "left") as React.CSSProperties["textAlign"],
                              whiteSpace: f.width ? (isPrintSingleLine ? 'normal' : 'pre-line') : 'nowrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              transform: isImage ? 'none' : `scale(${f.scaleX || 1}, ${f.scaleY || 1})`,
                              transformOrigin: 'top left',
                              WebkitTextStroke: !isImage && f.strokeWidth ? `${f.strokeWidth}px ${f.strokeColor || "#ffffff"}` : undefined,
                              paintOrder: !isImage && f.strokeWidth ? "stroke fill" : undefined,
                            }}
                          >
                            {!isImage && f.labelVisible !== false && labelStr ? (
                              <span className="font-bold opacity-80 mr-1">{labelStr}</span>
                            ) : null}
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
