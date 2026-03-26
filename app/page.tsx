"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SchoolForm from "@/components/SchoolForm";

export default function Home() {
  const [showSchoolForm, setShowSchoolForm] = useState(false);

  const handleCreateSchool = () => {
    setShowSchoolForm(true);
  };

  const handleSchoolCreated = () => {
    // Refresh will happen automatically due to useEffect in Sidebar
    window.location.reload();
  };

  return (
    <div className="flex">
      <Sidebar onCreateSchool={handleCreateSchool} />

      <div className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Student ID Card Management System
          </h1>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Welcome to the Student ID Management System
              </h2>
              <p className="text-gray-600 mb-6">
                Manage schools, classes, and students efficiently. Use the
                sidebar to navigate between schools or create a new one.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Schools
                  </h3>
                  <p className="text-blue-700">
                    Create and manage educational institutions
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Classes
                  </h3>
                  <p className="text-green-700">
                    Organize students into classes and sections
                  </p>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Students
                  </h3>
                  <p className="text-purple-700">
                    Manage student information and ID cards
                  </p>
                </div>
              </div>
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
