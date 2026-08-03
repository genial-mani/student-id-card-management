"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, PencilEdit01Icon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import uploadImageToCloudinary from "@/utils/cloudService";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import ImageEnhancerModal from "@/components/ImageEnhancerModal";

interface StudentData {
  id: string;
  name: string;
  idNo?: string;
  fatherName: string;
  fatherPhone: string;
  address: string;
  classId: string;
  profilePictureUrl?: string;
  camSno?: string;
  customValues?: any;
}

interface ClassOption {
  id: string;
  name: string;
}

interface EditStudentModalProps {
  student: StudentData;
  classes: ClassOption[];
  schoolName: string;
  schoolId: string;
  onClose: () => void;
  onSuccess: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

export default function EditStudentModal({
  student,
  classes,
  schoolName,
  schoolId,
  onClose,
  onSuccess,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalCount,
}: EditStudentModalProps) {
  const [formData, setFormData] = useState({
    name: student.name || "",
    fatherName: student.fatherName || "",
    fatherPhone: student.fatherPhone || "",
    address: student.address || "",
    classId: student.classId || "",
    camSno: student.camSno || "",
  });

  const [customFieldsConfig, setCustomFieldsConfig] = useState<any>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    if (student.customValues) {
      try {
        return typeof student.customValues === "string"
          ? JSON.parse(student.customValues)
          : student.customValues;
      } catch {
        return {};
      }
    }
    return {};
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(student.profilePictureUrl || null);
  const [isEnhancerOpen, setIsEnhancerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── CROPPING STATES ────────────────────────────────────────────────────
  const [isCropping, setIsCropping] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  // ────────────────────────────────────────────────────────────────────────

  // Re-populate state whenever student prop changes
  useEffect(() => {
    setFormData({
      name: student.name || "",
      fatherName: student.fatherName || "",
      fatherPhone: student.fatherPhone || "",
      address: student.address || "",
      classId: student.classId || "",
      camSno: student.camSno || "",
    });
    let parsedCustom = {};
    if (student.customValues) {
      try {
        parsedCustom = typeof student.customValues === "string"
          ? JSON.parse(student.customValues)
          : student.customValues;
      } catch {
        parsedCustom = {};
      }
    }
    setCustomValues(parsedCustom);
    setProfilePictureFile(null);
    setPreviewUrl(student.profilePictureUrl || null);
    setIsCropping(false);
    setError(null);
  }, [student.id, student]);

  // Keyboard navigation shortcuts (when not typing in form inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "ArrowLeft" && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevious, hasNext, onPrevious, onNext]);

  useEffect(() => {
    async function fetchSchoolConfig() {
      try {
        const res = await fetch(`/api/schools/${schoolId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.customFieldsConfig) {
            const parsed = typeof data.customFieldsConfig === "string"
              ? JSON.parse(data.customFieldsConfig)
              : data.customFieldsConfig;
            if (parsed && parsed.student) {
              parsed.student = parsed.student.filter((f: any) => f.key !== "motherName" && f.key !== "motherPhone" && f.key !== "idNo" && f.key !== "camSno" && f.key !== "designation");
            }
            setCustomFieldsConfig(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to fetch school custom fields config", err);
      }
    }
    fetchSchoolConfig();
  }, [schoolId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const generateCroppedImage = async () => {
    if (!imgSrc || !croppedAreaPixels) return;

    try {
      const image = await createImage(imgSrc);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Draw the cropped area onto the canvas
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      // Convert to file
      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], "profile-pic.jpg", { type: "image/jpeg" });
        setProfilePictureFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        setIsCropping(false);
      }, "image/jpeg", 0.95);
    } catch (e) {
      console.error("Failed to crop image", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name.trim()) {
      setError("Student Name is required.");
      setLoading(false);
      return;
    }

    if (!formData.classId) {
      setError("Please select a class.");
      setLoading(false);
      return;
    }

    try {
      let finalPictureUrl = student.profilePictureUrl || "";
      let finalCamSno = formData.camSno.trim() || student.camSno || "";

      if (profilePictureFile) {
        // Generate a new CAM Serial Number when photo is updated
        const generatedCamSno = (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().replace(/-/g, "").substring(0, 12)
          : Math.random().toString(36).substring(2, 14));

        // Use user-provided camSno if modified from old value, otherwise use generatedCamSno
        finalCamSno = (formData.camSno.trim() && formData.camSno.trim() !== (student.camSno || ""))
          ? formData.camSno.trim()
          : generatedCamSno;

        const cleanCamId = finalCamSno.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 12);
        const folderName = schoolName.trim().split(/\s+/)[0];

        const rawUrl = await uploadImageToCloudinary(
          profilePictureFile,
          folderName,
          cleanCamId
        );
        finalPictureUrl = `${rawUrl.split("?")[0]}?v=${Date.now()}`;
      }

      const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          fatherName: formData.fatherName.trim(),
          fatherPhone: formData.fatherPhone.trim(),
          address: formData.address.trim(),
          classId: formData.classId,
          camSno: finalCamSno,
          profilePictureUrl: finalPictureUrl,
          customValues,
        }),
      });

      if (response.ok) {
        toast.success("Student details updated successfully!");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update student records");
        toast.error(errorData.error || "Failed to update student records");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-1 sm:p-4">
      <div 
        className="bg-white rounded-2xl p-3 w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-title"
      >
        {isCropping ? (
          <div className="flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Adjust Photo</h2>
            
            {/* The Cropper Window */}
            <div className="relative w-full h-[50vh] max-h-80 bg-black rounded-xl overflow-hidden mb-4">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                aspect={12/15} // Perfect ID card ratio
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full mb-6 px-2">
              <Label className="text-xs text-gray-500 mb-2 block">Zoom</Label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>

            <div className="flex w-full gap-3">
              <Button onClick={generateCroppedImage} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                Apply Crop
              </Button>
              <Button onClick={() => setIsCropping(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors rounded-full bg-gray-100 hover:bg-gray-200 flex items-center p-1.5 justify-center cursor-pointer z-10"
              aria-label="Close modal"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={2} />
            </button>

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 pr-10">
              <div className="flex items-center gap-2">
                <h2 id="edit-student-title" className="text-lg font-bold text-gray-900">
                  Edit Student Details
                </h2>
                {typeof currentIndex === "number" && typeof totalCount === "number" && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-violet-50 text-violet-700 rounded-full border border-violet-200">
                    {currentIndex + 1} of {totalCount}
                  </span>
                )}
              </div>

              {(onPrevious || onNext) && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={!hasPrevious}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    title="Previous Student"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!hasNext}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-30 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                    title="Next Student"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs sm:text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Upload Area */}
              <div className="flex flex-col items-center bg-gray-50 p-3 sm:p-4 border border-gray-200 rounded-2xl mb-4">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-28 sm:w-32 h-36 sm:h-40 object-cover mb-2 shadow-sm border border-gray-300 rounded-lg sm:rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEnhancerOpen(true)}
                      className="mb-3 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>☀️</span> Adjust Photo Brightness
                    </button>
                  </div>
                ) : (
                  <div className="w-28 sm:w-32 h-36 sm:h-40 bg-gray-200 mb-3 sm:mb-4 flex items-center justify-center text-gray-500 text-xs sm:text-sm border border-gray-300 rounded-lg sm:rounded-xl">
                    No Image
                  </div>
                )}

                <div className="w-full flex gap-2">
                  <div className="flex-1">
                    <Label
                      htmlFor="editCameraInput"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 py-2 rounded-xl text-xs font-semibold border border-violet-200 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Take Photo
                    </Label>
                    <input
                      id="editCameraInput"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1">
                    <Label
                      htmlFor="editGalleryInput"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-white hover:bg-gray-55 text-gray-700 py-2 rounded-xl text-xs font-semibold border border-gray-200 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Gallery
                    </Label>
                    <input
                      id="editGalleryInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
          <div>
            <Label htmlFor="edit-name" className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">
              Student Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <Label htmlFor="edit-class" className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">
              Class <span className="text-rose-500">*</span>
            </Label>
            <select
              id="edit-class"
              name="classId"
              value={formData.classId}
              onChange={handleInputChange}
              required
              className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
            >
              <option value="" disabled>Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Class {cls.name}
                </option>
              ))}
            </select>
          </div>

          {(() => {
            const fields = customFieldsConfig?.student || [
              { key: "name", label: "Student Name", type: "text", required: true, default: true, enabled: true },
              { key: "fatherName", label: "Father Name", type: "text", required: false, default: true, enabled: true },
              { key: "fatherPhone", label: "Father Phone", type: "text", required: false, default: true, enabled: true },
              { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true }
            ];

            return fields
              .filter((f: any) => f.key !== "name" && f.key !== "profilePictureUrl" && f.enabled)
              .map((f: any) => {
                if (f.default) {
                  return (
                    <div key={f.key}>
                      <Label htmlFor={`edit-${f.key}`} className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </Label>
                      {f.key === "address" ? (
                        <Textarea
                          id={`edit-${f.key}`}
                          name={f.key}
                          value={formData[f.key as keyof typeof formData] || ""}
                          onChange={handleInputChange}
                          required={f.required}
                          rows={3}
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                          className="w-full rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-violet-500 resize-none"
                        />
                      ) : (
                        <Input
                          id={`edit-${f.key}`}
                          type={f.key.toLowerCase().includes("phone") ? "tel" : "text"}
                          name={f.key}
                          value={formData[f.key as keyof typeof formData] || ""}
                          onChange={handleInputChange}
                          required={f.required}
                          placeholder={`e.g. ${f.label}`}
                          className="w-full rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-violet-500"
                        />
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div key={f.key}>
                      <Label htmlFor={`edit-custom-${f.key}`} className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 block">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </Label>
                      <Input
                        id={`edit-custom-${f.key}`}
                        type="text"
                        value={customValues[f.key] || ""}
                        onChange={(e) =>
                          setCustomValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                        }
                        required={f.required}
                        placeholder={`Enter ${f.label.toLowerCase()}...`}
                        className="w-full rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  );
                }
              });
          })()}

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-medium border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
          </>
        )}
      </div>

      <ImageEnhancerModal
        isOpen={isEnhancerOpen}
        onClose={() => setIsEnhancerOpen(false)}
        student={{
          id: student.id,
          name: formData.name || student.name,
          profilePictureUrl: previewUrl || student.profilePictureUrl || "",
        }}
        onPhotoProcessed={(newPhotoUrl, file) => {
          setPreviewUrl(newPhotoUrl);
          setProfilePictureFile(file);
        }}
      />
    </div>
  );
}
