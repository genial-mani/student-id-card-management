"use client";
import { useMemo } from "react";
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
  customFieldsConfig?: any;
  selectedIds?: string[];
  onSelectAll?: (selected: boolean) => void;
  onSelectOne?: (id: string, selected: boolean) => void;
}

export default function StudentListTable({
  students,
  isAdmin,
  onEdit,
  onDelete,
  onPreview,
  sortBy,
  onSortChange,
  customFieldsConfig,
  selectedIds = [],
  onSelectAll,
  onSelectOne,
}: StudentListTableProps) {
  const { fields, activeCustomFields } = useMemo(() => {
    const defaults = [
      { key: "name", label: "Student Name", type: "text", required: true, default: true, enabled: true },
      { key: "camSno", label: "CAM Serial No", type: "text", required: false, default: true, enabled: true },
      { key: "fatherName", label: "Father Name", type: "text", required: false, default: true, enabled: true },
      { key: "fatherPhone", label: "Father Phone", type: "text", required: false, default: true, enabled: true },
      { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true }
    ];
    if (!customFieldsConfig) {
      return { fields: defaults, activeCustomFields: [] };
    }
    try {
      const parsed = typeof customFieldsConfig === "string" ? JSON.parse(customFieldsConfig) : customFieldsConfig;
      const studentFields = (parsed?.student || defaults).filter(
        (f: any) => f.key !== "motherName" && f.key !== "motherPhone"
      );
      const classFields = (parsed?.class || []).filter(
        (f: any) => f.key !== "name"
      );

      const customClass = classFields
        .filter((f: any) => !f.default && f.enabled !== false)
        .map((f: any) => ({ ...f, source: "class" as const }));

      const customStudent = studentFields
        .filter((f: any) => !f.default && f.enabled !== false)
        .map((f: any) => ({ ...f, source: "student" as const }));

      return {
        fields: studentFields,
        activeCustomFields: [...customClass, ...customStudent],
      };
    } catch {
      return { fields: defaults, activeCustomFields: [] };
    }
  }, [customFieldsConfig]);

  const isEnabled = (key: string) => {
    const field = fields.find((f: any) => f.key === key);
    return field ? field.enabled !== false : true;
  };

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
              isCurrent ? "opacity-100 text-violet-600" : "opacity-30 group-hover:opacity-80"
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
            <tr className="bg-gray-55 border-b border-gray-150">
              {onSelectAll && (
                <th className="px-4 py-3 text-left w-12 select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    aria-label="Select all students"
                  />
                </th> 
              )}
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-16 select-none">
                Photo
              </th>
              {renderSortableHeader("name", "Student Name")}
              {renderSortableHeader("camSno", "CAM S.No")}
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                Class
              </th>
              {isEnabled("fatherName") && renderSortableHeader("fatherName", "Father Name")}
              {isEnabled("fatherPhone") && (
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                  Father Phone
                </th>
              )}
              {isEnabled("address") && (
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                  Address
                </th>
              )}
              {/* Custom Fields Headers */}
              {activeCustomFields.map((cf: any) => (
                <th key={`${cf.source || "student"}_${cf.key}`} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
                  {cf.label}
                </th>
              ))}
              {(isAdmin || onPreview) && (
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-24 select-none">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
              let customVals = student.customValues;
              if (typeof customVals === "string") {
                try {
                  customVals = JSON.parse(customVals);
                } catch {
                  customVals = null;
                }
              }
              return (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50/50 transition-colors align-middle"
                >
                  {/* Selection Checkbox */}
                  {onSelectOne && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        checked={selectedIds.includes(student.id)}
                        onChange={(e) => onSelectOne(student.id, e.target.checked)}
                        aria-label={`Select ${student.name}`}
                      />
                    </td>
                  )}

                  {/* Photo */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {student.profilePictureUrl ? (
                      <img
                        src={student.profilePictureUrl}
                        alt={student.name}
                        className="w-9 h-9 rounded-full object-cover bg-gray-100 border border-gray-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-violet-50 text-violet-300 flex items-center justify-center border border-violet-100">
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
                    <span className="inline-block text-[10px] sm:text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                      {student.className}
                    </span>
                  </td>

                  {/* Father Name */}
                  {isEnabled("fatherName") && (
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                      {student.fatherName || "—"}
                    </td>
                  )}

                  {/* Father Phone */}
                  {isEnabled("fatherPhone") && (
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
                  )}

                  {/* Address */}
                  {isEnabled("address") && (
                    <td
                      className="px-4 py-3 text-gray-605 max-w-[240px] truncate font-medium"
                      title={student.address}
                    >
                      {student.address || "—"}
                    </td>
                  )}

                  {/* Custom Fields Values */}
                  {activeCustomFields.map((cf: any) => {
                    let val = "—";
                    if (cf.source === "class") {
                      let classVals = (student as any).classCustomValues;
                      if (typeof classVals === "string") {
                        try {
                          classVals = JSON.parse(classVals);
                        } catch {
                          classVals = null;
                        }
                      }
                      val = classVals?.[cf.key] || "—";
                    } else {
                      val = customVals?.[cf.key] || "—";
                    }

                    return (
                      <td key={`${cf.source || "student"}_${cf.key}`} className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                        {val}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  {(isAdmin || onPreview) && (
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onPreview && (
                          <button
                            onClick={() => onPreview(student)}
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-150 text-gray-500 hover:text-violet-650 flex items-center justify-center transition-colors cursor-pointer"
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
                              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-violet-50 border border-gray-100 hover:border-violet-150 text-gray-500 hover:text-violet-605 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit student details"
                              aria-label="Edit student"
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} size={14} color="currentColor" strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => onDelete(student.id, student.name)}
                              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
