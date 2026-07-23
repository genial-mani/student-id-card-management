"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { DragDropContext, Droppable, Draggable as DndDraggable, DropResult } from "@hello-pangea/dnd";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/DashboardLayout";
import ClassForm from "@/components/ClassForm";
import CredentialsModal from "@/components/CredentialsModal";
import { PRESET_LAYOUT_CONFIGS } from "@/utils/presetLayouts";
import SchoolForm from "@/components/SchoolForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import IdCard, { CardTheme } from "@/components/IdCard";
import DocumentStudioTab from "@/components/document-studio/DocumentStudioTab";
import { Rnd } from "react-rnd";
import uploadImageToCloudinary from "@/utils/cloudService";
import { toast } from "sonner";

import AdBanner from "@/components/AdBanner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AddSquareIcon, Delete01Icon, Folder01Icon, PaintBoardIcon, PencilEdit02Icon, SchoolIcon, Setting07Icon, Share08Icon, ShieldKeyIcon, StudentIcon } from "@hugeicons/core-free-icons";

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  classes: Class[];
  idCardLayout?: number | null;
  idCardTheme?: string | null;
  customFieldsConfig?: any;
  idCardLayoutConfig?: any;
  customValues?: any;
}

interface Class {
  id: string;
  name: string;
  students: { id: string }[];
}



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
  // Elegant Serifs
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

  // Decorative Display
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

const DEFAULT_THEME: CardTheme = {
  primary: "#e85d04",
  secondary: "#ffecd1",
  background: "#f6fff8",
  textMain: "#ffffff",
  textSub: "#4b5563",
};

const COLOR_FIELDS: [keyof CardTheme, string][] = [
  ["primary", "Primary"],
  ["secondary", "Secondary"],
  ["background", "Background"],
  ["textMain", "Header Text"],
  ["textSub", "Body Text"],
];

interface DraggableFieldProps {
  fieldKey: string;
  f: any;
  isImage: boolean;
  selectedFieldKey: string | null;
  setSelectedFieldKey: (key: string | null) => void;
  handleFieldDrag: (fieldKey: string, x: number, y: number) => void;
  displayContent: React.ReactNode;
  onDragStart: (key: string, x: number, y: number, w: number, h: number) => void;
  onDragMove: (key: string, x: number, y: number, w: number, h: number) => void;
  handleFieldResize: (key: string, width: number, height: number, scaleX: number, scaleY: number, x: number, y: number) => void;
}

const DraggableField = ({
  fieldKey,
  f,
  isImage,
  selectedFieldKey,
  setSelectedFieldKey,
  handleFieldDrag,
  displayContent,
  onDragStart,
  onDragMove,
  handleFieldResize,
}: DraggableFieldProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  
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

  return (
    <Rnd
      bounds="parent"
      position={{ x: f.x || 0, y: f.y || 0 }}
      size={{ width: f.width || 'auto', height: f.height || 'auto' }}
      scale={0.5}
      onDragStart={(e, data) => {
        onDragStart(fieldKey, data.x, data.y, innerRef.current?.offsetWidth || 0, innerRef.current?.offsetHeight || 0);
      }}
      onDrag={(e, data) => {
        onDragMove(fieldKey, data.x, data.y, innerRef.current?.offsetWidth || 0, innerRef.current?.offsetHeight || 0);
      }}
      onDragStop={(e, data) => {
        handleFieldDrag(fieldKey, data.x, data.y);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        const newW = parseInt(ref.style.width, 10);
        const newH = parseInt(ref.style.height, 10);
        
        if (isImage) {
          handleFieldResize(fieldKey, newW, newH, 1, 1, position.x, position.y);
        } else {
          const unscaledW = innerRef.current?.offsetWidth || 1;
          const unscaledH = innerRef.current?.offsetHeight || 1;
          handleFieldResize(fieldKey, newW, newH, newW / unscaledW, newH / unscaledH, position.x, position.y);
        }
      }}
      resizeHandleStyles={resizeHandleStyles}
      className={`absolute flex items-center justify-center border ${selectedFieldKey === fieldKey ? "border-violet-650 ring-1 ring-violet-650 z-50" : "border-transparent hover:border-slate-300 hover:border-dashed z-10"}`}
      enableResizing={selectedFieldKey === fieldKey}
      style={{ padding: 0 }}
    >
      <div
        ref={innerRef}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFieldKey(fieldKey);
        }}
        className="w-full h-full flex items-center justify-center cursor-move select-none"
        style={{
          width: isImage ? '100%' : 'max-content',
          height: isImage ? '100%' : 'max-content',
          padding: isImage ? "0px" : "4px 8px",
          fontFamily: f.fontFamily ? `'${f.fontFamily}', sans-serif` : undefined,
          fontSize: f.fontSize ? `${f.fontSize}px` : "20px",
          fontWeight: f.fontWeight || "500",
          color: f.color || "#000",
          transform: isImage ? 'none' : `scale(${f.scaleX || 1}, ${f.scaleY || 1})`,
          transformOrigin: 'top left',
          whiteSpace: 'nowrap'
        }}
      >
        {displayContent}
      </div>
    </Rnd>
  );
};

