"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface SchoolClass {
  id: string;
  name: string;
}

interface ClassPrintSelectorProps {
  classes: SchoolClass[];
  students: any[];
  selectedClassIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export default function ClassPrintSelector({
  classes = [],
  students = [],
  selectedClassIds = [],
  onChange,
  className = "",
}: ClassPrintSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Compute student count per class
  const classStudentCounts = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach((c) => map.set(c.id, 0));
    students.forEach((st) => {
      const cId = st.classId || st.class?.id;
      if (cId) {
        map.set(cId, (map.get(cId) || 0) + 1);
      }
    });
    return map;
  }, [classes, students]);

  const isAllSelected = selectedClassIds.length === 0 || selectedClassIds.length === classes.length;

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, searchQuery]);

  // Label for trigger button
  const triggerLabel = useMemo(() => {
    if (isAllSelected) {
      return `All Classes (${students.length})`;
    }
    if (selectedClassIds.length === 1) {
      const cls = classes.find((c) => c.id === selectedClassIds[0]);
      const count = cls ? (classStudentCounts.get(cls.id) || 0) : 0;
      return `${cls?.name || "1 Class"} (${count})`;
    }
    const totalSelectedStudents = selectedClassIds.reduce(
      (sum, id) => sum + (classStudentCounts.get(id) || 0),
      0
    );
    return `${selectedClassIds.length} Classes (${totalSelectedStudents})`;
  }, [isAllSelected, selectedClassIds, classes, classStudentCounts, students.length]);

  const handleToggleClass = (classId: string) => {
    if (isAllSelected) {
      // If currently all selected and toggling off one, select all EXCEPT this one
      const newSelected = classes.map((c) => c.id).filter((id) => id !== classId);
      onChange(newSelected);
      return;
    }

    if (selectedClassIds.includes(classId)) {
      const newSelected = selectedClassIds.filter((id) => id !== classId);
      onChange(newSelected);
    } else {
      const newSelected = [...selectedClassIds, classId];
      if (newSelected.length === classes.length) {
        onChange([]); // empty array signifies all
      } else {
        onChange(newSelected);
      }
    }
  };

  const handleSelectAll = () => {
    onChange([]); // all
  };

  const handleSelectOnly = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([classId]);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg border border-gray-200 shadow-2xs hover:border-gray-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/20"
      >
        <span className="text-violet-600 font-bold">🏫</span>
        <span className="truncate max-w-[170px]">{triggerLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header Controls */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`text-[11px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                isAllSelected
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:bg-gray-200/70"
              }`}
            >
              All Classes ({students.length})
            </button>
            {!isAllSelected && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-violet-600 hover:underline cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>

          {/* Search if more than 5 classes */}
          {classes.length > 5 && (
            <div className="p-1.5 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          )}

          {/* Classes List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredClasses.length === 0 ? (
              <div className="py-3 text-center text-xs text-gray-400">No classes found</div>
            ) : (
              filteredClasses.map((cls) => {
                const count = classStudentCounts.get(cls.id) || 0;
                const isChecked = isAllSelected || selectedClassIds.includes(cls.id);

                return (
                  <div
                    key={cls.id}
                    onClick={() => handleToggleClass(cls.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                      isChecked ? "bg-violet-50/70 text-violet-950 font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pointer-events-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 pointer-events-none w-3.5 h-3.5"
                      />
                      <span className="truncate">{cls.name}</span>
                    </label>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] px-1.5 py-0.2 font-bold bg-gray-100 text-gray-500 rounded-full group-hover:bg-white transition-colors">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleSelectOnly(cls.id, e)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-800 opacity-0 group-hover:opacity-100 px-1 py-0.5 rounded hover:bg-violet-100 transition-all cursor-pointer"
                        title="Select only this class"
                      >
                        Only
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
