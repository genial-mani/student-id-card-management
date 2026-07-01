import React from "react";
import { PAPER_SIZES, PaperSize, Orientation, PrintSettings } from "@/utils/printLayoutEngine";
import { CustomDropdown } from "@/components/CustomDropdown";

interface PrintSettingsPanelProps {
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
  showDocumentOrientation?: boolean;
  showPaperOrientation?: boolean;
}

export function PrintSettingsPanel({ settings, onChange, showDocumentOrientation, showPaperOrientation = true }: PrintSettingsPanelProps) {
  return (
    <div className="bg-white p-4 border-b border-gray-200 no-print flex flex-wrap gap-4 items-center justify-between shadow-sm z-40 relative">
      <div className="flex flex-wrap gap-6 items-end">
        {/* Paper Size */}
        <div className="flex flex-col gap-1.5 w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Print Paper Size</label>
          <div className="h-[34px] flex items-center">
            <CustomDropdown
              value={settings.paperSize}
              onChange={(val) => onChange({ ...settings, paperSize: val as PaperSize })}
              options={Object.entries(PAPER_SIZES).map(([key, info]) => ({ label: info.label, value: key }))}
              placeholder="Select Paper Size"
            />
          </div>
        </div>

        {/* Paper Orientation */}
        {showPaperOrientation && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paper Orientation</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200 h-[34px]">
              <button
                onClick={() => onChange({ ...settings, paperOrientation: "portrait" })}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${settings.paperOrientation === "portrait" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                Portrait
              </button>
              <button
                onClick={() => onChange({ ...settings, paperOrientation: "landscape" })}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${settings.paperOrientation === "landscape" ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                Landscape
              </button>
            </div>
          </div>
        )}

        {/* Document Orientation (Optional) */}
        {showDocumentOrientation && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Layout</label>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200 h-[34px]">
              <button
                onClick={() => onChange({ ...settings, documentHorizontal: false })}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${!settings.documentHorizontal ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                Vertical
              </button>
              <button
                onClick={() => onChange({ ...settings, documentHorizontal: true })}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${settings.documentHorizontal ? "bg-white shadow-sm font-semibold text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                Horizontal
              </button>
            </div>
          </div>
        )}

        {/* Gap Configuration */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gap (mm)</label>
          <input 
            type="number" 
            value={settings.gapMm ?? 2}
            onChange={(e) => {
              const val = e.target.value;
              onChange({ ...settings, gapMm: val === "" ? 0 : parseFloat(val) });
            }}
            min="0"
            step="1"
            className="w-[80px] h-[34px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
