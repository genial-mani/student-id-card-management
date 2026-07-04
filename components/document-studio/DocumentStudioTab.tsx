"use client";

import { PDFDocument, StandardFonts, cmyk } from "pdf-lib";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import Draggable from "react-draggable";
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
import { PrintSettings, calculatePrintGridMm } from "@/utils/printLayoutEngine";

// Conversion factor for display: 1 mm ≈ 3.7795 px
const MM_TO_PX = 3.7795275591;

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
}

export default function DocumentStudioTab({ schoolId, schoolName, students, customFieldsConfig }: DocumentStudioTabProps) {
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

const FONT_FAMILIES = ["Inter", "Roboto", "Poppins", "Outfit", "Playfair Display", "Montserrat"];

function DocumentDesigner({ doc, onBack, schoolName, students, customFieldsConfig }: DocumentDesignerProps) {
  const [name, setName] = useState(doc.name);
  const [widthMm, setWidthMm] = useState(doc.width);
  const [heightMm, setHeightMm] = useState(doc.height);
  const [backgroundUrl, setBackgroundUrl] = useState(doc.backgroundUrl || "");
  const [fields, setFields] = useState<any>(() => {
    let config = doc.layoutConfig;
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch(e) {}
    }
    return config?.fields || {};
  });
  
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const availableFields = useMemo(() => {
    const baseFields = [ ...AVAILABLE_FIELDS ];
    
    if (customFieldsConfig) {
      const { school = [], class: classFields = [], student = [] } = customFieldsConfig;
      
      school.filter((f: any) => !f.default && f.enabled).forEach((f: any) => {
        baseFields.push({ key: `school_custom_${f.key}`, label: `(School) ${f.label}`, defaultLabel: `[${f.label}]`, isImage: false });
      });
      classFields.filter((f: any) => !f.default && f.enabled).forEach((f: any) => {
        baseFields.push({ key: `class_custom_${f.key}`, label: `(Class) ${f.label}`, defaultLabel: `[${f.label}]`, isImage: false });
      });
      student.filter((f: any) => !f.default && f.enabled).forEach((f: any) => {
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
      const containerWidth = containerRef.current.clientWidth - 64; // padding
      const containerHeight = containerRef.current.clientHeight - 64;
      const scaleX = containerWidth / canvasWidthPx;
      const scaleY = containerHeight / canvasHeightPx;
      const minScale = Math.max(0.1, Math.min(scaleX, scaleY, 1)); // Don't scale up beyond 1 automatically
      setScale(minScale);
    }
  }, [canvasWidthPx, canvasHeightPx]);

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
        fontSize: isImage ? undefined : 16,
        color: isImage ? undefined : "#000000",
        colorCmyk: isImage ? undefined : { c: 0, m: 0, y: 0, k: 100 },
        fontWeight: isImage ? undefined : "500",
        fontFamily: isImage ? undefined : "Inter",
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
    setFields((prev: any) => ({
      ...(prev || {}),
      [selectedFieldKey]: {
        ...(prev || {})[selectedFieldKey],
        [key]: value
      }
    }));
  };

  const handleDragStart = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleDragMove = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleDragStop = (fieldKey: string, x: number, y: number) => {
    let snappedX = Math.round(x);
    let snappedY = Math.round(y);
    const threshold = 8;
    const centerX = canvasWidthPx / 2;
    const centerY = canvasHeightPx / 2;

    let w = 0;
    let h = 0;
    if (dragState && dragState.activeKey === fieldKey) {
      w = dragState.width;
      h = dragState.height;
    }

    if (w > 0 && Math.abs((snappedX + w / 2) - centerX) < threshold) snappedX = Math.round(centerX - w / 2);
    if (Math.abs(snappedX - centerX) < threshold) snappedX = Math.round(centerX);

    if (h > 0 && Math.abs((snappedY + h / 2) - centerY) < threshold) snappedY = Math.round(centerY - h / 2);
    if (Math.abs(snappedY - centerY) < threshold) snappedY = Math.round(centerY);

    Object.entries(fields).forEach(([otherKey, otherField]: [string, any]) => {
      if (otherKey === fieldKey || !otherField || !otherField.visible) return;
      if (Math.abs(snappedX - (otherField.x || 0)) < threshold) snappedX = otherField.x || 0;
      if (Math.abs(snappedY - (otherField.y || 0)) < threshold) snappedY = otherField.y || 0;
    });

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

  const getActiveGuides = () => {
    if (!dragState) return { xGuides: [], yGuides: [] };

    const xGuides: number[] = [];
    const yGuides: number[] = [];
    const threshold = 8;
    const centerX = canvasWidthPx / 2;
    const centerY = canvasHeightPx / 2;

    const activeX = dragState.x;
    const activeY = dragState.y;
    const activeW = dragState.width;
    const activeH = dragState.height;
    const activeCenterX = activeX + activeW / 2;
    const activeCenterY = activeY + activeH / 2;

    if (Math.abs(activeCenterX - centerX) < threshold || Math.abs(activeX - centerX) < threshold) xGuides.push(centerX);
    if (Math.abs(activeCenterY - centerY) < threshold || Math.abs(activeY - centerY) < threshold) yGuides.push(centerY);

    Object.entries(fields).forEach(([otherKey, otherField]: [string, any]) => {
      if (otherKey === dragState.activeKey || !otherField || !otherField.visible) return;
      const otherX = otherField.x || 0;
      const otherY = otherField.y || 0;
      if (Math.abs(activeX - otherX) < threshold) xGuides.push(otherX);
      if (Math.abs(activeY - otherY) < threshold) yGuides.push(otherY);
    });

    return { xGuides: Array.from(new Set(xGuides)), yGuides: Array.from(new Set(yGuides)) };
  };

  const { xGuides, yGuides } = getActiveGuides();

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
              className="font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full truncate" 
              placeholder="Document Name"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Canvas Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Canvas Size (mm)</h3>
            <div className="flex gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Width</label>
                <input 
                  type="number" 
                  value={widthMm} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setWidthMm(val === "" ? 0 : parseFloat(val));
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Height</label>
                <input 
                  type="number" 
                  value={heightMm} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setHeightMm(val === "" ? 0 : parseFloat(val));
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Background Upload */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Background Image</h3>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploading}
              />
              <div className={`w-full px-4 py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${
                isUploading ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-violet-50/50 border-violet-200 hover:bg-violet-50 text-violet-600'
              }`}>
                {isUploading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-sm font-medium">{backgroundUrl ? 'Change Background' : 'Upload Image'}</span>
                  </>
                )}
              </div>
            </div>
            {backgroundUrl && (
              <button 
                onClick={() => setBackgroundUrl("")}
                className="text-xs text-red-500 mt-2 hover:underline"
              >
                Remove background
              </button>
            )}
          </div>

          {/* Fields Selection */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Add Fields</h4>
            <div className="flex flex-wrap gap-2">
              {availableFields.map((f: any) => (
                <button
                  key={f.key}
                  onClick={() => fields[f.key] ? handleRemoveField(f.key) : handleAddField(f.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    fields[f.key] 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Field Properties */}
          {selectedFieldKey && fields[selectedFieldKey] && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">
                  {availableFields.find((f: any) => f.key === selectedFieldKey)?.label || "Field"} Properties
                </h3>
                <button onClick={() => setSelectedFieldKey(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mb-4">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveField(selectedFieldKey); }} 
                  className="w-full text-xs h-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-0 shadow-none"
                >
                  <HugeiconsIcon icon={Delete01Icon} size={14} color="currentColor" />
                  <span className="ml-1">Remove Field</span>
                </Button>
              </div>

              {AVAILABLE_FIELDS.find(f => f.key === selectedFieldKey)?.isImage ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Width (px)</label>
                      <input type="number" value={fields[selectedFieldKey].width || 100} onChange={e => updateFieldProperty("width", parseInt(e.target.value) || 100)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Height (px)</label>
                      <input type="number" value={fields[selectedFieldKey].height || 100} onChange={e => updateFieldProperty("height", parseInt(e.target.value) || 100)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Font Size (px)</label>
                    <input type="number" value={fields[selectedFieldKey].fontSize || 16} onChange={e => updateFieldProperty("fontSize", parseInt(e.target.value) || 16)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={fields[selectedFieldKey].color || "#000000"} onChange={e => updateFieldProperty("color", e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0 border-0" />
                      <input type="text" value={fields[selectedFieldKey].color || "#000000"} onChange={e => updateFieldProperty("color", e.target.value)} className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Font Family</label>
                    <select value={fields[selectedFieldKey].fontFamily || "Inter"} onChange={e => updateFieldProperty("fontFamily", e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                      {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Font Weight</label>
                    <select value={fields[selectedFieldKey].fontWeight || "500"} onChange={e => updateFieldProperty("fontWeight", e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra-Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
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

      {/* Canvas Area */}
      <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner flex flex-col">
        {/* Zoom Controls */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setScale(s => Math.max(0.1, s - 0.1))}>-</Button>
          <span className="text-xs font-semibold w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => setScale(s => s + 0.1)}>+</Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const containerWidth = containerRef.current?.clientWidth || canvasWidthPx;
            const containerHeight = containerRef.current?.clientHeight || canvasHeightPx;
            setScale(Math.max(0.1, Math.min((containerWidth - 64) / canvasWidthPx, (containerHeight - 64) / canvasHeightPx, 1)));
          }}>Fit Screen</Button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-auto relative p-8" ref={containerRef}>
          <div 
            className="relative bg-white shadow-xl transition-transform origin-top-left"
            style={{ 
              width: `${canvasWidthPx}px`, 
              height: `${canvasHeightPx}px`,
              transform: `scale(${scale})`,
              marginBottom: `${Math.max(0, canvasHeightPx * scale - canvasHeightPx)}px`,
              marginRight: `${Math.max(0, canvasWidthPx * scale - canvasWidthPx)}px`
            }}
            onClick={() => setSelectedFieldKey(null)}
          >
          {backgroundUrl && (
            <Image src={backgroundUrl} alt="Background" fill className="object-fill pointer-events-none" unoptimized />
          )}

          {/* Alignment Guides */}
          {xGuides.map((xVal, idx) => (
            <div key={`v-guide-${idx}`} className="absolute top-0 bottom-0 border-l border-dashed border-rose-500 z-50 pointer-events-none" style={{ left: `${xVal}px`, width: "0px", height: "100%" }} />
          ))}
          {yGuides.map((yVal, idx) => (
            <div key={`h-guide-${idx}`} className="absolute left-0 right-0 border-t border-dashed border-rose-500 z-50 pointer-events-none" style={{ top: `${yVal}px`, height: "0px", width: "100%" }} />
          ))}
          {dragState && (
            <>
              <div className="absolute top-0 bottom-0 border-l border-violet-400/20 z-30 pointer-events-none" style={{ left: `${canvasWidthPx / 2}px`, width: "0px", height: "100%" }} />
              <div className="absolute left-0 right-0 border-t border-violet-400/20 z-30 pointer-events-none" style={{ top: `${canvasHeightPx / 2}px`, height: "0px", width: "100%" }} />
            </>
          )}

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
              />
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// DRAGGABLE FIELD COMPONENT
// ----------------------------------------------------------------------

function StudioDraggableField({ fieldKey, f, scale, fieldInfo, isSelected, setSelectedFieldKey, handleDragStop, onDragStart, onDragMove }: any) {
  const nodeRef = useRef<HTMLDivElement>(null);
  
  return (
    <Draggable
      bounds="parent"
      nodeRef={nodeRef}
      position={{ x: f.x || 0, y: f.y || 0 }}
      scale={scale}
      onStart={(e, data) => onDragStart && onDragStart(fieldKey, data.x, data.y, nodeRef.current?.offsetWidth || 0, nodeRef.current?.offsetHeight || 0)}
      onDrag={(e, data) => onDragMove && onDragMove(fieldKey, data.x, data.y, nodeRef.current?.offsetWidth || 0, nodeRef.current?.offsetHeight || 0)}
      onStop={(e, data) => handleDragStop(fieldKey, data.x, data.y)}
    >
      <div 
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); setSelectedFieldKey(fieldKey); }}
        className={`absolute select-none cursor-move flex items-center justify-center ${isSelected ? 'ring-2 ring-violet-500 shadow-md z-10' : 'ring-1 ring-transparent hover:ring-gray-300 hover:ring-dashed z-0'}`}
        style={{
          width: fieldInfo.isImage ? `${f.width || 100}px` : 'auto',
          height: fieldInfo.isImage ? `${f.height || 100}px` : 'auto',
          fontSize: `${f.fontSize || 16}px`,
          color: f.color || "#000000",
          fontFamily: `'${f.fontFamily || "Inter"}', sans-serif`,
          fontWeight: f.fontWeight || "500",
          whiteSpace: 'nowrap',
          background: fieldInfo.isImage ? 'rgba(0,0,0,0.1)' : 'transparent',
          border: fieldInfo.isImage && !isSelected ? '1px dashed #cbd5e1' : 'none'
        }}
      >
        {fieldInfo.isImage ? (
          <div className="flex flex-col items-center justify-center opacity-50">
            <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs">{fieldInfo.label}</span>
          </div>
        ) : (
          <span>{fieldInfo.defaultLabel}</span>
        )}
      </div>
    </Draggable>
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
  });

  const MM_TO_PX = 3.7795275591; 

  const printGrid = useMemo(() => {
    return calculatePrintGridMm(printSettings, widthMm, heightMm, 2);
  }, [printSettings, widthMm, heightMm]);

  useEffect(() => {
    // Add print styles to head when component mounts
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
      
      const pdf = new jsPDF({
        orientation: printSettings.paperOrientation,
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
        
        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, 0, printGrid.paperWMm, printGrid.paperHMm);
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

  const canvasWidthPx = widthMm * MM_TO_PX;
  const canvasHeightPx = heightMm * MM_TO_PX;

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
                const transform = isRotated ? `translate(${(printGrid.docW - docWrapperWidth)/2}mm, ${(printGrid.docH - docWrapperHeight)/2}mm) rotate(-90deg)` : 'none';

                return (
                  <div
                    key={student.id}
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
                      <div 
                        style={{
                          width: `${widthMm * MM_TO_PX}px`,
                          height: `${heightMm * MM_TO_PX}px`,
                        }}
                      >
            {backgroundUrl && (
              <Image src={backgroundUrl} alt="Background" fill className="object-fill" unoptimized priority />
            )}

            {Object.entries(fields).map(([key, f]: [string, any]) => {
              if (!f.visible) return null;
              
              let content: React.ReactNode = null;
              
              if (key === "student_name") content = student.name;
              else if (key === "student_class") content = student.class?.name || "-";
              else if (key === "student_camSno") content = student.camSno;
              else if (key === "student_idNo") content = student.idNo;
              else if (key === "student_fatherName") content = student.fatherName;
              else if (key === "student_motherName") content = student.motherName;
              else if (key === "student_fatherPhone") content = student.fatherPhone;
              else if (key === "student_motherPhone") content = student.motherPhone;
              else if (key === "student_address") content = student.address;
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
              } else if (key.startsWith("school_custom_")) {
                const customKey = key.replace("school_custom_", "");
                const values = typeof student.school?.customValues === 'string' ? JSON.parse(student.school.customValues || '{}') : (student.school?.customValues || {});
                content = values[customKey] || "-";
              } else if (key.startsWith("class_custom_")) {
                const customKey = key.replace("class_custom_", "");
                const values = typeof student.class?.customValues === 'string' ? JSON.parse(student.class.customValues || '{}') : (student.class?.customValues || {});
                content = values[customKey] || "-";
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
                    width: isImage ? `${f.width || 100}px` : 'auto',
                    height: isImage ? `${f.height || 100}px` : 'auto',
                    fontSize: isImage ? undefined : `${f.fontSize || 16}px`,
                    color: f.color || "#000000",
                    fontFamily: `'${f.fontFamily || "Inter"}', sans-serif`,
                    fontWeight: f.fontWeight || "500",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {content}
                </div>
              );
            })}
                      </div>
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
