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

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  classes: Class[];
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
      <Sidebar onCreateSchool={() => setShowSchoolForm(true)} />
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
      <Sidebar onCreateSchool={() => setShowSchoolForm(true)} />

      <div className="lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 flex items-center justify-center w-full lg:max-w-[calc(100%-256px)] mx-auto">
        <div className="w-full max-w-full flex flex-col mx-auto">
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
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    <span className="hidden sm:inline">View Credentials</span>
                    <span className="sm:hidden">Creds</span>
                  </Button>
                )}

                {/* Create class */}
                <Button
                  onClick={() => setShowClass(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
                  <span className="hidden sm:inline">Create Class</span>
                  <span className="sm:hidden">Add Class</span>
                </Button>
              </div>
            </div>
          </div>

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
              {school.classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/class/${cls.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
                      <span className="text-lg">📚</span>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Class {cls.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {cls.students?.length ?? 0} student
                    {(cls.students?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
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
