"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  logoUrl: string;
}

interface SidebarProps {
  onCreateSchool: () => void;
}

export default function Sidebar({ onCreateSchool }: SidebarProps) {
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-screen fixed left-0 top-0 overflow-y-auto z-50">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Student ID Management</h2>

        {/* Create School Button */}
        <button
          onClick={onCreateSchool}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-4"
        >
          + Create School
        </button>

        {/* Schools List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Schools
          </h3>
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/school/${school.id}`}
              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-700 transition-colors"
            >
              {school.logoUrl ? (
                <Image
                  src={school.logoUrl}
                  alt={school.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {school.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium truncate">
                {school.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
