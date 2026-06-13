"use client";

import { useState, useEffect, useCallback } from "react";
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

  // Design Studio State
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState(1);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [savingLayout, setSavingLayout] = useState(false);

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

          {/* ── Design Studio ───────────────────────────────── */}
          {isDesignMode && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-100 p-4 sm:p-5 lg:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-indigo-900">
                    ID Card Design Studio
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Design layout and colors are saved directly to this school's global settings.
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
                    className="flex items-center gap-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-1.5 px-2.5 sm:px-3 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
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

              {/* ── Typography settings ────────────────────────────────────── */}
              <div className="p-4 sm:p-5 bg-gray-50 rounded-xl mb-6 border border-indigo-50/50">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5h12M9 5v14m0 0H7m2 0h3m4-9h6m-3-3v6m0 0h-2m2 0h2" />
                  </svg>
                  Typography Settings
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* School Name Typography Column */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                      School Name Styling
                    </h3>
                    
                    {/* Font Family */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Font Family</label>
                      <select
                        value={theme.schoolNameFont || ""}
                        onChange={(e) => handleColorChange("schoolNameFont", e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium text-gray-850"
                      >
                        <option value="">Default Theme Font</option>
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size Selector with Slider */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500">Font Size</label>
                        <span className="text-xs font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                          {theme.schoolNameSize || "Default"}
                          {theme.schoolNameSize ? "px" : ""}
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
                          className="text-[10px] font-bold text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Font Weight */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Font Weight</label>
                      <select
                        value={theme.schoolNameWeight || ""}
                        onChange={(e) => handleColorChange("schoolNameWeight", e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium text-gray-850"
                      >
                        <option value="">Default Weight</option>
                        {FONT_WEIGHTS.map((fw) => (
                          <option key={fw.value} value={fw.value}>
                            {fw.label} ({fw.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* School Caption Typography Column */}
                  <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                      School Caption Styling
                    </h3>
                    
                    {/* Font Family */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Font Family</label>
                      <select
                        value={theme.schoolCaptionFont || ""}
                        onChange={(e) => handleColorChange("schoolCaptionFont", e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium text-gray-850"
                      >
                        <option value="">Default Theme Font</option>
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size Selector with Slider */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-500">Font Size</label>
                        <span className="text-xs font-bold text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded">
                          {theme.schoolCaptionSize || "Default"}
                          {theme.schoolCaptionSize ? "px" : ""}
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
                          className="text-[10px] font-bold text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400 cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Font Weight */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-500">Font Weight</label>
                      <select
                        value={theme.schoolCaptionWeight || ""}
                        onChange={(e) => handleColorChange("schoolCaptionWeight", e.target.value)}
                        className="w-full text-sm bg-white border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium text-gray-850"
                      >
                        <option value="">Default Weight</option>
                        {FONT_WEIGHTS.map((fw) => (
                          <option key={fw.value} value={fw.value}>
                            {fw.label} ({fw.value})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                        className={`relative overflow-hidden rounded-lg sm:rounded-[1rem] w-32 sm:w-52 md:w-56 h-48 sm:h-80 bg-white ${
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
                              school={{
                                name: school.name,
                                caption: school.caption,
                                address: school.address,
                                logoUrl: school.logoUrl,
                                signatureUrl: school.signatureUrl,
                                phone: school.phone,
                              }}
                              student={DUMMY_STUDENT}
                              classNameStr="Demo Class"
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

          {/* ── Stats ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">
                {school.classes.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Classes</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
            </div>
            <div className="hidden sm:block bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">
                {isAdmin ? "Admin" : "Staff"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Your Role</p>
            </div>
          </div>

          {/* ── Classes grid ──────────────────────────────────────────────── */}
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
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-950 truncate group-hover:text-indigo-900 transition-colors">
                      All Students
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      {totalStudents} student{totalStudents !== 1 ? "s" : ""} total
                    </p>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-indigo-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
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
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-indigo-900 transition-colors">
                        Class {cls.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        {cls.students?.length ?? 0} student{(cls.students?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No classes yet
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                Create your first class to get started.
              </p>
              <Button
                onClick={() => setShowClass(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Create First Class
              </Button>
            </div>
          )}
          {/* ── Ad Banner Display ─────────────────────────────────────────── */}
          <AdBanner />
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
