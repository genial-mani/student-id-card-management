"use client";

import { Student } from "@/types/student";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, CallIcon, Location01Icon, PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

interface StudentCardProps {
  student: Student;
  isAdmin: boolean;
  onEdit: (student: Student) => void;
  onDelete: (id: string, name: string) => void;
  onPreview?: (student: Student) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export default function StudentCard({
  student,
  isAdmin,
  onEdit,
  onDelete,
  onPreview,
  isSelected,
  onSelect,
}: StudentCardProps) {
  return (
    <div className={`group relative rounded-xl border p-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-0 ${isSelected ? 'bg-violet-50/30 border-violet-300' : 'bg-white border-gray-150 hover:border-violet-200'}`}>
      
      {/* Absolute Checkbox for grid selection */}
      {onSelect && (
        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
            checked={!!isSelected}
            onChange={(e) => onSelect(student.id, e.target.checked)}
            aria-label={`Select ${student.name}`}
          />
        </div>
      )}

      {/* Main Info Row */}
      <div className="flex gap-4 items-start min-w-0">
        {/* Left Column: Photo and Class Badge */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-16 sm:w-18">
          {/* Profile Picture */}
          {student.profilePictureUrl ? (
            <img
              src={student.profilePictureUrl}
              alt={student.name}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg object-cover bg-gray-55 border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-violet-50 text-violet-300 flex items-center justify-center border border-violet-100">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          )}
          
          {/* Class Badge under photo */}
          <span className="text-[9px] sm:text-[10px] font-bold text-violet-750 bg-violet-50 border border-violet-100 px-1 py-0.5 rounded-md w-full text-center truncate" title={`Class ${student.className}`}>
            Class {student.className}
          </span>
        </div>

        {/* Student Details */}
        <div className="flex-1 min-w-0">
          {/* Name - Now has full horizontal space */}
          <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate group-hover:text-violet-900 transition-colors" title={student.name}>
            {student.name}
          </h3>

          {/* Details lines */}
          <div className="mt-2.5 space-y-1.5">
            {/* Father Name */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-650">
              <span className="text-gray-400 shrink-0 w-4 flex justify-center">
                <HugeiconsIcon icon={UserIcon} size={14} color="currentColor" strokeWidth={2} />
              </span>
              <span className="font-semibold text-gray-700 truncate" title={student.fatherName}>
                {student.fatherName || "—"}
              </span>
            </div>

            {/* Father Cell */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-650">
              <span className="text-gray-400 shrink-0 w-4 flex justify-center">
                <HugeiconsIcon icon={CallIcon} size={14} color="currentColor" strokeWidth={2} />
              </span>
              {student.fatherPhone ? (
                <a
                  href={`tel:${student.fatherPhone}`}
                  className="font-bold text-gray-800 hover:text-violet-650 hover:underline transition-colors truncate"
                >
                  {student.fatherPhone}
                </a>
              ) : (
                <span className="font-medium text-gray-400">—</span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-650">
              <span className="text-gray-400 shrink-0 w-4 flex justify-center mt-0.5">
                <HugeiconsIcon icon={Location01Icon} size={14} color="currentColor" strokeWidth={2} />
              </span>
              <span className="text-gray-700 font-semibold line-clamp-1 leading-normal" title={student.address}>
                {student.address || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {(isAdmin || onPreview) && (
        <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          {onPreview && (
            <button
              onClick={() => onPreview(student)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-violet-200 hover:bg-violet-50/40 text-violet-600 hover:text-violet-700 transition-all text-xs font-semibold cursor-pointer mr-auto"
              title="Preview ID Card"
              aria-label="Preview student ID card"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(student)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-violet-200 hover:bg-violet-50/40 text-gray-650 hover:text-violet-605 transition-all text-xs font-semibold cursor-pointer"
                title="Edit student details"
                aria-label="Edit student"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={13} color="currentColor" strokeWidth={2} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => onDelete(student.id, student.name)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-rose-200 hover:bg-rose-50/40 text-gray-650 hover:text-rose-605 transition-all text-xs font-semibold cursor-pointer"
                title="Delete student records"
                aria-label="Delete student"
              >
                <HugeiconsIcon icon={Delete02Icon} size={13} color="currentColor" strokeWidth={2} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
