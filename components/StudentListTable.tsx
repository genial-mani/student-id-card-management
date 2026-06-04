"use client";

import { Student } from "@/types/student";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

interface StudentListTableProps {
  students: Student[];
  isAdmin: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string, name: string) => void;
  onPreview?: (student: Student) => void;
  sortBy: string;
  onSortChange: (newSortBy: string) => void;
}

export default function StudentListTable({
  students,
  isAdmin,
  onEdit,
  onDelete,
  onPreview,
  sortBy,
  onSortChange,
}: StudentListTableProps) {
  
  const renderSortableHeader = (field: string, label: string) => {
    const isCurrent = sortBy.startsWith(field);
    const isAsc = sortBy.endsWith("-asc");
    
    return (
      <th
        onClick={() => {
          const nextDir = isCurrent && isAsc ? "desc" : "asc";
          onSortChange(`${field}-${nextDir}`);
        }}
        className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-55 hover:text-gray-900 transition-colors select-none group"
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span
            className={`text-[9px] sm:text-[10px] text-gray-400 group-hover:text-gray-600 transition-opacity ${
              isCurrent ? "opacity-100 text-indigo-600" : "opacity-30 group-hover:opacity-80"
            }`}
          >
            {isCurrent ? (isAsc ? "▲" : "▼") : "▲"}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Horizontal scrolling wrapper */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[800px] text-sm border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16 select-none">
                Photo
              </th>
              {renderSortableHeader("name", "Student Name")}
              {renderSortableHeader("camSno", "CAM S.No")}
              {renderSortableHeader("class", "Class")}
              {renderSortableHeader("fatherName", "Father Name")}
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                Father Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                Address
              </th>
              {(isAdmin || onPreview) && (
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24 select-none">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-gray-50/50 transition-colors align-middle"
              >
                {/* Photo */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {student.profilePictureUrl ? (
                    <img
                      src={student.profilePictureUrl}
                      alt={student.name}
                      className="w-9 h-9 rounded-full object-cover bg-gray-100 border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-300 flex items-center justify-center border border-indigo-100">
                      <HugeiconsIcon icon={UserIcon} size={18} color="currentColor" strokeWidth={2} />
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                  {student.name}
                </td>

                {/* CAM S.No */}
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono font-medium">
                  {student.camSno || "—"}
                </td>

                {/* Class Badge */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-block text-[10px] sm:text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    Class {student.className}
                  </span>
                </td>

                {/* Father Name */}
                <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                  {student.fatherName || "—"}
                </td>

                {/* Father Phone */}
                <td className="px-4 py-3 whitespace-nowrap font-semibold">
                  {student.fatherPhone ? (
                    <a
                      href={`tel:${student.fatherPhone}`}
                      className="text-gray-800 hover:underline transition-colors"
                    >
                      {student.fatherPhone}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>

                {/* Address */}
                <td
                  className="px-4 py-3 text-gray-600 max-w-[240px] truncate font-medium"
                  title={student.address}
                >
                  {student.address || "—"}
                </td>

                {/* Actions */}
                {(isAdmin || onPreview) && (
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onPreview && (
                        <button
                          onClick={() => onPreview(student)}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-150 text-gray-500 hover:text-indigo-650 flex items-center justify-center transition-colors cursor-pointer"
                          title="Preview ID Card"
                          aria-label="Preview student ID card"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit(student)}
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-150 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit student details"
                            aria-label="Edit student"
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="currentColor" strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => onDelete(student.id, student.name)}
                            className="w-7 h-7 rounded-lg bg-gray-55 hover:bg-rose-50 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete student records"
                            aria-label="Delete student"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
