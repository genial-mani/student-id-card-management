"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import IdCard, { CardTheme } from "@/components/IdCard";

const DEFAULT_THEME: CardTheme = {
  primary: "#e85d04",
  secondary: "#ffecd1",
  background: "#f6fff8",
  textMain: "#ffffff",
  textSub: "#4b5563",
};

interface IdCardPreviewModalProps {
  school: any;
  student: any;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export default function IdCardPreviewModal({
  school,
  student,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalCount,
}: IdCardPreviewModalProps) {
  const idCardLayout = (school.idCardLayout !== null && school.idCardLayout !== undefined) ? school.idCardLayout : 1;
  let idCardTheme = DEFAULT_THEME;
  if (school.idCardTheme) {
    try {
      idCardTheme = JSON.parse(school.idCardTheme);
    } catch (e) {
      console.error("Error parsing school idCardTheme:", e);
    }
  }

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevious, hasNext, onPrevious, onNext, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white border border-gray-150 rounded-2xl shadow-2xl w-full max-w-sm py-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-all cursor-pointer flex items-center justify-center z-10"
          title="Close preview"
          aria-label="Close preview modal"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>

        {/* Modal Title & Navigation Header */}
        <div className="flex items-center gap-3 pb-3 px-6 w-full justify-between border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-base">
              ID Card Preview
            </h3>
            {typeof currentIndex === "number" && typeof totalCount === "number" && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full border border-violet-200">
                {currentIndex + 1} of {totalCount}
              </span>
            )}
          </div>

          {/* Previous / Next buttons in header */}
          {(onPrevious || onNext) && (
            <div className="flex items-center gap-1.5 mr-6">
              <button
                type="button"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                title="Previous Student (Left Arrow)"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!hasNext}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                title="Next Student (Right Arrow)"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {/* ID Card Wrapper scaled to fit */}
        <div className="w-[283px] h-[457px] relative overflow-hidden">
          <div
            style={{
              transform: "scale(0.42)",
              transformOrigin: "top left",
              width: "673px",
              height: "1087px",
            }}
          >
            <IdCard
              layout={idCardLayout}
              theme={idCardTheme}
              school={school}
              student={student}
              classNameStr={student.className || ""}
            />
          </div>
        </div>

        {/* Footer Navigation Hints */}
        {(onPrevious || onNext) && (
          <div className="flex items-center justify-between w-full px-6 pt-4 mt-2 border-t border-gray-100 text-xs text-gray-500">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="flex items-center gap-1 hover:text-violet-600 disabled:opacity-30 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              <span>Previous</span>
            </button>
            <span className="text-[11px] text-gray-400">Use ⬅️ ➡️ arrow keys</span>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="flex items-center gap-1 hover:text-violet-600 disabled:opacity-30 cursor-pointer font-medium disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

