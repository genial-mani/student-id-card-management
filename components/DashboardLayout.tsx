"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import SchoolForm from "@/components/SchoolForm";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSchoolForm, setShowSchoolForm] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowSchoolForm(true);
    window.addEventListener("open-create-school", handleOpen);
    return () => window.removeEventListener("open-create-school", handleOpen);
  }, []);

  const handleSchoolCreated = () => {
    setShowSchoolForm(false);
    // Dispatch an event to notify other components (e.g., Sidebar, page content)
    window.dispatchEvent(new Event("schools-updated"));
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      <Sidebar
        onCreateSchool={() => setShowSchoolForm(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Container */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 min-w-0">
        {children}
      </div>

      {/* Create School Modal Form */}
      {showSchoolForm && (
        <SchoolForm
          onClose={() => setShowSchoolForm(false)}
          onSuccess={handleSchoolCreated}
        />
      )}
    </div>
  );
}
