"use client";

import React, { useState, useEffect, useRef } from "react";
import { processAndUploadStudentPhoto, loadImage } from "@/utils/imageEnhancer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudentInfo {
  id: string;
  name: string;
  profilePictureUrl: string;
  classId?: string;
  schoolId?: string;
}

interface ImageEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo | null;
  onPhotoUpdated?: (newPhotoUrl: string, studentId: string) => void;
  onPhotoProcessed?: (newPhotoUrl: string, file: File) => void;
}

export default function ImageEnhancerModal({
  isOpen,
  onClose,
  student,
  onPhotoUpdated,
  onPhotoProcessed,
}: ImageEnhancerModalProps) {
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"split" | "single">("split");
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset controls when student changes or modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && student?.profilePictureUrl) {
      setBrightness(100);
      setContrast(100);
      setViewMode("split");
      setIsHoldingOriginal(false);
      setImageLoaded(false);

      loadImage(student.profilePictureUrl)
        .then((img) => {
          if (isMounted) {
            imgRef.current = img;
            setImageLoaded(true);
          }
        })
        .catch((err) => {
          console.error("Failed to load photo for enhancer:", err);
          if (isMounted) {
            toast.error("Failed to load photo. Please check your network connection.");
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, student]);

  // Update canvas live previews
  useEffect(() => {
    if (!imageLoaded || !imgRef.current) return;

    const img = imgRef.current;
    const w = img.naturalWidth || 400;
    const h = img.naturalHeight || 500;

    // 1. Render Original Unedited Canvas (100% Default)
    if (originalCanvasRef.current) {
      const origCanvas = originalCanvasRef.current;
      origCanvas.width = w;
      origCanvas.height = h;
      const ctxOrig = origCanvas.getContext("2d");
      if (ctxOrig) {
        ctxOrig.clearRect(0, 0, w, h);
        ctxOrig.filter = "none";
        ctxOrig.drawImage(img, 0, 0, w, h);
      }
    }

    // 2. Render Enhanced Canvas with filters
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, w, h);
        const activeBrightness = isHoldingOriginal ? 100 : brightness;
        const activeContrast = isHoldingOriginal ? 100 : contrast;
        ctx.filter = `brightness(${activeBrightness}%) contrast(${activeContrast}%)`;
        ctx.drawImage(img, 0, 0, w, h);
      }
    }
  }, [brightness, contrast, imageLoaded, isHoldingOriginal, viewMode]);

  if (!isOpen || !student) return null;

  const handleSave = async () => {
    if (!student.profilePictureUrl) {
      toast.error("Student has no profile picture to adjust.");
      return;
    }

    setSaving(true);
    setSaveStatus("Enhancing photo...");

    try {
      if (onPhotoProcessed || !student.id) {
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/jpeg", 0.95);
          });
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          if (onPhotoProcessed) {
            onPhotoProcessed(dataUrl, file);
          }
          toast.success("Photo brightness adjusted successfully!");
          onClose();
          return;
        }
      }

      setSaveStatus("Uploading enhanced photo to server...");
      const newPhotoUrl = await processAndUploadStudentPhoto(
        student.profilePictureUrl,
        brightness,
        contrast
      );

      setSaveStatus("Updating student record...");
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePictureUrl: newPhotoUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to update student profile photo in database.");
      }

      toast.success(`Photo for ${student.name || "student"} brightened and saved successfully!`);
      if (onPhotoUpdated) {
        onPhotoUpdated(newPhotoUrl, student.id);
      }
      onClose();
    } catch (err: any) {
      console.error("Photo enhancement failed:", err);
      toast.error(err.message || "Failed to save brightened photo.");
    } finally {
      setSaving(false);
      setSaveStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>☀️</span> Adjust Student Photo Brightness
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enhance photo for <strong className="text-gray-800">{student.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* View Mode Bar & Comparison Options */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "split"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                👥 Side-by-Side Comparison
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === "single"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                🖼️ Single View
              </button>
            </div>

            <button
              type="button"
              onMouseDown={() => setIsHoldingOriginal(true)}
              onMouseUp={() => setIsHoldingOriginal(false)}
              onMouseLeave={() => setIsHoldingOriginal(false)}
              onTouchStart={() => setIsHoldingOriginal(true)}
              onTouchEnd={() => setIsHoldingOriginal(false)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors select-none cursor-pointer flex items-center gap-1.5 ${
                isHoldingOriginal
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
              }`}
            >
              <span>👁️</span> {isHoldingOriginal ? "Viewing Original (100%)" : "Hold to View Original"}
            </button>
          </div>

          {/* Live Preview Section */}
          <div className="flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-4 min-h-[260px] relative overflow-hidden shadow-inner">
            {!imageLoaded ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-sm py-8">
                <div className="w-8 h-8 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
                <span>Loading profile photo...</span>
              </div>
            ) : viewMode === "split" ? (
              /* Side-by-Side View */
              <div className="grid grid-cols-2 gap-4 w-full max-h-[300px]">
                {/* Left: Original Photo */}
                <div className="flex flex-col items-center justify-center relative bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <div className="absolute top-2 left-2 z-10 bg-slate-900/90 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700 backdrop-blur-md">
                    Original (100%)
                  </div>
                  <canvas
                    ref={originalCanvasRef}
                    className="max-h-[250px] max-w-full rounded-lg shadow-md border border-slate-800 object-contain"
                  />
                </div>

                {/* Right: Enhanced Photo */}
                <div className="flex flex-col items-center justify-center relative bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <div className="absolute top-2 left-2 z-10 bg-amber-950/90 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-800/60 backdrop-blur-md">
                    {isHoldingOriginal ? "Original (Holding)" : `Enhanced (${brightness}%)`}
                  </div>
                  <canvas
                    ref={canvasRef}
                    className="max-h-[250px] max-w-full rounded-lg shadow-md border border-slate-800 object-contain"
                  />
                </div>
              </div>
            ) : (
              /* Single View */
              <div className="relative max-h-[300px] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-h-[280px] max-w-full rounded-lg shadow-md border border-slate-700 object-contain"
                />
                <div className="absolute top-2 right-2 bg-slate-950/80 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md">
                  {isHoldingOriginal ? "Original Photo (100%)" : `Preview (${brightness}% Bright)`}
                </div>
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Presets</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setBrightness(100); setContrast(100); }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  brightness === 100 && contrast === 100
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Default (100%)
              </button>
              <button
                type="button"
                onClick={() => { setBrightness(120); setContrast(105); }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  brightness === 120
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                +20% Bright
              </button>
              <button
                type="button"
                onClick={() => { setBrightness(135); setContrast(110); }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  brightness === 135
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                +35% Bright
              </button>
              <button
                type="button"
                onClick={() => { setBrightness(150); setContrast(115); }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all ${
                  brightness === 150
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                +50% High
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-gray-200/80">
            {/* Brightness Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <span>☀️</span> Photo Brightness
                </span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {brightness}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Contrast Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <span>🌓</span> Photo Contrast
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {contrast}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium">
            {saving ? (
              <span className="flex items-center gap-2 text-amber-600 font-semibold animate-pulse">
                <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                {saveStatus}
              </span>
            ) : (
              <span>Permanently updates student's picture</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !imageLoaded}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md gap-1.5"
            >
              {saving ? "Saving..." : "☀️ Save & Update Student Photo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
