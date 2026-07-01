"use client";

/**
 * /class/[id]/print  —  EXACT 300 DPI COMPOSITION
 * ═══════════════════════════════════════════════════════
 * * A4 @ 300 DPI  = 3508 x 2480 pixels
 * ID Card       = 638 x 1013 pixels (Exactly 54x86mm CR80 format @ 300 DPI)
 * * We do NOT scale the cards. We place exactly 8 of them (4 columns, 2 rows)
 * and mathematically distribute the leftover space as margins/gaps.
 */

import { useState, useEffect, useRef, useCallback, CSSProperties, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import IdCard, { CardTheme } from "@/components/IdCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PrintSettingsPanel } from "@/components/PrintSettingsPanel";
import { PrintSettings, calculatePrintGrid } from "@/utils/printLayoutEngine";

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

// ─── Exact Math & Dimensions (NO SCALING) ──────────────────────────────────────

const CARD_W = 673;
const CARD_H = 1087;
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
  });

  const printGrid = useMemo(() => calculatePrintGrid(printSettings, CARD_W, CARD_H), [printSettings]);

  function getSlotPos(idx: number) {
    if (!printGrid.fits || printGrid.itemsPerPage === 0) return { x: 0, y: 0 };
    const col = idx % printGrid.cols;
    const row = Math.floor(idx / printGrid.cols);
    const actualGapPx = printSettings.gapMm !== undefined ? printSettings.gapMm * 3.7795275591 : 24;
    return {
      x: printGrid.offsetX + col * (CARD_W + actualGapPx),
      y: printGrid.offsetY + row * (CARD_H + actualGapPx),
    };
  }

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
          const classMap = new Map((schoolObj.classes || []).map((c: any) => [c.id, c.name]));
          const studentsWithClass = (schoolObj.students || []).map((s: any) => ({
            ...s,
            className: classMap.get(s.classId) || "N/A",
          }));
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
        if (res.ok) setClassData(await res.json());
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
    }
  }, [classData]);

  // Give images 1.5 seconds to fully load from Cloudinary before allowing PDF generation
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(()=>{
    if(user){
      if(user.role !== "admin"){
        setForbidden(true);
      }
    }
  },[user])

  // ── Sheet slices ────────────────────────────────────────────────────────────

  const students = classData?.students ?? [];
  const CPP = printGrid.itemsPerPage > 0 ? printGrid.itemsPerPage : 1;
  const totalSheets = Math.max(1, Math.ceil(students.length / CPP));
  const sheets: Student[][] = Array.from({ length: totalSheets }, (_, i) =>
    students.slice(i * CPP, (i + 1) * CPP),
  );

  // ── PDF core ────────────────────────────────────────────────────────────────

  /**
   * Capture one IdCard to a Data URL using html-to-image
   */
  const captureCardImage = async (
    toPng: any,
    studentId: string,
  ): Promise<HTMLImageElement | null> => {
    const el = cardRefs.current.get(studentId);
    if (!el) return null;

    try {
      // Capture exactly at 1:1 pixel ratio
      const dataUrl = await toPng(el, {
        pixelRatio: 1,
        backgroundColor: "#ffffff",
        width: CARD_W,
        height: CARD_H,
      });

      // Convert Data URL to an Image object so we can draw it on the A4 canvas
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      return img;
    } catch (err) {
      console.error("Capture failed for", studentId, err);
      return null;
    }
  };

  /**
   * Composite images exactly onto the Print Canvas
   */
  const buildPrintCanvas = (
    cardImages: (HTMLImageElement | null)[],
    sheetStudents: Student[],
  ): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = printGrid.paperW;
    canvas.height = printGrid.paperH;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, printGrid.paperW, printGrid.paperH);

    sheetStudents.forEach((_, i) => {
      const img = cardImages[i];
      if (!img) return;
      const { x, y } = getSlotPos(i);
      ctx.drawImage(img, x, y, CARD_W, CARD_H);
    });

    return canvas;
  };

  /**
   * Main PDF generation function.
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
    setDlProgress("Loading libraries…");

    try {
      const [h2iMod, jsPDFMod] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const { toPng } = h2iMod;
      const jsPDF = jsPDFMod.default || (jsPDFMod as any).jsPDF;

      const pdf = new jsPDF({
        orientation: printSettings.paperOrientation,
        unit: "px",
        format: [printGrid.paperW, printGrid.paperH],
      });

      for (let pi = 0; pi < indices.length; pi++) {
        const sheetIdx = indices[pi];
        const sheetStudents = sheets[sheetIdx];

        setDlProgress(
          `Sheet ${pi + 1} / ${indices.length}: capturing ${sheetStudents.length} card${sheetStudents.length !== 1 ? "s" : ""}…`,
        );

        // Capture cards
        const cardImages = await Promise.all(
          sheetStudents.map((s) => captureCardImage(toPng, s.id)),
        );

        setDlProgress(
          `Sheet ${pi + 1} / ${indices.length}: compositing sheet…`,
        );

        const canvas = buildPrintCanvas(cardImages, sheetStudents);
        const imgData = canvas.toDataURL("image/jpeg", 0.97);

        if (pi > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, printGrid.paperW, printGrid.paperH);
      }

      const safe = (s: string) => (s ?? "").replace(/[^a-z0-9]/gi, "_");
      const fileName =
        [
          safe(`${classData?.school.name}`),
          "Class",
          safe(`${classData?.name}`),
          isAll ? `all_${totalSheets}_sheets` : `sheet_${indices[0] + 1}`,
        ].join("_") + ".pdf";

      setDlProgress("Saving PDF…");
      pdf.save(fileName);
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

  // ── Hidden card farm ────────────────────────────────────────────────────────
  const hiddenWrapStyle: CSSProperties = {
    position: "absolute",
    top: "0",
    left: "0",
    zIndex: -1000,
    opacity: 0.01,
    pointerEvents: "none",
  };

  return (
    <>
      <div style={hiddenWrapStyle}>
        {students.map((student) => (
          <div
            key={`farm-${student.id}`}
            ref={(el) => {
              if (el) cardRefs.current.set(student.id, el);
              else cardRefs.current.delete(student.id);
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
        ))}
      </div>

      <PrintSettingsPanel 
        settings={printSettings} 
        onChange={setPrintSettings} 
        showDocumentOrientation={false} 
      />

      <div className="min-h-screen bg-slate-200 pb-12">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm transition-colors disabled:opacity-40 ${
                    downloading === i
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

        <div className="px-4 sm:px-6 py-8 space-y-10 max-w-7xl mx-auto">
          {sheets.map((sheetStudents, sheetIdx) => {
            const emptyCount = CPP - sheetStudents.length;

            return (
              <section key={sheetIdx}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                    Sheet {sheetIdx + 1} / {totalSheets}
                  </span>
                </div>

                <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-300 w-full relative">
                  {!printGrid.fits && (
                    <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center z-50">
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
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
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
                              style={{
                                position: "absolute",
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${CARD_W}px`,
                                height: `${CARD_H}px`,
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
