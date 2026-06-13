"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import ClassForm from "@/components/ClassForm";
import CredentialsModal from "@/components/CredentialsModal";
import SchoolForm from "@/components/SchoolForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import IdCard, { CardTheme } from "@/components/IdCard";
import Draggable from "react-draggable";
import uploadImageToCloudinary from "@/utils/cloudService";

// Imported Assets
import card1 from "@/assets/5_5918cf6f-84b7-4ed7-b3d9-0b78a62d3087.webp";
import IdCard1 from "@/assets/71PuhvTnXXL-removebg-preview.png";
import card2 from "@/assets/gcI8aHaX_5.webp";
import flags1 from "@/assets/images (1).jpg";
import flags2 from "@/assets/images (2).jpg";
import printer1 from "@/assets/konica-minolta-accuriopress-c3080-color-production-printer-removebg-preview.png";
import printer2 from "@/assets/RMGT340CCD-1-removebg-preview.png";
import printer3 from "@/assets/solvent-printing-machines.png";
import balaji from "@/assets/tirupati-balaji-hd-wallpaper-for-android-2745524-removebg-preview.png";
import idcard2 from "@/assets/Vertical-Employee-ID-Card-Format-Template-removebg-preview.png";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, AddSquareIcon, PaintBoardIcon, ShieldKeyIcon } from "@hugeicons/core-free-icons";

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

