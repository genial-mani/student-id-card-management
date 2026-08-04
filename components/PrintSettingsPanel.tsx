import React from "react";
import { PAPER_SIZES, PaperSize, Orientation, PrintSettings } from "@/utils/printLayoutEngine";
import { CustomDropdown } from "@/components/CustomDropdown";

interface PrintSettingsPanelProps {
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
  showDocumentOrientation?: boolean;
  showPaperOrientation?: boolean;
  className?: string;
}

export function PrintSettingsPanel({ settings, onChange, showDocumentOrientation, showPaperOrientation = true, className }: PrintSettingsPanelProps) {
  return (
    <div className={className || "bg-white p-4 border-b border-gray-200 no-print flex flex-wrap gap-4 items-center justify-between shadow-sm z-[60] relative"}>
      <div className="flex flex-wrap gap-6 items-end">
        {/* Paper Size */}
        <div className="flex flex-col gap-1.5 w-[210px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Print Paper Size</label>
          <div className="h-[34px] flex items-center">
            <CustomDropdown
              value={settings.paperSize}
              onChange={(val) => onChange({ ...settings, paperSize: val as PaperSize })}
              options={[
                ...Object.entries(PAPER_SIZES).map(([key, info]) => ({ label: info.label, value: key })),
                { label: "Custom Size...", value: "custom" }
              ]}
              placeholder="Select Paper Size"
            />
          </div>
        </div>

        {/* Custom Paper Dimensions (Shown only when Custom Size is selected) */}
        {settings.paperSize === "custom" && (
          <div className="flex gap-3 items-end animate-in fade-in duration-200">
            {/* Custom Unit Selector (mm / in) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200 h-[34px]">
                <button
                  type="button"
                  onClick={() => {
                    const currentUnit = settings.customUnit || "mm";
                    if (currentUnit !== "mm") {
                      const curW = settings.customWidthMm ?? 8.27;
                      const curH = settings.customHeightMm ?? 11.69;
                      onChange({
                        ...settings,
                        customUnit: "mm",
                        customWidthMm: Math.round(curW * 25.4),
                        customHeightMm: Math.round(curH * 25.4),
                      });
                    }
                  }}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-colors ${
                    (settings.customUnit || "mm") === "mm"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  mm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentUnit = settings.customUnit || "mm";
                    if (currentUnit !== "in") {
                      const curW = settings.customWidthMm ?? 210;
                      const curH = settings.customHeightMm ?? 297;
                      onChange({
                        ...settings,
                        customUnit: "in",
                        customWidthMm: parseFloat((curW / 25.4).toFixed(2)),
                        customHeightMm: parseFloat((curH / 25.4).toFixed(2)),
                      });
                    }
                  }}
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition-colors ${
                    settings.customUnit === "in"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            {/* Custom Width Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Width ({settings.customUnit || "mm"})
              </label>
              <input
                type="number"
                value={settings.customWidthMm ?? ((settings.customUnit || "mm") === "in" ? 8.27 : 210)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value || "0");
                  onChange({ ...settings, customWidthMm: val });
                }}
                min="1"
                max="2000"
                step={(settings.customUnit || "mm") === "in" ? "0.1" : "1"}
                className="w-[85px] h-[34px] px-3 bg-violet-50/50 border border-violet-200 rounded-lg text-sm font-semibold text-violet-900 focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>

            {/* Custom Height Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Height ({settings.customUnit || "mm"})
              </label>
              <input
                type="number"
                value={settings.customHeightMm ?? ((settings.customUnit || "mm") === "in" ? 11.69 : 297)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value || "0");
                  onChange({ ...settings, customHeightMm: val });
                }}
                min="1"
                max="2000"
                step={(settings.customUnit || "mm") === "in" ? "0.1" : "1"}
                className="w-[85px] h-[34px] px-3 bg-violet-50/50 border border-violet-200 rounded-lg text-sm font-semibold text-violet-900 focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>
        )}

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
        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">H-Gap (mm)</label>
            <input 
              type="number" 
              value={settings.gapX ?? 2}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...settings, gapX: val === "" ? 0 : parseFloat(val) });
              }}
              min="0"
              step="1"
              className="w-[70px] h-[34px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">V-Gap (mm)</label>
            <input 
              type="number" 
              value={settings.gapY ?? 2}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...settings, gapY: val === "" ? 0 : parseFloat(val) });
              }}
              min="0"
              step="1"
              className="w-[70px] h-[34px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
