"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SchoolForm from "@/components/SchoolForm";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const { user } = useAuth();

  const handleSchoolCreated = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCreateSchool={() => setShowSchoolForm(true)} />

      {/* Main content — offset for desktop sidebar, top padding for mobile hamburger */}
      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            Student ID Card Management
          </h1>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-5">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
                Welcome{user ? `, ${user.username}` : ""}!
              </h2>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm sm:text-base">
                {user?.role === "admin"
                  ? "You have full admin access. Manage schools, classes, and students from the sidebar."
                  : "Use the sidebar to navigate to your school and manage student ID cards."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <div className="text-2xl mb-2">🏫</div>
                  <h3 className="font-semibold text-blue-900 mb-1">Schools</h3>
                  <p className="text-blue-700 text-sm">Manage educational institutions</p>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                  <div className="text-2xl mb-2">📚</div>
                  <h3 className="font-semibold text-green-900 mb-1">Classes</h3>
                  <p className="text-green-700 text-sm">Organize students by class</p>
                </div>
                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                  <div className="text-2xl mb-2">🪪</div>
                  <h3 className="font-semibold text-purple-900 mb-1">ID Cards</h3>
                  <p className="text-purple-700 text-sm">Generate printable ID cards</p>
                </div>
              </div>

              {user?.role === "admin" && (
                <button
                  onClick={() => setShowSchoolForm(true)}
                  className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm"
                >
                  + Create New School
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSchoolForm && (
        <SchoolForm
          onClose={() => setShowSchoolForm(false)}
          onSuccess={handleSchoolCreated}
        />
      )}
    </div>
  );
}