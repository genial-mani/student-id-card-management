"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
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
}

export default function IdCardPreviewModal({ school, student, onClose }: IdCardPreviewModalProps) {
  const idCardLayout = (school.idCardLayout !== null && school.idCardLayout !== undefined) ? school.idCardLayout : 1;
  let idCardTheme = DEFAULT_THEME;
  if (school.idCardTheme) {
    try {
      idCardTheme = JSON.parse(school.idCardTheme);
    } catch (e) {
      console.error("Error parsing school idCardTheme:", e);
    }
  }

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

        {/* Modal Title */}
        <h3 className="font-bold text-gray-900 text-lg pb-2">
          ID Card Preview
        </h3>

        {/* ID Card Wrapper scaled to fit */}
        <div className="w-[283px] h-[457px] relative overflow-hidden ">
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
      </div>
    </div>
  );
}
