"use client";

import React, { useState, useEffect } from "react";

interface PrintCountLimiterProps {
  label?: string;
  totalAvailable: number;
  countLimit: number | null;
  onChange: (limit: number | null) => void;
  className?: string;
}

export default function PrintCountLimiter({
  label = "Count to print",
  totalAvailable = 0,
  countLimit,
  onChange,
  className = "",
}: PrintCountLimiterProps) {
  const isCustomized = countLimit !== null && countLimit < totalAvailable;
  const [localVal, setLocalVal] = useState<string>(
    countLimit !== null ? String(countLimit) : String(totalAvailable || "")
  );

  // Synchronize when external countLimit or totalAvailable changes
  useEffect(() => {
    if (countLimit !== null) {
      const clamped = Math.min(countLimit, totalAvailable);
      setLocalVal(String(clamped));
      if (clamped !== countLimit) {
        onChange(clamped > 0 ? clamped : null);
      }
    } else {
      setLocalVal(String(totalAvailable || ""));
    }
  }, [countLimit, totalAvailable, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);

    if (raw === "") {
      // User cleared the box while typing
      return;
    }

    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      if (num >= totalAvailable) {
        onChange(null); // All
      } else if (num > 0) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    const num = parseInt(localVal, 10);
    if (isNaN(num) || num <= 0 || num >= totalAvailable) {
      onChange(null);
      setLocalVal(String(totalAvailable || ""));
    } else {
      const clamped = Math.max(1, Math.min(totalAvailable, num));
      onChange(clamped);
      setLocalVal(String(clamped));
    }
  };

  const handleReset = () => {
    onChange(null);
    setLocalVal(String(totalAvailable || ""));
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs hover:border-gray-300 transition-colors ${className}`}
    >
      <span className="font-semibold text-gray-700 whitespace-nowrap">{label}:</span>

      <input
        type="number"
        min={1}
        max={totalAvailable}
        value={localVal}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-16 px-1.5 py-0.5 text-center font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
      />

      <span className="text-gray-400 font-medium whitespace-nowrap">/ {totalAvailable}</span>

      {isCustomized && (
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-bold text-violet-600 hover:text-violet-800 underline ml-1 cursor-pointer"
          title="Reset to all items"
        >
          All
        </button>
      )}
    </div>
  );
}
