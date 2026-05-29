"use client";

import { useState } from "react";
import uploadImageToCloudinary from "@/utils/cloudService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StudentFormProps {
  schoolId: string;
  classId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentForm({
  schoolId,
  classId,
  onClose,
  onSuccess,
}: StudentFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    idNo: "",
    camSno: "",
    fatherName: "",
    motherName: "",
    fatherPhone: "",
    motherPhone: "",
    address: "",
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // NEW: State for image preview
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      // NEW: Generate a local URL to preview the image instantly
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setProfilePictureFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profilePictureUrl = "";

      // Upload profile picture if provided
      if (profilePictureFile) {
        profilePictureUrl = await uploadImageToCloudinary(profilePictureFile);
      }

      // Create student
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          schoolId,
          classId,
          profilePictureUrl,
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

            <div className="w-full">
              <Label htmlFor="profilePicture" className="text-xs sm:text-sm">
                Profile Picture *
              </Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="bg-white text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-xs sm:text-sm">
              Student Name *
            </Label>
            <Input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="idNo" className="text-xs sm:text-sm">
              ID Number *
            </Label>
            <Input
              id="idNo"
              type="text"
              name="idNo"
              value={formData.idNo}
              onChange={handleInputChange}
              required
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="camSno" className="text-xs sm:text-sm">
              Camera Serial Number
            </Label>
            <Input
              id="camSno"
              type="text"
              name="camSno"
              value={formData.camSno}
              onChange={handleInputChange}
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="fatherName" className="text-xs sm:text-sm">
              Father's Name
            </Label>
            <Input
              id="fatherName"
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="motherName" className="text-xs sm:text-sm">
              Mother's Name
            </Label>
            <Input
              id="motherName"
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleInputChange}
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="fatherPhone" className="text-xs sm:text-sm">
              Father's Phone
            </Label>
            <Input
              id="fatherPhone"
              type="tel"
              name="fatherPhone"
              value={formData.fatherPhone}
              onChange={handleInputChange}
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="motherPhone" className="text-xs sm:text-sm">
              Mother's Phone
            </Label>
            <Input
              id="motherPhone"
              type="tel"
              name="motherPhone"
              value={formData.motherPhone}
              onChange={handleInputChange}
              className="text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-xs sm:text-sm">
              Address
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={4}
              className="text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="submit"
              className="flex-1 text-xs sm:text-sm"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Student"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