// ─── Ad Banner Component ────────────────────────────────────────────────────────
const AdBanner = () => {
  // Array of all imported images for the scroller
  const scrollerImages = [
    printer1,
    printer2,
    printer3,
    IdCard1,
    idcard2,
    card1,
    card2,
    flags1,
    flags2,
  ];

  const ARUN_DIGITAL_SERVICES = {
    idCards: "ID Cards",
    banner: "Banner",
    weddingCards: "Wedding cards",
    billBooks: "Bill Books",
    visitingCards: "Visiting Cards",
    photoFrame: "Photo Frame",
    tShirts: "T-shirts",
    posters: "Posters",
    batchs: "Batchs",
    kanduvas: "Kanduvas",
  };

  return (
    <div className="relative bg-white rounded-xl shadow-sm border border-indigo-100 mt-5 mb-8 overflow-hidden flex flex-col">
      {/* Required style for the smooth infinite marquee */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee-scroll 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll-2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-2 {
          animation: marquee-scroll-2 40s linear infinite reverse;
        }
        .animate-marquee-2:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Top Section: Details & Maps */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 p-4 sm:p-6 lg:p-8 bg-linear-to-br from-indigo-50/50 to-white">
        {/* Left Side: Brand & Contact */}
        <div className="flex flex-col gap-4 sm:gap-5 flex-1 justify-center min-w-0">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
              Printing Partner
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              <Image
                src={balaji}
                alt="Arun ID Cards & Digital"
                className="w-12 sm:w-16"
              />
              ARUN{" "}
              <span className="text-indigo-600 block sm:inline">
                ID CARDS & DIGITAL
              </span>
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm lg:text-base mt-2 leading-relaxed">
              Your trusted destination for premium ID cards, visiting cards,
              banners, t-shirts, and professional digital printing services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
            {/* Phone */}
            <a
              href="tel:+919000836876"
              className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-0 text-xs sm:text-sm text-gray-700 hover:text-indigo-600 transition-colors group active:bg-indigo-50 sm:active:bg-transparent rounded-lg sm:rounded-none"
            >
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-colors shrink-0">
                <svg
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4"
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
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400 font-medium">
                  Call Us
                </span>
                <span className="font-bold">9000836876</span>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:arunachugatla341@gmail.com"
              className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-0 text-xs sm:text-sm text-gray-700 hover:text-indigo-600 transition-colors group active:bg-indigo-50 sm:active:bg-transparent rounded-lg sm:rounded-none"
            >
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:border-indigo-300 group-hover:bg-indigo-50 transition-colors shrink-0">
                <svg
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400 font-medium">
                  Email Us
                </span>
                <span
                  className="font-bold truncate max-w-37.5 sm:max-w-none"
                  title="arunachugatla341@gmail.com"
                >
                  arunachugatla...
                </span>
              </div>
            </a>

            {/* Address */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-0 text-xs sm:text-sm text-gray-700 sm:col-span-2 rounded-lg sm:rounded-none">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                <svg
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4"
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
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-gray-400 font-medium">
                  Visit Us
                </span>
                <span className="font-bold">
                  Nose Gas Office Beside, KOSGI.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Google Maps iframe */}
        <div className="w-full lg:w-87.5 xl:w-100 shrink-0 h-56 sm:h-64 lg:h-80 rounded-xl lg:rounded-2xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 relative">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d722.530454285001!2d77.71421661955428!3d16.987277208816362!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc9773df25ff433%3A0x1a26aaff8e11d0fb!2sVenkateshwara%20Offset%20Printers!5e0!3m2!1sen!2sin!4v1775272615800!5m2!1sen!2sin"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      {/* services scroller */}
      <div className="overflow-hidden flex mb-4 sm:mb-5">
        <div className="animate-marquee-2 flex gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 w-max items-center">
          {/* We duplicate the array to create a seamless infinite loop effect */}
          {[
            ...Object.entries(ARUN_DIGITAL_SERVICES),
            ...Object.entries(ARUN_DIGITAL_SERVICES),
          ].map(([key, service], idx) => (
            <div
              key={idx}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium rounded-lg border border-indigo-200 shadow-sm flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors"
            >
              {service}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: Image Scroller */}
      <div className="bg-[#1E2939] py-4 sm:py-6 overflow-hidden flex whitespace-nowrap border-t border-indigo-950">
        <div className="animate-marquee flex gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 w-max items-center">
          {/* We duplicate the array to create a seamless infinite loop effect */}
          {[...scrollerImages, ...scrollerImages].map((img, idx) => (
            <div
              key={idx}
              className="w-24 sm:w-32 lg:w-36 h-20 sm:h-24 lg:h-28 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg lg:rounded-xl p-2 sm:p-3 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors"
            >
              <Image
                src={img}
                alt={`Product sample ${idx}`}
                className="max-w-full max-h-full object-contain drop-shadow-lg"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

const DUMMY_STUDENT = {
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
  schoolNameFont: "",
  schoolNameSize: "",
  schoolNameWeight: "",
  schoolCaptionFont: "",
  schoolCaptionSize: "",
  schoolCaptionWeight: "",
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
}: DraggableFieldProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      position={{ x: f.x || 0, y: f.y || 0 }}
      scale={0.5}
      onStart={(e, data) => {
        onDragStart(fieldKey, data.x, data.y, nodeRef.current?.offsetWidth || 0, nodeRef.current?.offsetHeight || 0);
      }}
      onDrag={(e, data) => {
        onDragMove(fieldKey, data.x, data.y, nodeRef.current?.offsetWidth || 0, nodeRef.current?.offsetHeight || 0);
      }}
      onStop={(e, data) => {
        handleFieldDrag(fieldKey, data.x, data.y);
      }}
    >
      <div
        ref={nodeRef}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFieldKey(fieldKey);
        }}
        className={`absolute select-none flex items-center justify-center border cursor-move ${
          selectedFieldKey === fieldKey ? "border-indigo-650 bg-indigo-50/20 ring-1 ring-indigo-650 shadow-sm" : "border-slate-300 bg-white/70"
        }`}
        style={{
          width: f.width ? `${f.width}px` : (isImage ? "120px" : "auto"),
          height: f.height ? `${f.height}px` : (isImage ? "120px" : "auto"),
          padding: isImage ? "0px" : "4px 8px",
          fontFamily: f.fontFamily ? `'${f.fontFamily}', sans-serif` : undefined,
          fontSize: f.fontSize ? `${f.fontSize}px` : "20px",
          fontWeight: f.fontWeight || "500",
          color: f.color || "#000",
        }}
      >
        {displayContent}
      </div>
    </Draggable>
  );
};

export default function SchoolPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tabs & Custom Configurations State
  const [activeTab, setActiveTab] = useState<"classes" | "forms" | "designer">("classes");
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
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldCategory, setNewFieldCategory] = useState<"school" | "class" | "student">("student");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

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
          setCustomFieldsConfig(
            typeof school.customFieldsConfig === "string"
              ? JSON.parse(school.customFieldsConfig)
              : school.customFieldsConfig
          );
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
            { key: "idNo", label: "ID Number", type: "text", required: false, default: true, enabled: true },
            { key: "camSno", label: "CAM Serial No", type: "text", required: false, default: true, enabled: true },
            { key: "fatherName", label: "Father Name", type: "text", required: false, default: true, enabled: true },
            { key: "motherName", label: "Mother Name", type: "text", required: false, default: true, enabled: true },
            { key: "fatherPhone", label: "Father Phone", type: "text", required: false, default: true, enabled: true },
            { key: "motherPhone", label: "Mother Phone", type: "text", required: false, default: true, enabled: true },
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
            student_idNo: { x: 100, y: 560, fontSize: 24, color: "#4b5563", fontWeight: "700", fontFamily: "Inter", visible: true, labelVisible: true },
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

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    const exists = customFieldsConfig[newFieldCategory].some((f: any) => f.key === key);
    if (exists) {
      alert("A field with a similar name already exists.");
      return;
    }

    const newField = {
      key,
      label: newFieldName.trim(),
      type: "text",
      required: newFieldRequired,
      default: false,
      enabled: true
    };

    setCustomFieldsConfig((prev: any) => ({
      ...prev,
      [newFieldCategory]: [...prev[newFieldCategory], newField]
    }));
    setNewFieldName("");
    setNewFieldRequired(false);
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
        alert("Forms setup saved successfully!");
        fetchSchool();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration");
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
    } catch (e) {
      alert("Failed to upload background image");
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

    // Center of canvas
    if (w > 0) {
      const activeCenterX = snappedX + w / 2;
      if (Math.abs(activeCenterX - 336.5) < threshold) {
        snappedX = Math.round(336.5 - w / 2);
      }
    }
    if (Math.abs(snappedX - 336.5) < threshold) {
      snappedX = 336.5;
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
      fields[fieldKey] = {
        ...fields[fieldKey],
        x: snappedX,
        y: snappedY
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
      fields[selectedFieldKey] = {
        ...fields[selectedFieldKey],
        [key]: value
      };
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
        alert("Layout saved successfully!");
        fetchSchool();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save layout");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      alert("Failed to save layout");
    } finally {
      setSavingLayout(false);
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

  // ── Shell wrapper ──────────────────────────────────────────────────────────

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCreateSchool={() => setShowSchoolForm(true)}
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
          <p className="text-gray-500 text-sm">Loading school…</p>
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        onCreateSchool={() => setShowSchoolForm(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 flex items-center justify-center w-full lg:max-w-[calc(100%-256px)] mx-auto">
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
                {isAdmin && (
                  <Button
                    onClick={() => setShowCreds(true)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                  >
                    <HugeiconsIcon icon={ShieldKeyIcon} size={18} strokeWidth={2} />
                    <span className="hidden sm:inline">View Credentials</span>
                    <span className="sm:hidden">Credentials</span>
                  </Button>
                )}

                {/* Design Studio button */}
                {user && (
                  <Button
                    onClick={() => setIsDesignMode(!isDesignMode)}
                    className={`font-medium flex items-center gap-1.5 sm:gap-2 transition-colors ${
                      isDesignMode
                        ? "bg-gray-900 hover:bg-gray-800 text-white"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200"
                    }`}
                  >
                    <HugeiconsIcon icon={PaintBoardIcon} size={18} strokeWidth={2} />
                    <span className="hidden sm:inline">
                      {isDesignMode ? "Exit Studio" : "Design Studio"}
                    </span>
                    <span className="sm:hidden">Design</span>
                  </Button>
                )}

                {/* Create class */}
                <Button
                  onClick={() => setShowClass(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} />
                  <span className="hidden sm:inline">Create Class</span>
                  <span className="sm:hidden">Add Class</span>
                </Button>
              </div>
            </div>
          </div>

          {/* ── Tabs Navigation Bar ────────────────────────────── */}
          <div className="flex border-b border-gray-200 mb-6 gap-2 sm:gap-4 overflow-x-auto select-none">
            <button
              onClick={() => { setActiveTab("classes"); setIsDesignMode(false); }}
              className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "classes"
                  ? "border-indigo-650 text-indigo-650 font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📚 Directory & Classes
            </button>
            {isAdmin && (
              <button
                onClick={() => { setActiveTab("forms"); setIsDesignMode(false); }}
                className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "forms"
                    ? "border-indigo-650 text-indigo-650 font-extrabold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                ⚙️ Form Setup
              </button>
            )}
            <button
              onClick={() => { setActiveTab("designer"); setIsDesignMode(true); }}
              className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "designer"
                  ? "border-indigo-650 text-indigo-650 font-extrabold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🎨 ID Card Studio
            </button>
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
                  <p className="text-2xl font-bold text-gray-900">{isAdmin ? "Admin" : "Staff"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your Role</p>
                </div>
              </div>

              {/* Classes Grid */}
              {school.classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* All Students Aggregate Card */}
                  <Link
                    href={`/school/${schoolId}/students`}
                    className="bg-linear-to-br from-indigo-50/60 to-white rounded-xl border border-indigo-150 p-4 hover:shadow-md hover:border-indigo-300 transition-all group shadow-xs flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 text-left">
                        <h3 className="text-base font-bold text-gray-950 truncate group-hover:text-indigo-900 transition-colors">
                          All Students
                        </h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">
                          {totalStudents} student{totalStudents !== 1 ? "s" : ""} total
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Individual Class Cards */}
                  {school.classes.map((cls) => (
                    <Link
                      key={cls.id}
                      href={`/class/${cls.id}`}
                      className="bg-white rounded-xl border border-gray-150 p-4 hover:shadow-md hover:border-indigo-200 transition-all group flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center transition-colors shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="min-w-0 text-left">
                          <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-900 transition-colors">
                            Class {cls.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {cls.students?.length ?? 0} student{(cls.students?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
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
                  <Button onClick={() => setShowClass(true)} className="bg-green-600 hover:bg-green-700 text-white">
                    Create First Class
                  </Button>
                </div>
              )}
              <AdBanner />
            </div>
          )}

          {/* ── TAB 2: Form Fields Configuration ───────────────── */}
          {activeTab === "forms" && isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-150 p-6 space-y-6 text-left animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-indigo-900">Form Fields Setup</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Decide which fields are enabled on forms and add custom fields. Required default fields cannot be disabled.
                </p>
              </div>

              {/* School Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">🏫 School Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFieldsConfig.school?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("school", f.key)}
                        className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Class Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">📚 Class Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {customFieldsConfig.class?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("class", f.key)}
                        className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Student Form Configuration */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">🎓 Student Form Fields</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {customFieldsConfig.student?.map((f: any) => (
                    <label key={f.key} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none truncate" title={f.key}>
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        disabled={f.required}
                        onChange={() => handleToggleDefaultField("student", f.key)}
                        className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <span className="truncate">{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                    </label>
                  ))}
                </div>

                {/* Render Custom Fields list */}
                {customFieldsConfig.student?.filter((f: any) => !f.default).length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Student Custom Fields</p>
                    <div className="flex flex-wrap gap-2">
                      {customFieldsConfig.student.filter((f: any) => !f.default).map((f: any) => (
                        <span key={f.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700">
                          <span>{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomField("student", f.key)}
                            className="text-gray-400 hover:text-red-500 font-extrabold ml-1 cursor-pointer transition-colors bg-transparent border-0 p-0"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
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
                      value={newFieldName}
                      onChange={(e) => {
                        setNewFieldName(e.target.value);
                        setNewFieldCategory("student");
                      }}
                      className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="shrink-0 flex items-center gap-2 h-10 pb-2">
                    <input
                      type="checkbox"
                      id="fieldRequired"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="fieldRequired" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Required</label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="h-10 px-5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md active:scale-98"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Save forms configuration */}
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  onClick={handleSaveFieldsConfig}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-emerald-600/10 active:scale-98"
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
                  <h2 className="text-lg sm:text-xl font-bold text-indigo-900">
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
                    className="flex items-center gap-1.5 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-xs"
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

              {/* Render controls only for presets (1-12) */}
              {selectedLayout !== 0 && (
                <>
                  {/* Color pickers */}
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

                  {/* Typography Settings */}
                  <div className="p-4 sm:p-5 bg-gray-50 rounded-xl mb-6 border border-indigo-50/50 text-left">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      Typography Settings
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* School Name Typography Column */}
                      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-gray-800 border-b pb-2">School Name Styling</h3>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500">Font Family</label>
                          <select
                            value={theme.schoolNameFont || ""}
                            onChange={(e) => handleColorChange("schoolNameFont", e.target.value)}
                            className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">Default Theme Font</option>
                            {GOOGLE_FONTS.map((font) => (
                              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500">Font Size</label>
                            <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                              {theme.schoolNameSize || "Default"}{theme.schoolNameSize ? "px" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="20"
                              max="70"
                              value={theme.schoolNameSize || "36"}
                              onChange={(e) => handleColorChange("schoolNameSize", e.target.value)}
                              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleColorChange("schoolNameSize", "")}
                              disabled={!theme.schoolNameSize}
                              className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer border-0 bg-transparent"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500">Font Weight</label>
                          <select
                            value={theme.schoolNameWeight || ""}
                            onChange={(e) => handleColorChange("schoolNameWeight", e.target.value)}
                            className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">Default Weight</option>
                            {FONT_WEIGHTS.map((fw) => (
                              <option key={fw.value} value={fw.value}>{fw.label} ({fw.value})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* School Caption Typography Column */}
                      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-gray-800 border-b pb-2">School Caption Styling</h3>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500">Font Family</label>
                          <select
                            value={theme.schoolCaptionFont || ""}
                            onChange={(e) => handleColorChange("schoolCaptionFont", e.target.value)}
                            className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">Default Theme Font</option>
                            {GOOGLE_FONTS.map((font) => (
                              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500">Font Size</label>
                            <span className="text-xs font-bold text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded">
                              {theme.schoolCaptionSize || "Default"}{theme.schoolCaptionSize ? "px" : ""}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="12"
                              max="40"
                              value={theme.schoolCaptionSize || "18"}
                              onChange={(e) => handleColorChange("schoolCaptionSize", e.target.value)}
                              className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleColorChange("schoolCaptionSize", "")}
                              disabled={!theme.schoolCaptionSize}
                              className="text-[10px] font-bold text-gray-400 hover:text-red-500 cursor-pointer border-0 bg-transparent"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-500">Font Weight</label>
                          <select
                            value={theme.schoolCaptionWeight || ""}
                            onChange={(e) => handleColorChange("schoolCaptionWeight", e.target.value)}
                            className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 font-medium"
                          >
                            <option value="">Default Weight</option>
                            {FONT_WEIGHTS.map((fw) => (
                              <option key={fw.value} value={fw.value}>{fw.label} ({fw.value})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Custom Layout Drag & Drop Editor (Shown when selectedLayout === 0) ── */}
              {selectedLayout === 0 && (
                <div className="mt-4 p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col lg:flex-row gap-6 sm:gap-8 text-left animate-in fade-in duration-200">
                  {/* Canvas block (Left) */}
                  <div className="flex flex-col items-center gap-4 shrink-0 mx-auto lg:mx-0">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-gray-800">Dynamic Design Canvas</h3>
                      <p className="text-[10px] text-gray-400">Scale: 50% (Drag elements and click to style)</p>
                    </div>

                    {!idCardLayoutConfig.backgroundUrl ? (
                      <div className="w-[336.5px] h-[543.5px] border-2 border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center p-6 text-center select-none shadow-xs">
                        <span className="text-3xl mb-2">🖼️</span>
                        <p className="text-xs font-bold text-gray-600">No Background Image</p>
                        <p className="text-[10px] text-gray-400 mb-4 font-medium">Upload a custom ID Card layout image to start positioning.</p>
                        
                        <label className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md select-none">
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
                        <div 
                          className="absolute inset-0 bg-cover bg-center pointer-events-none"
                          style={{ 
                            backgroundImage: `url(${idCardLayoutConfig.backgroundUrl})`,
                            backgroundColor: theme.background,
                          }}
                        />

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
                                className="absolute top-[543.5px] left-0 right-0 border-t border-indigo-400/20 z-30 pointer-events-none"
                                style={{ height: "0px", width: "100%" }}
                              />
                              {/* Vertical Center Line */}
                              <div
                                className="absolute left-[336.5px] top-0 bottom-0 border-l border-indigo-400/20 z-30 pointer-events-none"
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
                                <div className="w-full h-full bg-slate-100 border flex items-center justify-center text-[10px] font-bold text-slate-400">Logo</div>
                              );
                            } else if (fieldKey === "student_photo") {
                              displayContent = (
                                <img src={DUMMY_STUDENT.profilePictureUrl} alt="Photo" className="w-full h-full object-cover pointer-events-none" />
                              );
                            } else if (fieldKey === "principal_signature") {
                              displayContent = school.signatureUrl ? (
                                <img src={school.signatureUrl} alt="Sign" className="w-full h-full object-contain pointer-events-none" />
                              ) : (
                                <div className="w-full h-full bg-slate-100 border flex items-center justify-center text-[10px] font-bold text-slate-400">Signature</div>
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
                              else if (fieldKey === "student_idNo") { val = DUMMY_STUDENT.idNo; label = "ID No: "; }
                              else if (fieldKey === "student_camSno") { val = DUMMY_STUDENT.camSno; label = "CAM S.No: "; }
                              else if (fieldKey === "student_fatherName") { val = DUMMY_STUDENT.fatherName; label = "F's Name: "; }
                              else if (fieldKey === "student_motherName") { val = DUMMY_STUDENT.motherName; label = "M's Name: "; }
                              else if (fieldKey === "student_fatherPhone") { val = DUMMY_STUDENT.fatherPhone; label = "Cell: "; }
                              else if (fieldKey === "student_motherPhone") { val = DUMMY_STUDENT.motherPhone; label = "Cell: "; }
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
                          { key: "student_idNo", label: "ID Number" },
                          { key: "student_camSno", label: "CAM Serial No" },
                          { key: "student_fatherName", label: "Father Name" },
                          { key: "student_motherName", label: "Mother Name" },
                          { key: "student_fatherPhone", label: "Father Phone" },
                          { key: "student_motherPhone", label: "Mother Phone" },
                          { key: "student_address", label: "Student Address" },
                          { key: "principal_signature", label: "Signature" },
                          // Add dynamic configurations custom fields
                          ...(customFieldsConfig.school || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `school_custom_${f.key}`, label: `Sch Custom: ${f.label}` })),
                          ...(customFieldsConfig.class || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `class_custom_${f.key}`, label: `Cls Custom: ${f.label}` })),
                          ...(customFieldsConfig.student || []).filter((f: any) => !f.default && f.enabled).map((f: any) => ({ key: `student_custom_${f.key}`, label: `Stu Custom: ${f.label}` }))
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
                                className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
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
                          <div className="p-4 bg-white border-2 border-indigo-150 rounded-xl space-y-4 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center border-b pb-2">
                              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest">
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
                                    <span className="text-indigo-650 bg-indigo-50 px-2 rounded font-bold">{f.fontSize || "20"}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="12"
                                    max="70"
                                    value={f.fontSize || "20"}
                                    onChange={(e) => handleFieldStyleChange("fontSize", parseInt(e.target.value, 10))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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

                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={f.labelVisible !== false}
                                    onChange={(e) => handleFieldStyleChange("labelVisible", e.target.checked)}
                                    className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer w-4 h-4"
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
              )}

              {/* ── Preset Layout Selector ── */}
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 text-left">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Available Layout Layouts
                  </p>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {selectedLayout === 0 ? "Custom Designer Layout" : `Layout ${selectedLayout}`} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
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
                        className={`relative overflow-hidden rounded-lg sm:rounded-[1rem] w-32 sm:w-52 md:w-56 h-48 sm:h-80 bg-white ${
                          selectedLayout === num ? "ring-2 ring-indigo-300" : ""
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {num === 0 && !idCardLayoutConfig.backgroundUrl ? (
                            <div className="text-[10px] font-extrabold text-slate-400 text-center px-4 select-none">
                              Click to design custom layout
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
                                layout={num}
                                theme={theme}
                                school={{
                                  name: school.name,
                                  caption: school.caption,
                                  address: school.address,
                                  logoUrl: school.logoUrl,
                                  signatureUrl: school.signatureUrl,
                                  phone: school.phone,
                                  idCardLayoutConfig: idCardLayoutConfig,
                                }}
                                student={DUMMY_STUDENT}
                                classNameStr="Demo Class"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold transition-colors line-clamp-1 ${
                          selectedLayout === num
                            ? "text-indigo-600"
                            : "text-gray-500"
                        }`}
                      >
                        {num === 0 ? "Custom Designer" : `Layout ${num}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
