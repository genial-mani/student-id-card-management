"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import StudentForm from "@/components/StudentForm";
import IdCard, { CardTheme } from "@/components/IdCard";

interface Class {
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
  };
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  idNo: string;
  camSno: string;
  fatherName: string;
  motherName: string;
  fatherPhone: string;
  motherPhone: string;
  address: string;
  profilePictureUrl: string;
}

// Dummy data for the preview studio
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
    "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg", // Standard placeholder
};

export default function ClassPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStudentForm, setShowStudentForm] = useState(false);

  const DEFAULT_LAYOUT = 1;
  const DEFAULT_THEME: CardTheme = {
    primary: "#e85d04",
    secondary: "#ffecd1",
    background: "#f6fff8",
    textMain: "#ffffff",
    textSub: "#4b5563",
  };

  // Design Studio State
  const [isDesignMode, setIsDesignMode] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<number>(DEFAULT_LAYOUT);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (typeof window !== "undefined" && classId) {
      const savedLayout = localStorage.getItem(`idcard_layout_${classId}`);
      const savedTheme = localStorage.getItem(`idcard_theme_${classId}`);

      if (savedLayout) setSelectedLayout(parseInt(savedLayout, 10));
      if (savedTheme) setTheme(JSON.parse(savedTheme));
    }
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchClass();
    }
  }, [classId]);

  const fetchClass = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setClassData(data);
      }
    } catch (error) {
      console.error("Error fetching class:", error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Reset design to default
  const handleResetToDefault = () => {
    setSelectedLayout(DEFAULT_LAYOUT);
    setTheme(DEFAULT_THEME);

    // Clear the customized settings from the browser
    if (classId) {
      localStorage.removeItem(`idcard_layout_${classId}`);
      localStorage.removeItem(`idcard_theme_${classId}`);
    }
  };

  const handleLayoutChange = (layoutNum: number) => {
    setSelectedLayout(layoutNum);
    localStorage.setItem(`idcard_layout_${classId}`, layoutNum.toString());
  };

  const handleColorChange = (key: keyof CardTheme, value: string) => {
    setTheme((prev) => {
      const newTheme = { ...prev, [key]: value };
      localStorage.setItem(`idcard_theme_${classId}`, JSON.stringify(newTheme));
      return newTheme;
    });
  };

  if (loading)
    return <div className="ml-64 p-8 text-center text-xl">Loading...</div>;
  if (!classData)
    return <div className="ml-64 p-8 text-center text-xl">Class not found</div>;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar onCreateSchool={() => {}} />

      <div className="ml-64 flex-1 p-8">
        <div className="max-w-400 mx-auto">
          {/* Class Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2 text-sm">
                <span className="text-gray-500">{classData.school.name}</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 font-medium">
                  {classData.name}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Class {classData.name}
              </h1>
              <p className="text-gray-500">
                {classData.students.length} students enrolled
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsDesignMode(!isDesignMode)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${isDesignMode ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              >
                {isDesignMode ? "Exit Design Studio" : "🎨 Customize ID Design"}
              </button>
              <button
                onClick={() => setShowStudentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                + Add Student
              </button>
            </div>
          </div>

          {/* DESIGN STUDIO PANEL */}
          {isDesignMode && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-6 mb-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-indigo-900">
                  ID Card Design Studio
                </h2>
                <button
                  onClick={handleResetToDefault}
                  className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1.5 px-4 rounded-md transition-colors shadow-sm"
                >
                  ↺ Reset to Default
                </button>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={theme.primary}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Secondary / Accent
                  </label>
                  <input
                    type="color"
                    value={theme.secondary}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Background
                  </label>
                  <input
                    type="color"
                    value={theme.background}
                    onChange={(e) =>
                      handleColorChange("background", e.target.value)
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Header Text
                  </label>
                  <input
                    type="color"
                    value={theme.textMain}
                    onChange={(e) =>
                      handleColorChange("textMain", e.target.value)
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Body Text
                  </label>
                  <input
                    type="color"
                    value={theme.textSub}
                    onChange={(e) =>
                      handleColorChange("textSub", e.target.value)
                    }
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Layout Previews (Horizontal Scroll) */}
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                Select Layout (1-10)
              </h3>
              <div className="flex overflow-x-auto gap-8 pb-8 pt-4 px-4 custom-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((layoutNum) => (
                  <div
                    key={layoutNum}
                    onClick={() => handleLayoutChange(layoutNum)}
                    className={`shrink-0 cursor-pointer rounded-2xl transition-all duration-300 ${selectedLayout === layoutNum ? "ring-8 ring-indigo-500 scale-105" : "hover:scale-105 opacity-70 hover:opacity-100"}`}
                  >
                    {/* Scale down the massive card for preview purposes */}
                    <div
                      style={{
                        transform: "scale(0.4)",
                        transformOrigin: "top left",
                        width: "255px",
                        height: "405px",
                      }}
                      className="pointer-events-none"
                    >
                      <IdCard
                        layout={layoutNum}
                        theme={theme}
                        school={classData.school}
                        student={DUMMY_STUDENT}
                        classNameStr={classData.name}
                      />
                    </div>
                    <div className="text-center mt-2 font-bold text-gray-700">
                      Layout {layoutNum}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actual Students Grid */}
          {!isDesignMode && classData.students.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
              {classData.students.map((student) => (
                <div
                  key={student.id}
                  className="w-full flex justify-center overflow-hidden pb-4"
                >
                  <div
                    style={{
                      transform: "scale(0.55)",
                      transformOrigin: "top center",
                      height: "560px",
                    }}
                  >
                    <IdCard
                      layout={selectedLayout}
                      theme={theme}
                      school={classData.school}
                      student={student}
                      classNameStr={classData.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isDesignMode && classData.students.length === 0 && (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No students added yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start by adding your first student to see the ID cards.
              </p>
              <button
                onClick={() => setShowStudentForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md shadow-md"
              >
                Add First Student
              </button>
            </div>
          )}
        </div>
      </div>

      {showStudentForm && (
        <StudentForm
          schoolId={classData.school.id}
          classId={classId}
          onClose={() => setShowStudentForm(false)}
          onSuccess={() => fetchClass()}
        />
      )}
    </div>
  );
}
