"use client";

import { useState, useCallback, useEffect } from "react";
import uploadImageToCloudinary from "@/utils/cloudService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// NEW: Premium cropping library
import Cropper from "react-easy-crop";

interface StudentFormProps {
  schoolId: string;
  classId: string;
  schoolName: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to load the image for canvas extraction
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

export default function StudentForm({
  schoolId,
  classId,
  schoolName,
  onClose,
  onSuccess,
}: StudentFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    idNo: "",
    camSno: "",
    fatherName: "",
    fatherPhone: "",
    address: "",
  });

  const [customFieldsConfig, setCustomFieldsConfig] = useState<any>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── CROPPING STATES ────────────────────────────────────────────────────
  const [isCropping, setIsCropping] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  // ────────────────────────────────────────────────────────────────────────

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
              parsed.student = parsed.student.filter((f: any) => f.key !== "motherName" && f.key !== "motherPhone");
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (!profilePictureFile) {
      alert("Please take a photo or select one from the gallery.");
      setLoading(false);
      return;
    }

    try {
      let profilePictureUrl = "";
      
      const generatedCamId = formData.camSno || crypto.randomUUID().replace(/-/g, '').substring(0, 12);
      const folderName = schoolName.trim().split(/\s+/)[0];

      if (profilePictureFile) {
        profilePictureUrl = await uploadImageToCloudinary(
          profilePictureFile, 
          folderName, 
          generatedCamId
        );
      }

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          camSno: generatedCamId, 
          schoolId,
          classId,
          profilePictureUrl,
          customValues,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create student");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        
        {/* ─── PREMIUM CROPPING UI ─────────────────────────────────────── */}
        {isCropping ? (
          <div className="flex flex-col items-center">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Adjust Photo</h2>
            
            {/* The Cropper Window */}
            <div className="relative w-full h-[60vh] max-h-100 bg-black rounded-xl overflow-hidden mb-4">
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
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="flex w-full gap-3">
              <Button onClick={generateCroppedImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Apply Crop
              </Button>
              <Button onClick={() => setIsCropping(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          
        /* ─── STANDARD FORM UI ─────────────────────────────────────────── */
          <>
            <h2 className="text-lg sm:text-xl font-bold mb-4">Create Student</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              
              <div className="flex flex-col items-center bg-gray-50 p-3 sm:p-4 border border-gray-200 rounded-2xl">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="w-28 sm:w-32 h-36 sm:h-40 object-cover mb-3 sm:mb-4 shadow-sm border border-gray-300 rounded-lg sm:rounded-xl"
                  />
                ) : (
                  <div className="w-28 sm:w-32 h-36 sm:h-40 bg-gray-200 mb-3 sm:mb-4 flex items-center justify-center text-gray-500 text-xs sm:text-sm border border-gray-300 rounded-lg sm:rounded-xl">
                    No Image
                  </div>
                )}

                <div className="w-full flex gap-2">
                  <div className="flex-1">
                    <Label
                      htmlFor="cameraInput"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Take Photo
                    </Label>
                    <input
                      id="cameraInput"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1">
                    <Label
                      htmlFor="galleryInput"
                      className="cursor-pointer flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-gray-200 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Gallery
                    </Label>
                    <input
                      id="galleryInput"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const fields = customFieldsConfig?.student || [
                  { key: "name", label: "Student Name", type: "text", required: true, default: true, enabled: true },
                  { key: "idNo", label: "ID Number", type: "text", required: false, default: true, enabled: true },
                  { key: "camSno", label: "CAM Serial No", type: "text", required: false, default: true, enabled: true },
                  { key: "fatherName", label: "Father's Name", type: "text", required: false, default: true, enabled: true },
                  { key: "fatherPhone", label: "Father's Phone", type: "text", required: false, default: true, enabled: true },
                  { key: "address", label: "Address", type: "text", required: false, default: true, enabled: true }
                ];
                return fields
                  .filter((f: any) => f.key !== "profilePictureUrl" && f.enabled)
                  .map((f: any) => {
                    if (f.default) {
                      return (
                        <div key={f.key}>
                          <Label htmlFor={f.key} className="text-xs sm:text-sm">
                            {f.label} {f.required && <span className="text-rose-500">*</span>}
                          </Label>
                          {f.key === "address" ? (
                            <Textarea
                              id={f.key}
                              name={f.key}
                              value={formData[f.key as keyof typeof formData] || ""}
                              onChange={handleInputChange}
                              required={f.required}
                              rows={3}
                              className="text-xs sm:text-sm mt-1"
                            />
                          ) : (
                            <Input
                              id={f.key}
                              type={f.key.toLowerCase().includes("phone") ? "tel" : "text"}
                              name={f.key}
                              value={formData[f.key as keyof typeof formData] || ""}
                              onChange={handleInputChange}
                              required={f.required}
                              className="text-xs sm:text-sm mt-1"
                            />
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div key={f.key}>
                          <Label htmlFor={`custom-${f.key}`} className="text-xs sm:text-sm">
                            {f.label} {f.required && <span className="text-rose-500">*</span>}
                          </Label>
                          <Input
                            id={`custom-${f.key}`}
                            type="text"
                            value={customValues[f.key] || ""}
                            onChange={(e) =>
                              setCustomValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                            }
                            required={f.required}
                            className="text-xs sm:text-sm mt-1"
                          />
                        </div>
                      );
                    }
                  });
              })()}

              <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4">
                <Button type="submit" className="flex-1 text-xs sm:text-sm" disabled={loading}>
                  {loading ? "Creating..." : "Create Student"}
                </Button>
                <Button type="button" variant="outline" className="flex-1 text-xs sm:text-sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}