export default function SchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isSchoolAdmin = user?.role === "school_admin" && user?.schoolId === schoolId;
  const canEditSchool = isAdmin || isSchoolAdmin;

  const [school, setSchool] = useState<School | null>(null);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [showEditSchool, setShowEditSchool] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Tabs & Custom Configurations State
  const [activeTab, setActiveTab] = useState<"classes" | "forms" | "designer" | "documents">("classes");
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(1);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [savingLayout, setSavingLayout] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [dragState, setDragState] = useState<{
    activeKey: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [customFieldsConfig, setCustomFieldsConfig] = useState<any>({
    school: [],
    class: [],
    student: []
  });
  const [idCardLayoutConfig, setIdCardLayoutConfig] = useState<any>({
    backgroundUrl: "",
    fields: {}
  });

  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Form Config Inputs State
  const [editingField, setEditingField] = useState<{
    category: "school" | "class" | "student";
    key: string;
    label: string;
    required: boolean;
  } | null>(null);

  const [newFieldNameSchool, setNewFieldNameSchool] = useState("");
  const [newFieldRequiredSchool, setNewFieldRequiredSchool] = useState(false);

  const [newFieldNameClass, setNewFieldNameClass] = useState("");
  const [newFieldRequiredClass, setNewFieldRequiredClass] = useState(false);

  const [newFieldNameStudent, setNewFieldNameStudent] = useState("");
  const [newFieldRequiredStudent, setNewFieldRequiredStudent] = useState(false);

  useEffect(() => {
    if (school) {
      if (school.idCardLayout !== null && school.idCardLayout !== undefined) {
        setSelectedLayout(school.idCardLayout);
      }
      if (school.idCardTheme) {
        try {
          setTheme(JSON.parse(school.idCardTheme));
        } catch (e) {
          console.error("Failed to parse school.idCardTheme", e);
        }
      }

      if (school.customFieldsConfig) {
        try {
          const parsed = typeof school.customFieldsConfig === "string"
            ? JSON.parse(school.customFieldsConfig)
            : school.customFieldsConfig;
          if (parsed && parsed.student) {
            parsed.student = parsed.student.filter((f: any) => f.key !== "motherName" && f.key !== "motherPhone" && f.key !== "camSno");
          }
          setCustomFieldsConfig(parsed);
        } catch (e) {
          console.error("Failed to parse school.customFieldsConfig", e);
        }
      } else {
        setCustomFieldsConfig({
          school: [
            { key: "name", label: "School Name", type: "text", required: true, default: true, enabled: true },
            { key: "logoUrl", label: "School Logo", type: "file", required: false, default: true, enabled: true },
            { key: "signatureUrl", label: "Signature Photo", type: "file", required: false, default: true, enabled: true },
            { key: "caption", label: "Caption / Tagline", type: "text", required: false, default: true, enabled: true },
            { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true },
            { key: "phone", label: "Phone", type: "text", required: false, default: true, enabled: true }
          ],
          class: [
            { key: "name", label: "Class Name", type: "text", required: true, default: true, enabled: true }
          ],
          student: [
            { key: "name", label: "Student Name", type: "text", required: true, default: true, enabled: true },
            { key: "profilePictureUrl", label: "Profile Picture", type: "file", required: true, default: true, enabled: true },
            { key: "fatherName", label: "Father Name", type: "text", required: false, default: true, enabled: true },
            { key: "fatherPhone", label: "Father Phone", type: "text", required: false, default: true, enabled: true },
            { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true }
          ]
        });
      }

      if (school.idCardLayoutConfig) {
        try {
          setIdCardLayoutConfig(
            typeof school.idCardLayoutConfig === "string"
              ? JSON.parse(school.idCardLayoutConfig)
              : school.idCardLayoutConfig
          );
        } catch (e) {
          console.error("Failed to parse school.idCardLayoutConfig", e);
        }
      } else {
        setIdCardLayoutConfig({
          backgroundUrl: "",
          fields: {
            school_logo: { x: 40, y: 40, width: 80, height: 80, visible: true },
            school_name: { x: 140, y: 40, fontSize: 32, color: "#1e3a8a", fontWeight: "800", fontFamily: "Inter", visible: true },
            school_caption: { x: 140, y: 80, fontSize: 18, color: "#4b5563", fontWeight: "500", fontFamily: "Inter", visible: true },
            student_photo: { x: 226, y: 180, width: 220, height: 220, visible: true },
            student_name: { x: 226, y: 430, fontSize: 40, color: "#1e3a8a", fontWeight: "900", fontFamily: "Inter", visible: true },
            class_name: { x: 226, y: 500, fontSize: 24, color: "#1e3a8a", fontWeight: "700", fontFamily: "Inter", visible: true, labelVisible: true },
            student_fatherName: { x: 100, y: 600, fontSize: 24, color: "#4b5563", fontWeight: "700", fontFamily: "Inter", visible: true, labelVisible: true },
            student_fatherPhone: { x: 100, y: 640, fontSize: 24, color: "#4b5563", fontWeight: "700", fontFamily: "Inter", visible: true, labelVisible: true },
            student_address: { x: 100, y: 680, fontSize: 24, color: "#4b5563", fontWeight: "700", fontFamily: "Inter", visible: true, labelVisible: true },
            principal_signature: { x: 450, y: 880, width: 150, height: 60, visible: true }
          }
        });
      }
    }
  }, [school]);

  const handleLayoutChange = (num: number) => {
    setSelectedLayout(num);
    if (num >= 13) {
      const shared = sharedLayouts[num - 13];
      if (shared) {
        setIdCardLayoutConfig(shared.config);
        setTheme(shared.theme);
      }
    } else if (num === 0) {
      if (school?.idCardLayoutConfig) {
        try {
          setIdCardLayoutConfig(
            typeof school.idCardLayoutConfig === "string"
              ? JSON.parse(school.idCardLayoutConfig)
              : school.idCardLayoutConfig
          );
        } catch { }
      }
    } else if (num >= 1 && num <= 12) {
      // If switching to a preset layout, load its default fields
      if (PRESET_LAYOUT_CONFIGS[num]) {
        // preserve backgroundUrl if it was set (though preset layouts usually don't need one, it doesn't hurt)
        setIdCardLayoutConfig((prev: any) => ({
          ...prev,
          fields: PRESET_LAYOUT_CONFIGS[num].fields,
        }));
      }
    }
  };

  const handleColorChange = (key: keyof CardTheme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSelectedLayout(1);
    setTheme(DEFAULT_THEME);
    setSelectedFieldKey(null);
  };

  const handleToggleDefaultField = (category: "school" | "class" | "student", key: string) => {
    setCustomFieldsConfig((prev: any) => {
      const catFields = prev[category].map((f: any) => {
        if (f.key === key) {
          return { ...f, enabled: !f.enabled };
        }
        return f;
      });
      return { ...prev, [category]: catFields };
    });
  };

  const handleAddCustomField = (category: "school" | "class" | "student", label: string, required: boolean) => {
    if (!label.trim()) return;
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

    const exists = customFieldsConfig[category].some((f: any) => f.key === key);
    if (exists) {
      toast.error("A field with a similar name already exists.");
      return;
    }

    const newField = {
      key,
      label: label.trim(),
      type: "text",
      required,
      default: false,
      enabled: true
    };

    setCustomFieldsConfig((prev: any) => ({
      ...prev,
      [category]: [...prev[category], newField]
    }));

    if (category === "school") {
      setNewFieldNameSchool("");
      setNewFieldRequiredSchool(false);
    } else if (category === "class") {
      setNewFieldNameClass("");
      setNewFieldRequiredClass(false);
    } else if (category === "student") {
      setNewFieldNameStudent("");
      setNewFieldRequiredStudent(false);
    }
  };

  const handleSaveEditedField = () => {
    if (!editingField || !editingField.label.trim()) return;
    setCustomFieldsConfig((prev: any) => {
      const updatedFields = prev[editingField.category].map((f: any) => {
        if (f.key === editingField.key) {
          return {
            ...f,
            label: editingField.label.trim(),
            required: editingField.required
          };
        }
        return f;
      });
      return { ...prev, [editingField.category]: updatedFields };
    });
    setEditingField(null);
  };

  const handleDeleteCustomField = (category: "school" | "class" | "student", key: string) => {
    setCustomFieldsConfig((prev: any) => ({
      ...prev,
      [category]: prev[category].filter((f: any) => f.key !== key)
    }));

    setIdCardLayoutConfig((prev: any) => {
      if (!prev.fields) return prev;
      const fields = { ...prev.fields };
      const fieldKey = `${category}_custom_${key}`;
      delete fields[fieldKey];
      return { ...prev, fields };
    });
  };

  const handleSaveFieldsConfig = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customFieldsConfig: JSON.stringify(customFieldsConfig)
        })
      });

      if (response.ok) {
        toast.success("Forms setup saved successfully!");
        window.dispatchEvent(new Event("schools-updated"));
        fetchSchool();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const folderName = school?.name.trim().split(/\s+/)[0] || "custom";
      const url = await uploadImageToCloudinary(file, folderName);
      setIdCardLayoutConfig((prev: any) => ({
        ...prev,
        backgroundUrl: url
      }));
      toast.success("Background image uploaded successfully! Save layouts to persist.");
    } catch (e) {
      toast.error("Failed to upload background image");
    } finally {
      setBgUploading(false);
    }
  };

  const handleFieldDrag = (fieldKey: string, x: number, y: number) => {
    let snappedX = Math.round(x);
    let snappedY = Math.round(y);
    const threshold = 8; // Snap within 8 pixels in 673x1087 system

    let w = 0;
    let h = 0;
    if (dragState && dragState.activeKey === fieldKey) {
      w = dragState.width;
      h = dragState.height;
    }

    let snappedToCenter = false;
    // Center of canvas
    if (w > 0) {
      const activeCenterX = snappedX + w / 2;
      if (Math.abs(activeCenterX - 336.5) < threshold) {
        snappedX = Math.round(336.5 - w / 2);
        snappedToCenter = true;
      }
    }
    if (Math.abs(snappedX - 336.5) < threshold) {
      snappedX = 336.5;
      snappedToCenter = true;
    }

    if (h > 0) {
      const activeCenterY = snappedY + h / 2;
      if (Math.abs(activeCenterY - 543.5) < threshold) {
        snappedY = Math.round(543.5 - h / 2);
      }
    }
    if (Math.abs(snappedY - 543.5) < threshold) {
      snappedY = 543.5;
    }

    // Align with other visible fields (starting edges)
    Object.entries(idCardLayoutConfig.fields || {}).forEach(([otherKey, otherField]: [string, any]) => {
      if (otherKey === fieldKey || !otherField || !otherField.visible) return;

      const otherX = otherField.x || 0;
      const otherY = otherField.y || 0;

      if (Math.abs(snappedX - otherX) < threshold) {
        snappedX = otherX;
      }
      if (Math.abs(snappedY - otherY) < threshold) {
        snappedY = otherY;
      }
    });

    setIdCardLayoutConfig((prev: any) => {
      const fields = { ...prev.fields };
      const currentField = fields[fieldKey] || {};
      fields[fieldKey] = {
        ...currentField,
        x: snappedX,
        y: snappedY,
        align: snappedToCenter ? "center" : (currentField.align || "left")
      };
      return { ...prev, fields };
    });

    setDragState(null); // Clear dragState on stop
  };

  const handleDragStart = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleDragMove = (key: string, x: number, y: number, w: number, h: number) => {
    setDragState({ activeKey: key, x, y, width: w, height: h });
  };

  const handleFieldResize = (fieldKey: string, width: number, height: number, scaleX: number, scaleY: number, x: number, y: number) => {
    setIdCardLayoutConfig((prev: any) => {
      const fields = { ...prev.fields };
      fields[fieldKey] = {
        ...fields[fieldKey],
        width,
        height,
        scaleX,
        scaleY,
        x,
        y
      };
      return { ...prev, fields };
    });
  };

  const getActiveGuides = () => {
    if (!dragState) return { xGuides: [], yGuides: [] };

    const xGuides: number[] = [];
    const yGuides: number[] = [];
    const threshold = 8;

    const activeX = dragState.x;
    const activeY = dragState.y;
    const activeW = dragState.width;
    const activeH = dragState.height;
    const activeCenterX = activeX + activeW / 2;
    const activeCenterY = activeY + activeH / 2;

    // 1. Center of canvas guides
    if (Math.abs(activeCenterX - 336.5) < threshold) {
      xGuides.push(336.5);
    }
    if (Math.abs(activeX - 336.5) < threshold) {
      xGuides.push(336.5);
    }
    if (Math.abs(activeCenterY - 543.5) < threshold) {
      yGuides.push(543.5);
    }
    if (Math.abs(activeY - 543.5) < threshold) {
      yGuides.push(543.5);
    }

    // 2. Align with other visible fields (starting edges)
    Object.entries(idCardLayoutConfig.fields || {}).forEach(([otherKey, otherField]: [string, any]) => {
      if (otherKey === dragState.activeKey || !otherField || !otherField.visible) return;

      const otherX = otherField.x || 0;
      const otherY = otherField.y || 0;

      if (Math.abs(activeX - otherX) < threshold) {
        xGuides.push(otherX);
      }
      if (Math.abs(activeY - otherY) < threshold) {
        yGuides.push(otherY);
      }
    });

    return {
      xGuides: Array.from(new Set(xGuides)),
      yGuides: Array.from(new Set(yGuides)),
    };
  };

  const { xGuides, yGuides } = getActiveGuides();

  const handleToggleFieldVisibility = (fieldKey: string) => {
    setIdCardLayoutConfig((prev: any) => {
      const fields = { ...prev.fields };
      const current = fields[fieldKey] || {};

      let defaultCoords = { x: 50, y: 50, visible: true };
      if (fieldKey === "school_logo") defaultCoords = { x: 40, y: 40, visible: true };
      else if (fieldKey === "school_name") defaultCoords = { x: 140, y: 40, visible: true };
      else if (fieldKey === "school_caption") defaultCoords = { x: 140, y: 80, visible: true };
      else if (fieldKey === "student_photo") defaultCoords = { x: 226, y: 180, visible: true };
      else if (fieldKey === "student_name") defaultCoords = { x: 226, y: 430, visible: true };
      else if (fieldKey === "class_name") defaultCoords = { x: 226, y: 500, visible: true };
      else if (fieldKey === "principal_signature") defaultCoords = { x: 450, y: 880, visible: true };

      fields[fieldKey] = {
        ...defaultCoords,
        ...current,
        visible: !current.visible
      };
      return { ...prev, fields };
    });
  };

  const handleFieldStyleChange = (key: string, value: any) => {
    if (!selectedFieldKey) return;
    setIdCardLayoutConfig((prev: any) => {
      const fields = { ...prev.fields };
      const updatedField = {
        ...fields[selectedFieldKey],
        [key]: value
      };
      
      // If font size changes, reset the stretch bounds so it fits naturally again
      if (key === 'fontSize') {
        delete updatedField.width;
        delete updatedField.height;
        delete updatedField.scaleX;
        delete updatedField.scaleY;
      }
      
      fields[selectedFieldKey] = updatedField;
      return { ...prev, fields };
    });
  };

  const handleFixFinalLayout = async () => {
    setSavingLayout(true);
    try {
      const response = await fetch(`/api/schools/${school?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCardLayout: selectedLayout,
          idCardTheme: JSON.stringify(theme),
          idCardLayoutConfig: JSON.stringify(idCardLayoutConfig),
        }),
      });

      if (response.ok) {
        toast.success("Layout saved successfully!");
        window.dispatchEvent(new Event("schools-updated"));
        fetchSchool();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save layout");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  };

  const handleDeleteSchool = async () => {
    setIsDeletingSchool(true);
    console.log("handleDeleteSchool executing... Sending DELETE request for:", schoolId);
    try {
      const res = await fetch(`/api/schools/${schoolId}`, { method: "DELETE" });
      console.log("DELETE response status:", res.status);
      if (res.ok) {
        toast.success("School deleted successfully!");
        window.dispatchEvent(new Event("schools-updated"));
        router.push("/");
      } else {
        const data = await res.json();
        console.log("DELETE failed: ", data);
        toast.error(data.error || "Failed to delete school");
      }
    } catch (err) {
      console.error("DELETE catch block error:", err);
      toast.error("Failed to delete school");
    } finally {
      setIsDeletingSchool(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: school?.name || "School",
          text: `Check out ${school?.name} on the ID Card Management System`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("School link copied to clipboard!");
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
      /**/
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) fetchSchool();
  }, [schoolId, fetchSchool]);

  useEffect(() => {
    if (canEditSchool) {
      fetch("/api/schools")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAllSchools(data);
        })
        .catch(console.error);
    }
  }, [canEditSchool]);

  const sharedLayouts = useMemo(() => {
    return allSchools
      .filter((s) => s.id !== schoolId && s.idCardLayoutConfig)
      .map((s) => {
        let config = s.idCardLayoutConfig;
        if (typeof config === "string") {
          try {
            config = JSON.parse(config);
          } catch {
            config = null;
          }
        }
        let themeObj = DEFAULT_THEME;
        if (s.idCardTheme) {
          try {
            themeObj = JSON.parse(s.idCardTheme);
          } catch { }
        }
        return {
          schoolId: s.id,
          schoolName: s.name,
          config,
          theme: themeObj
        };
      })
      .filter((l) => l.config && l.config.backgroundUrl);
  }, [allSchools, schoolId]);

  // ── Shell wrapper ──────────────────────────────────────────────────────────

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
        <LoadingSpinner message="Loading school..." />
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
            You don't have permission to view this school.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go Home
          </Button>
        </div>
      </Shell>
    );

  if (!school)
    return (
      <Shell>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            School not found
          </h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Go home
          </Link>
        </div>
      </Shell>
    );

  const totalStudents = school.classes.reduce(
    (s, c) => s + (c.students?.length ?? 0),
    0,
  );

  return (
    <>
      <div className="flex items-center justify-center w-full mx-auto">
        <div className="w-full max-w-full flex flex-col mx-auto mt-3">
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
                    <span className="text-2xl font-bold text-gray-400">
                      {school.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {school.name}
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {school.caption}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {school.address}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {school.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 self-start">
                {/* View Credentials — admin only */}
                {canEditSchool && (
                  <Button
                    onClick={() => setShowCreds(true)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    <HugeiconsIcon icon={ShieldKeyIcon} size={18} strokeWidth={2} />
                    <span className="hidden sm:inline">View Credentials</span>
                    <span className="sm:hidden">Credentials</span>
                  </Button>
                )}

                {/* Create class */}
                <Button
                  onClick={() => setShowClass(true)}
                  className="bg-[#7f22fe] hover:bg-[#7f22ff] text-[#fff]"
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} />
                  <span className="hidden sm:inline">Create Class</span>
                  <span className="sm:hidden">Add Class</span>
                </Button>

                {/* Options Menu */}
                {canEditSchool && (
                  <div className="relative" ref={optionsRef}>
                    <Button
                      onClick={() => setShowOptions(!showOptions)}
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-2.5 sm:px-3 h-10"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>

                    {showOptions && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                        <button
                          onClick={() => {
                            setShowEditSchool(true);
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={16} color="currentColor" strokeWidth={1.5} />
                          Edit Details
                        </button>

                        <button
                          onClick={() => {
                            handleShare();
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <HugeiconsIcon icon={Share08Icon} size={16} color="currentColor" strokeWidth={1.5} />
                          Share Link
                        </button>

                        <div className="h-px bg-gray-100 my-1 mx-2"></div>

                        <button
                          onClick={() => {
                            setShowDeleteConfirm(true);
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                          Delete School
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs Navigation Bar ────────────────────────────── */}
          <div className="flex border-b border-gray-200 mb-6 gap-2 sm:gap-4 overflow-x-auto select-none">
            <button
              onClick={() => { setActiveTab("classes"); setIsDesignMode(false); }}
              className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "classes"
                ? "border-violet-650 text-violet-650 font-extrabold"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              <HugeiconsIcon
                icon={Folder01Icon}
                size={20}
                color="#7f22fe"
                strokeWidth={1.5}
              /> Directory & Classes
            </button>
            {canEditSchool && (
              <button
                onClick={() => { setActiveTab("forms"); setIsDesignMode(false); }}
                className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "forms"
                  ? "border-violet-650 text-violet-650 font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <HugeiconsIcon
                  icon={Setting07Icon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> Form Setup
              </button>
            )}
            {canEditSchool && (
              <button
                onClick={() => { setActiveTab("designer"); setIsDesignMode(true); }}
                className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "designer"
                  ? "border-violet-650 text-violet-650 font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <HugeiconsIcon
                  icon={PaintBoardIcon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> ID Card Studio
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { setActiveTab("documents"); setIsDesignMode(false); }}
                className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === "documents"
                  ? "border-violet-650 text-violet-650 font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <HugeiconsIcon
                  icon={AddSquareIcon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> Document Studio
              </button>
            )}
          </div>

          {/* ── TAB 1: Directory & Classes ──────────────────────── */}
          {activeTab === "classes" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-left">
                  <p className="text-2xl font-bold text-gray-900">{school.classes.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Classes</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-left">
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
                </div>
                <div className="hidden sm:block bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-left">
                  <p className="text-2xl font-bold text-gray-900">{isAdmin ? "Admin" : isSchoolAdmin ? "School Admin" : "Staff"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your Role</p>
                </div>
              </div>

              {/* Classes Grid */}
              {school.classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* All Students Aggregate Card */}
                  <Link
                    href={`/school/${schoolId}/students`}
                    className="bg-linear-to-br from-violet-50/60 to-white rounded-xl border border-violet-150 p-4 hover:shadow-md hover:border-violet-300 transition-all group shadow-xs flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 bg-violet-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 text-left">
                        <h3 className="text-base font-bold text-gray-950 truncate group-hover:text-violet-900 transition-colors">
                          All Students
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {totalStudents} student{totalStudents !== 1 ? "s" : ""} total
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-violet-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Individual Class Cards */}
                  {school.classes.map((cls) => (
                    <Link
                      key={cls.id}
                      href={`/school/${school.id}/class/${cls.id}`}
                      className="bg-white rounded-xl border border-gray-150 p-4 hover:shadow-md hover:border-violet-200 transition-all group flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 bg-violet-50 group-hover:bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="min-w-0 text-left">
                          <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-violet-900 transition-colors">
                            Class {cls.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {cls.students?.length ?? 0} student{(cls.students?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes yet</h3>
                  <p className="text-gray-500 text-sm mb-5">Create your first class to get started.</p>
                  <Button onClick={() => setShowClass(true)} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                    Create First Class
                  </Button>
                </div>
              )}
              <AdBanner />
            </div>
          )}

          {/* ── TAB 2: Form Fields Configuration ───────────────── */}
          {activeTab === "forms" && canEditSchool && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 space-y-6 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-violet-900">Form Fields Setup</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Decide which fields are enabled on forms and add custom fields. Required default fields cannot be disabled.
                </p>
              </div>

              {/* School Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5"><HugeiconsIcon
                  icon={SchoolIcon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> School Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFieldsConfig.school?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("school", f.key)}
                        className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                      />
                      <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>

                {/* Render Custom Fields list */}
                {customFieldsConfig.school?.filter((f: any) => !f.default).length > 0 && (
                  <div className="pt-2 border-t border-gray-150">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">School Custom Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {customFieldsConfig.school.filter((f: any) => !f.default).map((f: any) => {
                        const isEditing = editingField && editingField.category === "school" && editingField.key === f.key;
                        if (isEditing) {
                          return (
                            <span key={f.key} className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs">
                              <input
                                type="text"
                                value={editingField.label}
                                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                                className="w-24 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-800"
                              />
                              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingField.required}
                                  onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                                  className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-3.5 h-3.5"
                                />
                                Req
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveEditedField}
                                className="text-fuchsia-650 hover:text-fuchsia-700 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingField(null)}
                                className="text-rose-500 hover:text-rose-600 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✕
                              </button>
                            </span>
                          );
                        }
                        return (
                          <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:border-gray-300 transition-colors">
                            <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                            <button
                              type="button"
                              onClick={() => setEditingField({ category: "school", key: f.key, label: f.label, required: f.required })}
                              className="text-gray-400 hover:text-violet-600 font-semibold cursor-pointer ml-1 bg-transparent border-0 p-0"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField("school", f.key)}
                              className="text-gray-400 hover:text-red-500 font-bold cursor-pointer bg-transparent border-0 p-0"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Custom field input */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Add School Custom Field</label>
                    <input
                      type="text"
                      placeholder="e.g. Medium, Board Name"
                      value={newFieldNameSchool}
                      onChange={(e) => setNewFieldNameSchool(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 h-10 pb-2">
                    <input
                      type="checkbox"
                      id="schoolFieldRequired"
                      checked={newFieldRequiredSchool}
                      onChange={(e) => setNewFieldRequiredSchool(e.target.checked)}
                      className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="schoolFieldRequired" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Required</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCustomField("school", newFieldNameSchool, newFieldRequiredSchool)}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Class Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5"><HugeiconsIcon
                  icon={Folder01Icon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> Class Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFieldsConfig.class?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("class", f.key)}
                        className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                      />
                      <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>

                {/* Render Custom Fields list */}
                {customFieldsConfig.class?.filter((f: any) => !f.default).length > 0 && (
                  <div className="pt-2 border-t border-gray-150">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Class Custom Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {customFieldsConfig.class.filter((f: any) => !f.default).map((f: any) => {
                        const isEditing = editingField && editingField.category === "class" && editingField.key === f.key;
                        if (isEditing) {
                          return (
                            <span key={f.key} className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs">
                              <input
                                type="text"
                                value={editingField.label}
                                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                                className="w-24 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-880"
                              />
                              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingField.required}
                                  onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                                  className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-3.5 h-3.5"
                                />
                                Req
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveEditedField}
                                className="text-fuchsia-650 hover:text-fuchsia-700 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingField(null)}
                                className="text-rose-500 hover:text-rose-650 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✕
                              </button>
                            </span>
                          );
                        }
                        return (
                          <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:border-gray-300 transition-colors">
                            <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                            <button
                              type="button"
                              onClick={() => setEditingField({ category: "class", key: f.key, label: f.label, required: f.required })}
                              className="text-gray-400 hover:text-violet-600 font-semibold cursor-pointer ml-1 bg-transparent border-0 p-0"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField("class", f.key)}
                              className="text-gray-400 hover:text-red-500 font-bold cursor-pointer bg-transparent border-0 p-0"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Custom field input */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Add Class Custom Field</label>
                    <input
                      type="text"
                      placeholder="e.g. Class Teacher, Incharge"
                      value={newFieldNameClass}
                      onChange={(e) => setNewFieldNameClass(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 h-10 pb-2">
                    <input
                      type="checkbox"
                      id="classFieldRequired"
                      checked={newFieldRequiredClass}
                      onChange={(e) => setNewFieldRequiredClass(e.target.checked)}
                      className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="classFieldRequired" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Required</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCustomField("class", newFieldNameClass, newFieldRequiredClass)}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Student Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5"><HugeiconsIcon
                  icon={StudentIcon}
                  size={20}
                  color="#7f22fe"
                  strokeWidth={1.5}
                /> Student Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {customFieldsConfig.student?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none truncate" title={f.key}>
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("student", f.key)}
                        className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                      />
                      <span className="truncate">{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>

                {/* Render Custom Fields list */}
                {customFieldsConfig.student?.filter((f: any) => !f.default).length > 0 && (
                  <div className="pt-2 border-t border-gray-150">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Student Custom Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {customFieldsConfig.student.filter((f: any) => !f.default).map((f: any) => {
                        const isEditing = editingField && editingField.category === "student" && editingField.key === f.key;
                        if (isEditing) {
                          return (
                            <span key={f.key} className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs">
                              <input
                                type="text"
                                value={editingField.label}
                                onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                                className="w-24 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-880"
                              />
                              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editingField.required}
                                  onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                                  className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-3.5 h-3.5"
                                />
                                Req
                              </label>
                              <button
                                type="button"
                                onClick={handleSaveEditedField}
                                className="text-fuchsia-650 hover:text-fuchsia-700 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingField(null)}
                                className="text-rose-500 hover:text-rose-650 font-bold text-xs cursor-pointer bg-transparent border-0 p-0"
                              >
                                ✕
                              </button>
                            </span>
                          );
                        }
                        return (
                          <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:border-gray-300 transition-colors">
                            <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                            <button
                              type="button"
                              onClick={() => setEditingField({ category: "student", key: f.key, label: f.label, required: f.required })}
                              className="text-gray-400 hover:text-violet-600 font-semibold cursor-pointer ml-1 bg-transparent border-0 p-0"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField("student", f.key)}
                              className="text-gray-400 hover:text-red-500 font-bold cursor-pointer bg-transparent border-0 p-0"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Custom field input */}
                <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Add Student Custom Field</label>
                    <input
                      type="text"
                      placeholder="e.g. Blood Group, Bus Route, Roll Number"
                      value={newFieldNameStudent}
                      onChange={(e) => setNewFieldNameStudent(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 h-10 pb-2">
                    <input
                      type="checkbox"
                      id="studentFieldRequired"
                      checked={newFieldRequiredStudent}
                      onChange={(e) => setNewFieldRequiredStudent(e.target.checked)}
                      className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="studentFieldRequired" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Required</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCustomField("student", newFieldNameStudent, newFieldRequiredStudent)}
                    className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Save forms configuration */}
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  onClick={handleSaveFieldsConfig}
                  className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-fuchsia-600/10 active:scale-98"
                >
                  Save Forms Setup
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 3: ID Card Designer ── */}
          {activeTab === "designer" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-4 sm:p-5 lg:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="min-w-0 text-left">
                  <h2 className="text-lg sm:text-xl font-bold text-violet-900">
                    ID Card Design Studio
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Save layout changes directly to this school's global settings. Layout 0 is completely customizable.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <button
                    onClick={handleFixFinalLayout}
                    disabled={savingLayout}
                    className="flex items-center gap-1.5 text-xs sm:text-sm bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingLayout ? "Saving..." : "Save Layout"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Render color pickers for all layouts (Custom, Preset, Shared) */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 text-left">
                  Colour Theme
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                  {COLOR_FIELDS.map(([key, label]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={theme[key] || DEFAULT_THEME[key]}
                          onChange={(e) =>
                            handleColorChange(key, e.target.value)
                          }
                          className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl cursor-pointer border-2 border-white shadow-md appearance-none p-0.5"
                          style={{ backgroundColor: theme[key] || DEFAULT_THEME[key] }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 text-center leading-tight line-clamp-2">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Drag & Drop Editor (Shown for all preset & custom layouts) ── */}
              <div className="mt-4 p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col lg:flex-row gap-6 sm:gap-8 text-left animate-in fade-in duration-200">
                {/* Canvas block (Left) */}
                <div className="flex flex-col items-center gap-4 shrink-0 mx-auto lg:mx-0">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-800">Dynamic Design Canvas</h3>
                    <p className="text-[10px] text-gray-400">Scale: 50% (Drag elements and click to style)</p>
                  </div>

                  {selectedLayout === 0 && !idCardLayoutConfig.backgroundUrl ? (
                    <div className="w-[336.5px] h-[543.5px] border-2 border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center p-6 text-center select-none shadow-xs">
                      <span className="text-3xl mb-2">🖼️</span>
                      <p className="text-xs font-bold text-gray-600">No Background Image</p>
                      <p className="text-[10px] text-gray-400 mb-4 font-medium">Upload a custom ID Card layout image to start positioning.</p>

                      <label className="px-4 py-2 bg-violet-650 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md select-none">
                        {bgUploading ? "Uploading..." : "Upload Background"}
                        <input type="file" accept="image/*" onChange={handleBgUpload} disabled={bgUploading} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <div
                      className="relative overflow-hidden rounded-xl border border-gray-300 shadow-2xl bg-white select-none shrink-0"
                      style={{ width: "336.5px", height: "543.5px" }}
                      onClick={() => setSelectedFieldKey(null)}
                    >
                      {/* Background loaded */}
                      {selectedLayout === 0 ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center pointer-events-none"
                          style={{
                            backgroundImage: `url(${idCardLayoutConfig.backgroundUrl})`,
                            backgroundColor: theme.background,
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 pointer-events-none scale-[0.5] origin-top-left" style={{ width: "673px", height: "1087px" }}>
                          <IdCard
                            layout={selectedLayout}
                            theme={theme}
                            school={{ ...school, idCardLayoutConfig: idCardLayoutConfig }}
                            student={DUMMY_STUDENT}
                            classNameStr="Demo Class"
                            hideFields={true}
                          />
                        </div>
                      )}

                      {/* Placed Elements Container */}
                      <div className="absolute top-0 left-0 w-[673px] h-[1087px] origin-top-left scale-[0.5]">
                        {/* Vertical alignment guide lines */}
                        {xGuides.map((xVal, idx) => (
                          <div
                            key={`v-guide-${idx}`}
                            className="absolute top-0 bottom-0 border-l border-dashed border-rose-500 z-50 pointer-events-none"
                            style={{
                              left: `${xVal}px`,
                              width: "0px",
                              height: "100%",
                            }}
                          />
                        ))}

                        {/* Horizontal alignment guide lines */}
                        {yGuides.map((yVal, idx) => (
                          <div
                            key={`h-guide-${idx}`}
                            className="absolute left-0 right-0 border-t border-dashed border-rose-500 z-50 pointer-events-none"
                            style={{
                              top: `${yVal}px`,
                              height: "0px",
                              width: "100%",
                            }}
                          />
                        ))}

                        {/* Canvas Center Reference Lines while dragging */}
                        {dragState && (
                          <>
                            {/* Horizontal Center Line */}
                            <div
                              className="absolute top-[543.5px] left-0 right-0 border-t border-violet-400/20 z-30 pointer-events-none"
                              style={{ height: "0px", width: "100%" }}
                            />
                            {/* Vertical Center Line */}
                            <div
                              className="absolute left-[336.5px] top-0 bottom-0 border-l border-violet-400/20 z-30 pointer-events-none"
                              style={{ width: "0px", height: "100%" }}
                            />
                          </>
                        )}

                        {Object.entries(idCardLayoutConfig.fields || {}).map(([fieldKey, f]: [string, any]) => {
                          if (!f || !f.visible) return null;

                          let displayContent: React.ReactNode = "";
                          if (fieldKey === "school_logo") {
                            displayContent = school.logoUrl ? (
                              <img src={school.logoUrl} alt="Logo" className="w-full h-full object-contain pointer-events-none" />
                            ) : (
                              <div className="w-full h-full border flex items-center justify-center text-[10px] font-bold text-slate-400">Logo</div>
                            );
                          } else if (fieldKey === "student_photo") {
                            displayContent = (
                              <img src={DUMMY_STUDENT.profilePictureUrl} alt="Photo" className="w-full h-full object-cover pointer-events-none" />
                            );
                          } else if (fieldKey === "principal_signature") {
                            displayContent = school.signatureUrl ? (
                              <img src={school.signatureUrl} alt="Sign" className="w-full h-full object-contain pointer-events-none" />
                            ) : (
                              <div className="w-full h-full border flex items-center justify-center text-[10px] font-bold text-slate-400">Signature</div>
                            );
                          } else {
                            let label = "";
                            let val = "";
                            if (fieldKey === "school_name") val = school.name;
                            else if (fieldKey === "school_caption") val = school.caption || "Caption Text";
                            else if (fieldKey === "school_address") val = school.address || "Address Text";
                            else if (fieldKey === "school_phone") val = school.phone || "Phone Text";
                            else if (fieldKey === "student_name") val = DUMMY_STUDENT.name;
                            else if (fieldKey === "class_name") { val = "Demo Class"; label = "Class: "; }
                            else if (fieldKey === "student_fatherName") { val = DUMMY_STUDENT.fatherName; label = "F's Name: "; }
                            else if (fieldKey === "student_motherName") { val = DUMMY_STUDENT.motherName; label = "M's Name: "; }
                            else if (fieldKey === "student_fatherPhone") { val = DUMMY_STUDENT.fatherPhone; label = "Cell: "; }
                            else if (fieldKey === "student_motherPhone") { val = DUMMY_STUDENT.motherPhone; label = "M's Cell: "; }
                            else if (fieldKey === "student_address") { val = DUMMY_STUDENT.address; label = "Address: "; }
                            else if (fieldKey.startsWith("student_custom_")) {
                              const key = fieldKey.replace("student_custom_", "");
                              val = `[${key}]`;
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

                            displayContent = (
                              <div className="leading-tight select-none whitespace-nowrap">
                                {f.labelVisible !== false && label ? <span className="font-bold opacity-80 mr-1">{label}</span> : null}
                                <span>{val}</span>
                              </div>
                            );
                          }

                          const isImage = ["school_logo", "student_photo", "principal_signature"].includes(fieldKey);

                          return (
                            <DraggableField
                              key={fieldKey}
                              fieldKey={fieldKey}
                              f={f}
                              isImage={isImage}
                              selectedFieldKey={selectedFieldKey}
                              setSelectedFieldKey={setSelectedFieldKey}
                              handleFieldDrag={handleFieldDrag}
                              displayContent={displayContent}
                              onDragStart={handleDragStart}
                              onDragMove={handleDragMove}
                              handleFieldResize={handleFieldResize}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Designer controls (Right) */}
                <div className="flex-1 space-y-6">
                  {idCardLayoutConfig.backgroundUrl && (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Layout Background</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 border rounded bg-gray-100 bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${idCardLayoutConfig.backgroundUrl})` }} />
                        <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-750 text-xs font-semibold rounded-lg border border-gray-300 transition-colors cursor-pointer select-none">
                          {bgUploading ? "Replacing..." : "Replace Image"}
                          <input type="file" accept="image/*" onChange={handleBgUpload} disabled={bgUploading} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Field Toggles list */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Layout Fields</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {[
                        { key: "school_logo", label: "School Logo" },
                        { key: "school_name", label: "School Name" },
                        { key: "school_caption", label: "School Caption" },
                        { key: "school_address", label: "School Address" },
                        { key: "school_phone", label: "School Phone" },
                        { key: "student_photo", label: "Student Photo" },
                        { key: "student_name", label: "Student Name" },
                        { key: "class_name", label: "Class Name" },
                        { key: "student_fatherName", label: "Father Name" },
                        { key: "student_motherName", label: "Mother Name" },
                        { key: "student_fatherPhone", label: "Father Phone" },
                        { key: "student_motherPhone", label: "Mother Phone" },
                        { key: "student_address", label: "Student Address" },
                        { key: "principal_signature", label: "Signature" },
                        // Add dynamic configurations custom fields
                        ...(customFieldsConfig.school || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `school_custom_${f.key}`, label: `(School) ${f.label}` })),
                        ...(customFieldsConfig.class || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `class_custom_${f.key}`, label: `(Class) ${f.label}` })),
                        ...(customFieldsConfig.student || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `student_custom_${f.key}`, label: `(Student) ${f.label}` }))
                      ].map((item) => {
                        // Filter elements to only show if enabled in Form configurations
                        const actualKey = item.key.replace(/^(school_custom_|student_custom_|class_custom_)/, "");
                        const defaultMapping = customFieldsConfig.student.concat(customFieldsConfig.school).concat(customFieldsConfig.class);
                        const isEnabled = defaultMapping.find((f: any) => f.key === actualKey)?.enabled !== false;

                        if (!isEnabled) return null;
                        const isVisible = !!idCardLayoutConfig.fields?.[item.key]?.visible;

                        return (
                          <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => handleToggleFieldVisibility(item.key)}
                              className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                            />
                            <span className="truncate">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Style editing panel (only shown if a field is active) */}
                  {selectedFieldKey && idCardLayoutConfig.fields?.[selectedFieldKey] && (
                    (() => {
                      const f = idCardLayoutConfig.fields[selectedFieldKey];
                      const isImage = ["school_logo", "student_photo", "principal_signature"].includes(selectedFieldKey);
                      const nameSafe = selectedFieldKey.replace(/^(school_|student_|class_|principal_)/, "").replace(/_custom_/, " ");
                      const displayName = nameSafe.charAt(0).toUpperCase() + nameSafe.slice(1);

                      return (
                        <div className="p-4 bg-white border-2 border-violet-150 rounded-xl space-y-4 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="text-xs font-bold text-violet-900 uppercase tracking-widest">
                              Style: {displayName}
                            </h4>
                            <button
                              onClick={() => setSelectedFieldKey(null)}
                              className="text-gray-405 hover:text-gray-600 font-bold text-xs bg-transparent border-0 cursor-pointer"
                            >
                              Close
                            </button>
                          </div>

                          {!isImage && (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                                <select
                                  value={f.fontFamily || ""}
                                  onChange={(e) => handleFieldStyleChange("fontFamily", e.target.value)}
                                  className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 font-medium"
                                >
                                  <option value="">Default Font</option>
                                  {GOOGLE_FONTS.map((font) => (
                                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Font Weight</label>
                                <select
                                  value={f.fontWeight || ""}
                                  onChange={(e) => handleFieldStyleChange("fontWeight", e.target.value)}
                                  className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 font-medium"
                                >
                                  <option value="">Default Weight</option>
                                  {FONT_WEIGHTS.map((fw) => (
                                    <option key={fw.value} value={fw.value}>{fw.label} ({fw.value})</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                                  <span>Font Size</span>
                                  <span className="text-violet-650 bg-violet-50 px-2 rounded font-bold">{f.fontSize || "20"}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="12"
                                  max="70"
                                  value={f.fontSize || "20"}
                                  onChange={(e) => handleFieldStyleChange("fontSize", parseInt(e.target.value, 10))}
                                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Text Color</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={f.color || "#000000"}
                                    onChange={(e) => handleFieldStyleChange("color", e.target.value)}
                                    className="w-8 h-8 rounded-lg cursor-pointer border shadow-xs appearance-none p-0.5 bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={f.color || "#000000"}
                                    onChange={(e) => handleFieldStyleChange("color", e.target.value)}
                                    className="w-24 px-2 py-1 text-xs border rounded-lg"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Text Alignment</label>
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() => handleFieldStyleChange("align", "left")}
                                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                                      (f.align || "left") === "left" ? "bg-white text-violet-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    Left
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldStyleChange("align", "center")}
                                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                                      f.align === "center" ? "bg-white text-violet-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    Center
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFieldStyleChange("align", "right")}
                                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                                      f.align === "right" ? "bg-white text-violet-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  >
                                    Right
                                  </button>
                                </div>
                              </div>

                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1 select-none">
                                <input
                                  type="checkbox"
                                  checked={f.labelVisible !== false}
                                  onChange={(e) => handleFieldStyleChange("labelVisible", e.target.checked)}
                                  className="rounded text-violet-650 focus:ring-violet-500 cursor-pointer w-4 h-4"
                                />
                                <span>Show Field Label Prefix</span>
                              </label>
                            </>
                          )}

                          {isImage && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Width (px)</label>
                                <input
                                  type="number"
                                  min="20"
                                  max="600"
                                  value={f.width || "120"}
                                  onChange={(e) => handleFieldStyleChange("width", parseInt(e.target.value, 10))}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Height (px)</label>
                                <input
                                  type="number"
                                  min="20"
                                  max="800"
                                  value={f.height || "120"}
                                  onChange={(e) => handleFieldStyleChange("height", parseInt(e.target.value, 10))}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
              {/* Preset Layout Selection */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-800">Select Preset Layout</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Choose from our designed standard templates or click Layout 0 to construct a fully customized layout from scratch.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {selectedLayout === 0
                      ? "Custom Designer Layout"
                      : selectedLayout >= 13
                        ? `Shared Layout ${selectedLayout - 12} (${sharedLayouts[selectedLayout - 13]?.schoolName})`
                        : `Layout ${selectedLayout}`} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                  {[
                    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                    ...sharedLayouts.map((_, idx) => 13 + idx)
                  ].map((num) => {
                    const isShared = num >= 13;
                    const sharedLayout = isShared ? sharedLayouts[num - 13] : null;
                    const sharedConfig = sharedLayout?.config;
                    const sharedTheme = sharedLayout?.theme;

                    return (
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
                        className={`group flex flex-col items-center gap-1.5 sm:gap-3 p-1 sm:p-2 rounded-2xl sm:rounded-3xl transition-all duration-200 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 ${selectedLayout === num
                          ? "scale-[1.01]"
                          : "hover:opacity-95"
                          }`}
                      >
                        {/* Scaled-down card preview */}
                        <div
                          className={`relative overflow-hidden rounded-lg sm:rounded-[1rem] w-32 sm:w-52 md:w-56 h-48 sm:h-80 bg-white ${selectedLayout === num ? "ring-2 ring-violet-300" : ""
                            }`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {num === 0 && !idCardLayoutConfig.backgroundUrl ? (
                              <div className="text-[10px] font-extrabold text-slate-400 text-center px-4 select-none">
                                Click to design custom layout
                              </div>
                            ) : isShared && !sharedConfig?.backgroundUrl ? (
                              <div className="text-[10px] font-extrabold text-slate-400 text-center px-4 select-none">
                                No Background
                              </div>
                            ) : (
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
                                  layout={isShared ? 0 : num}
                                  theme={isShared ? (sharedTheme || theme) : theme}
                                  school={{
                                    name: school.name,
                                    caption: school.caption,
                                    address: school.address,
                                    logoUrl: school.logoUrl,
                                    signatureUrl: school.signatureUrl,
                                    phone: school.phone,
                                    idCardLayoutConfig: isShared ? sharedConfig : idCardLayoutConfig,
                                  }}
                                  student={DUMMY_STUDENT}
                                  classNameStr="Demo Class"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-bold transition-colors line-clamp-1 ${selectedLayout === num
                            ? "text-violet-600"
                            : "text-gray-500"
                            }`}
                        >
                          {num === 0
                            ? "Custom Designer"
                            : isShared
                              ? `Shared Layout ${num - 12} (${sharedLayout?.schoolName})`
                              : `Layout ${num}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: Document Studio ──────────────────────── */}
          {activeTab === "documents" && isAdmin && (
            <DocumentStudioTab
              schoolId={schoolId}
              schoolName={school.name}
              students={school.classes.flatMap(c =>
                (c.students || []).map(s => ({
                  ...s,
                  class: { id: c.id, name: c.name, customValues: (c as any).customValues },
                  school: school
                }))
              )}
              customFieldsConfig={school.customFieldsConfig ? (typeof school.customFieldsConfig === 'string' ? JSON.parse(school.customFieldsConfig) : school.customFieldsConfig) : {}}
            />
          )}

          {/* ──────────────────────────────────────────────────────────────── */}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showClass && (
        <ClassForm
          schoolId={schoolId}
          onClose={() => setShowClass(false)}
          onSuccess={() => {
            setShowClass(false);
            fetchSchool();
          }}
        />
      )}

      {showSchoolForm && (
        <SchoolForm
          onClose={() => setShowSchoolForm(false)}
          onSuccess={() => {
            setShowSchoolForm(false);
          }}
        />
      )}

      {showEditSchool && school && canEditSchool && (
        <SchoolForm
          school={{
            id: school.id,
            name: school.name,
            caption: school.caption,
            address: school.address,
            phone: school.phone,
            logoUrl: school.logoUrl,
            signatureUrl: school.signatureUrl,
            idCardLayout: school.idCardLayout,
          }}
          onClose={() => setShowEditSchool(false)}
          onSuccess={() => {
            setShowEditSchool(false);
            fetchSchool();
            window.dispatchEvent(new Event("schools-updated"));
          }}
        />
      )}

      {showCreds && canEditSchool && (
        <CredentialsModal
          schoolId={schoolId}
          schoolName={school.name}
          onClose={() => setShowCreds(false)}
        />
      )}

      {showDeleteConfirm && school && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold text-slate-950">Delete School</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-slate-900">{school.name}</strong> and all its students, classes, and credentials? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSchool}
                disabled={isDeletingSchool}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 border-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isDeletingSchool ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Delete School"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
