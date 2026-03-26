"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import ClassForm from "@/components/ClassForm";

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
  students: Student[];
}

interface Student {
  id: string;
  name: string;
}

export default function SchoolPage() {
  const params = useParams();
  const schoolId = params.id as string;

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchSchool();
    }
  }, [schoolId]);

  const fetchSchool = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolId}`);
      if (response.ok) {
        const data = await response.json();
        setSchool(data);
      } else {
        console.error("Failed to fetch school");
      }
    } catch (error) {
      console.error("Error fetching school:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    setShowClassForm(true);
  };

  const handleClassCreated = () => {
    fetchSchool(); // Refresh the school data
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar onCreateSchool={() => {}} />
        <div className="ml-64 flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex">
        <Sidebar onCreateSchool={() => {}} />
        <div className="ml-64 flex-1 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              School not found
            </h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Go back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar onCreateSchool={() => {}} />

      <div className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* School Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {school?.logoUrl ? (
                  <Image
                    src={school?.logoUrl}
                    alt={school?.name}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {school?.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {school?.name}
                  </h1>
                  <p className="text-gray-600">{school?.caption}</p>
                </div>
              </div>

              <button
                onClick={handleCreateClass}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
              >
                + Create Class
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <p className="text-gray-600">{school?.address}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-600">{school?.phone}</p>
              </div>
            </div>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {school?.classes?.map((classItem) => (
              <Link
                key={classItem?.id}
                href={`/class/${classItem?.id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {classItem?.name}
                  </h3>
                  <div className="text-2xl">📚</div>
                </div>
                <p className="text-gray-600">
                  {classItem?.students?.length} student
                  {classItem?.students?.length !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>

          {school?.classes?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No classes yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first class to get started
              </p>
              <button
                onClick={handleCreateClass}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
              >
                Create First Class
              </button>
            </div>
          )}
        </div>
      </div>

      {showClassForm && (
        <ClassForm
          schoolId={schoolId}
          onClose={() => setShowClassForm(false)}
          onSuccess={handleClassCreated}
        />
      )}
    </div>
  );
}
