"use client";

/**
 * /class/[id]/print  —  EXACT 300 DPI COMPOSITION
 * ═══════════════════════════════════════════════════════
 * * A4 @ 300 DPI  = 3508 x 2480 pixels
 * ID Card       = 638 x 1013 pixels (Exactly 54x86mm CR80 format @ 300 DPI)
 * * We do NOT scale the cards. We place exactly 8 of them (4 columns, 2 rows)
 * and mathematically distribute the leftover space as margins/gaps.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import IdCard, { CardTheme } from "@/components/IdCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PrintSettingsPanel } from "@/components/PrintSettingsPanel";
import { PrintSettings, calculatePrintGrid, PAPER_SIZES, getPaperInfo, getCardDimensionsMm } from "@/utils/printLayoutEngine";
import { prefetchImages, drawCardOnCanvas } from "@/utils/canvasCardRenderer";
import { jsPDF } from "jspdf";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface School {
  id: string;
  name: string;
  caption: string;
  address: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  idCardLayout?: number | null;
  idCardTheme?: string | null;
  idCardLayoutConfig?: any;
}
interface Student {
  id: string;
  name: string;
  idNo: string;
  camSno: string;
  fatherName: string;
  fatherPhone: string;
  address: string;
  profilePictureUrl: string;
  customValues?: any;
}
interface ClassData {
  id: string;
  name: string;
  school: School;
  students: Student[];
  customValues?: any;
}

// Note: Card dimensions (cardW & cardH) are dynamically computed per school from school.idCardLayoutConfig.
// ─── localStorage ───────────────────────────────────────────────────────────────

const DEFAULT_THEME: CardTheme = {
  primary: "#e85d04",
  secondary: "#ffecd1",
  background: "#f6fff8",
  textMain: "#ffffff",
  textSub: "#4b5563",
};

function loadDesign(id: string): { layout: number; theme: CardTheme } {
  try {
    const layout =
      parseInt(localStorage.getItem(`idcard_layout_${id}`) ?? "", 10) || 1;
    const raw = localStorage.getItem(`idcard_theme_${id}`);
    return { layout, theme: raw ? JSON.parse(raw) : DEFAULT_THEME };
  } catch {
    return { layout: 1, theme: DEFAULT_THEME };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PrintPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [layout, setLayout] = useState(1);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [settled, setSettled] = useState(false);
  const [downloading, setDownloading] = useState<"all" | number | null>(null);
  const [dlProgress, setDlProgress] = useState("");
  const { user } = useAuth();

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    paperSize: "A4",
    paperOrientation: "landscape",
    documentHorizontal: false, // ID cards are always vertical
    gapX: 2,
    gapY: 2,
  });

  const { cardW, cardH } = useMemo(() => {
    const { widthPx, heightPx } = getCardDimensionsMm(classData?.school?.idCardLayoutConfig);
    return {
      cardW: widthPx,
      cardH: heightPx,
    };
  }, [classData]);

  const printGrid = useMemo(() => calculatePrintGrid(printSettings, cardW, cardH), [printSettings, cardW, cardH]);

  function getSlotPos(idx: number) {
    if (!printGrid.fits || printGrid.itemsPerPage === 0) return { x: 0, y: 0 };
    const col = idx % printGrid.cols;
    const row = Math.floor(idx / printGrid.cols);
    const MM_TO_PX = 11.8110236; // 300 DPI print resolution
    const actualGapX = (printSettings.gapX !== undefined ? printSettings.gapX : 2) * MM_TO_PX;
    const actualGapY = (printSettings.gapY !== undefined ? printSettings.gapY : 2) * MM_TO_PX;
    return {
      x: printGrid.offsetX + col * (cardW + actualGapX),
      y: printGrid.offsetY + row * (cardH + actualGapY),
    };
  }



  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      if (classId === "all") {
        const res = await fetch(`/api/schools/${schoolId}`);
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (res.ok) {
          const schoolObj = await res.json();
          const schoolClasses = schoolObj.classes || [];
          const classMap = new Map(schoolClasses.map((c: any) => [c.id, c.name]));
          const classOrderMap = new Map(schoolClasses.map((c: any, index: number) => [c.id, index]));

          const studentsWithClass = (schoolObj.students || [])
            .map((s: any) => ({
              ...s,
              className: classMap.get(s.classId) || "N/A",
            }))
            .sort((a: any, b: any) => {
              // Primary sort: Class order in school (e.g. Nursery, LKG, Class 1, Class 2...)
              const orderA = Number(classOrderMap.get(a.classId) ?? 9999);
              const orderB = Number(classOrderMap.get(b.classId) ?? 9999);
              if (orderA !== orderB) return orderA - orderB;

              // Secondary sort: Student Name / ID / Roll Number
              const idA = (a.idNo || a.camSno || a.name || "").toString();
              const idB = (b.idNo || b.camSno || b.name || "").toString();
              return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
            });

          setClassData({
            id: "all",
            name: "All Students",
            school: schoolObj,
            students: studentsWithClass,
          });
        }
      } else {
        const res = await fetch(`/api/classes/${classId}`);
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (res.ok) {
          const cData = await res.json();
          if (cData && Array.isArray(cData.students)) {
            cData.students.sort((a: any, b: any) => {
              const idA = (a.idNo || a.camSno || a.name || "").toString();
              const idB = (b.idNo || b.camSno || b.name || "").toString();
              return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
            });
          }
          setClassData(cData);
        }
      }
    } catch {
      /**/
    } finally {
      setLoading(false);
    }
  }, [classId, schoolId]);

  useEffect(() => {
    if (!classId) return;
    fetchData();
  }, [classId, fetchData]);

  useEffect(() => {
    if (classData) {
      const dbLayout = classData.school.idCardLayout;
      const dbThemeRaw = classData.school.idCardTheme;

      let finalLayout = (dbLayout !== null && dbLayout !== undefined) ? dbLayout : 1;
      let finalTheme = DEFAULT_THEME;

      if (dbThemeRaw) {
        try {
          finalTheme = JSON.parse(dbThemeRaw);
        } catch (e) {
          console.error("Failed to parse dbThemeRaw", e);
        }
      } else {
        const { layout: l, theme: t } = loadDesign(classData.school.id);
        finalLayout = l;
        finalTheme = t;
      }
      setLayout(finalLayout);
      setTheme(finalTheme);

      if (classData.school?.idCardLayoutConfig) {
        try {
          let cfg = classData.school.idCardLayoutConfig;
          if (typeof cfg === "string") {
            cfg = JSON.parse(cfg);
          }
          if (cfg && cfg.printSettings) {
            setPrintSettings(cfg.printSettings);
          }
        } catch (e) {
          console.error("Failed to parse printSettings from idCardLayoutConfig", e);
        }
      }
    }
  }, [classData]);

  // Give images 1.5 seconds to fully load from Cloudinary before allowing PDF generation
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (user) {
      if (user.role !== "admin") {
        setForbidden(true);
      }
    }
  }, [user])

  // ── Sheet slices ────────────────────────────────────────────────────────────

  const students = classData?.students ?? [];
  const CPP = printGrid.itemsPerPage > 0 ? printGrid.itemsPerPage : 1;
  const totalSheets = Math.max(1, Math.ceil(students.length / CPP));
  const sheets: Student[][] = Array.from({ length: totalSheets }, (_, i) =>
    students.slice(i * CPP, (i + 1) * CPP),
  );

  // ── PDF core ────────────────────────────────────────────────────────────────

  /**
   * Main PDF generation function.
   * Draws cards directly to offscreen Canvas elements (no DOM cloning),
   * then encodes each sheet as JPEG and adds to jsPDF.
   */
  const downloadSheets = async (indices: number[]) => {
    if (!settled) {
      alert(
        "Please wait a moment for images to finish loading, then try again.",
      );
      return;
    }

    const isAll = indices.length > 1;
    setDownloading(isAll ? "all" : indices[0]);

    try {
      const QUALITY_MULTIPLIER = 1.5; // Balances quality with memory limits (v8 string max length)

      // 1. Wait for web fonts (used by Canvas fillText)
      await document.fonts.ready;

      // 3. Pre-fetch every image the cards will need
      setDlProgress("Pre-fetching images…");
      const allStudents = indices.flatMap((i) => sheets[i]);
      const imageCache = await prefetchImages(
        classData!.school,
        allStudents,
        layout,
        classData!.school.idCardLayoutConfig,
      );

      // 4. Render all target sheets to offscreen canvases in parallel
      setDlProgress("Rendering sheets…");
      const sheetImages = await Promise.all(
        indices.map(async (sheetIdx) => {
          const sheetStudents = sheets[sheetIdx];
          const canvas = document.createElement("canvas");

          // Scale canvas physical pixels up for higher quality
          canvas.width = printGrid.paperW * QUALITY_MULTIPLIER;
          canvas.height = printGrid.paperH * QUALITY_MULTIPLIER;

          const ctx = canvas.getContext("2d")!;

          // Scale the drawing context so coordinates remain the same
          ctx.scale(QUALITY_MULTIPLIER, QUALITY_MULTIPLIER);

          // White background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, printGrid.paperW, printGrid.paperH);

          // Draw each card at its slot position
          for (let i = 0; i < sheetStudents.length; i++) {
            const { x, y } = getSlotPos(i);
            drawCardOnCanvas(
              ctx, x, y,
              classData!.school,
              sheetStudents[i],
              (sheetStudents[i] as any).className || classData!.name,
              classData!.customValues,
              layout,
              theme,
              classData!.school.idCardLayoutConfig,
              imageCache,
            );
          }

          // Maximize quality without blowing up file size / hitting string limits
          return canvas.toDataURL("image/jpeg", 0.92);
        }),
      );

      // 5. Build PDF
      setDlProgress("Building PDF…");
      // Determine orientation based on aspect ratio so jsPDF never auto-swaps width & height
      const pdfOrientation = printGrid.paperW > printGrid.paperH ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: "px",
        format: [printGrid.paperW, printGrid.paperH],
      });

      let pageCount = 0;
      for (const imgData of sheetImages) {
        if (pageCount > 0) pdf.addPage([printGrid.paperW, printGrid.paperH], pdfOrientation);
        pdf.addImage(imgData, "JPEG", 0, 0, printGrid.paperW, printGrid.paperH, undefined, "FAST", 0);
        pageCount++;
      }

      // 6. Save / download
      const safe = (s: string) => (s ?? "").replace(/[^a-z0-9]/gi, "_");
      const fileName =
        [
          safe(`${classData?.school.name}`),
          "Class",
          safe(`${classData?.name}`),
          isAll ? `all_${totalSheets}_sheets` : `sheet_${indices[0] + 1}`,
        ].join("_") + ".pdf";

      const finalPdfBytes = new Uint8Array(pdf.output("arraybuffer"));

      if (typeof window !== "undefined" && (window as any).electronAPI) {
        setDlProgress("Sending directly to local printer...");
        try {
          await (window as any).electronAPI.printPdf(Array.from(finalPdfBytes));
          alert("Sent to local printer successfully!");
        } catch (e: any) {
          console.error("Print failed:", e);
          alert("Local print failed: " + e.message);
        }
      } else {
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("PDF error:", err);
      alert(
        `PDF generation failed:\n${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setDownloading(null);
      setDlProgress("");
    }
  };

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Loading class..." />
      </div>
    );

  if (forbidden)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <Button
            onClick={() => router.back()}
            className="bg-blue-600 text-white py-2 px-5 rounded-xl text-sm"
          >
            Go Back
          </Button>
        </div>
      </div>
    );

  if (!classData)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Class not found.</p>
      </div>
    );

  if (students.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No students to print
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Add students to this class first.
          </p>
          <Link
            href={`/school/${schoolId}/students`}
            className="bg-blue-600 text-white py-2 px-5 rounded-xl text-sm"
          >
            Go Back
          </Link>
        </div>
      </div>
    );

  const isBusy = downloading !== null || !settled;

  // ── Native browser print (INSTANT — no html-to-image needed) ───────────────
  const handleNativePrint = () => {
    window.print();
  };

  // Dynamic print CSS based on current paper settings
  const paper = getPaperInfo(printSettings);
  const printPageW = printSettings.paperOrientation === "portrait" ? paper.widthMm : paper.heightMm;
  const printPageH = printSettings.paperOrientation === "portrait" ? paper.heightMm : paper.widthMm;

  const printCSS = `
    @media print {
      @page {
        size: ${printPageW}mm ${printPageH}mm;
        margin: 0;
      }

      /* Hide all screen-only UI */
      .no-print,
      .print-settings-panel,
      .sheet-label,
      .empty-slot {
        display: none !important;
      }

      /* Reset page background */
      body {
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Full-bleed sheets */
      .print-page-wrapper {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }

      .print-sheets-container {
        padding: 0 !important;
        margin: 0 !important;
        max-width: none !important;
        gap: 0 !important;
      }

      .print-sheet {
        page-break-after: always;
        break-after: page;
        margin: 0 !important;
        padding: 0 !important;
      }

      .print-sheet:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      /* Sheet container — remove decorative styles */
      .print-sheet-inner {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
      }

      /* SVG fills the entire print page */
      .print-sheet-inner svg {
        width: ${printPageW}mm !important;
        height: ${printPageH}mm !important;
        display: block !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCSS }} />

      <PrintSettingsPanel
        settings={printSettings}
        onChange={setPrintSettings}
        showDocumentOrientation={false}
      />

      <div className="min-h-screen bg-slate-200 pb-12 print-page-wrapper">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm no-print">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/school/${schoolId}/students`}
                className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  {classData.school.name} — Class {classData.name}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {students.length} cards · {totalSheets} sheet
                  {totalSheets !== 1 ? "s" : ""}
                  {!settled && " · Loading images…"}
                  {!printGrid.fits && <span className="text-rose-500 font-bold ml-2">Error: Paper size too small.</span>}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* ⚡ PRIMARY: Instant native print */}
              <Button
                type="button"
                onClick={handleNativePrint}
                disabled={!settled || !printGrid.fits}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034V3m0 4.034H5.75" />
                </svg>
                ⚡ Print Now (Instant)
              </Button>

              {/* Separator */}
              <span className="text-gray-300 text-xs font-medium">or</span>

              {dlProgress && (
                <span className="text-xs text-fuchsia-700 font-medium flex items-center gap-1.5 mr-1">
                  <svg
                    className="animate-spin w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="truncate max-w-xs">{dlProgress}</span>
                </span>
              )}

              {sheets.map((_, i) => (
                <Button
                  key={i}
                  type="button"
                  onClick={() => downloadSheets([i])}
                  disabled={isBusy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-colors disabled:opacity-40 ${downloading === i
                    ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  {downloading === i ? "…" : `Sheet ${i + 1}`}
                </Button>
              ))}

              <Button
                type="button"
                onClick={() => downloadSheets(sheets.map((_, i) => i))}
                disabled={isBusy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm transition-colors disabled:opacity-40"
              >
                {!settled
                  ? "Loading images…"
                  : downloading === "all"
                    ? "Generating PDF…"
                    : totalSheets === 1
                      ? "Download PDF"
                      : `Download All (${totalSheets} sheets)`}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-8 space-y-10 max-w-7xl mx-auto print-sheets-container">
          {sheets.map((sheetStudents, sheetIdx) => {
            const emptyCount = CPP - sheetStudents.length;

            return (
              <section key={sheetIdx} className="print-sheet">
                <div className="flex items-center justify-between mb-3 sheet-label">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Sheet {sheetIdx + 1} / {totalSheets}
                  </span>
                </div>

                <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-300 w-full relative print-sheet-inner">
                  {!printGrid.fits && (
                    <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center z-50 no-print">
                      <div className="bg-white px-4 py-2 rounded-lg font-bold text-rose-600 shadow-lg">Paper size is too small</div>
                    </div>
                  )}
                  <svg
                    viewBox={`0 0 ${printGrid.paperW} ${printGrid.paperH}`}
                    className="w-full h-auto block"
                  >
                    <foreignObject width={printGrid.paperW} height={printGrid.paperH}>
                      <div
                        style={{
                          width: `${printGrid.paperW}px`,
                          height: `${printGrid.paperH}px`,
                          position: "relative",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        {sheetStudents.map((student, i) => {
                          const { x, y } = getSlotPos(i);
                          return (
                            <div
                              key={student.id}
                              style={{
                                position: "absolute",
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${cardW}px`,
                                height: `${cardH}px`,
                                pointerEvents: "none",
                              }}
                            >
                              <IdCard
                                layout={layout}
                                theme={theme}
                                school={classData.school}
                                student={student}
                                classNameStr={(student as any).className || classData.name}
                                classCustomValues={classData.customValues}
                              />
                            </div>
                          );
                        })}

                        {Array.from({ length: emptyCount }).map((_, i) => {
                          const { x, y } = getSlotPos(sheetStudents.length + i);
                          return (
                            <div
                              key={`empty-${i}`}
                              className="empty-slot"
                              style={{
                                position: "absolute",
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${cardW}px`,
                                height: `${cardH}px`,
                                border: "4px dashed #e2e8f0",
                                borderRadius: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            />
                          );
                        })}
                      </div>
                    </foreignObject>
                  </svg>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
