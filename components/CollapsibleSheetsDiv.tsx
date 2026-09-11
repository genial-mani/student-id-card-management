"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface CollapsibleSheetsDivProps {
  totalSheets: number;
  downloading?: number | "all" | null;
  onSelectSheet: (sheetIndex: number) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function CollapsibleSheetsDiv({
  totalSheets,
  downloading = null,
  onSelectSheet,
  disabled = false,
  label = "Individual Sheets",
  className = "",
}: CollapsibleSheetsDivProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sheetIndices = useMemo(() => {
    return Array.from({ length: totalSheets }, (_, i) => i);
  }, [totalSheets]);

  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return sheetIndices;
    const q = searchQuery.trim().toLowerCase().replace(/^sheet\s*/i, "");
    return sheetIndices.filter((idx) => {
      const numStr = String(idx + 1);
      return numStr.includes(q);
    });
  }, [sheetIndices, searchQuery]);

  if (totalSheets <= 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {/* Trigger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "bg-violet-50 text-violet-700 border-violet-300 ring-2 ring-violet-500/20"
            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
        }`}
      >
        <span>📄 {label} ({totalSheets})</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible, Reversible, Fixed-Height Scrollable Panel */}
      {isOpen && (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-inner animate-in fade-in zoom-in-95 duration-100">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 text-xs font-semibold text-gray-700">
            <div className="flex items-center gap-1.5">
              <span className="text-violet-600 font-bold">📄</span>
              <span>Click a sheet to process ({totalSheets} total):</span>
            </div>

            <div className="flex items-center gap-2">
              {totalSheets > 10 && (
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Filter sheet #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-28 px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-1 text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-bold px-2 py-0.5 rounded hover:bg-gray-200/80 transition-colors cursor-pointer"
                title="Collapse sheets view"
              >
                ✕ Collapse
              </button>
            </div>
          </div>

          {/* Fixed-height scrollable container (max-h-40 ~ 160px) */}
          <div className="max-h-40 sm:max-h-48 overflow-y-auto pr-1 flex flex-wrap items-center gap-1.5">
            {filteredIndices.length === 0 ? (
              <div className="py-2 text-center text-xs text-gray-400 w-full">
                No matching sheet found
              </div>
            ) : (
              filteredIndices.map((i) => (
                <Button
                  key={i}
                  type="button"
                  onClick={() => onSelectSheet(i)}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-2xs transition-colors disabled:opacity-40 ${
                    downloading === i
                      ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 font-bold"
                      : "border-gray-200 bg-white hover:bg-violet-50 hover:border-violet-300 text-gray-700 hover:text-violet-700"
                  }`}
                >
                  {downloading === i ? "…" : `Sheet ${i + 1}`}
                </Button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
