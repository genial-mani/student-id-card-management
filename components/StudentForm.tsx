"use client";

import { useState } from "react";
import uploadImageToCloudinary from "@/utils/cloudService";

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
  
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Student</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* MOVED TO TOP: Profile Picture Section with Preview */}
          <div className="flex flex-col items-center bg-gray-50 p-4 border border-gray-200 rounded-md">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile Preview"
                // No border radius applied here, standard sharp corners
                className="w-32 h-40 object-cover mb-4 shadow-sm border border-gray-300"
              />
            ) : (
              <div className="w-32 h-40 bg-gray-200 mb-4 flex items-center justify-center text-gray-500 text-sm border border-gray-300">
                No Image
              </div>
            )}
            
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number *
            </label>
            <input
              type="text"
              name="idNo"
              value={formData.idNo}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Camera Serial Number
            </label>
            <input
              type="text"
              name="camSno"
              value={formData.camSno}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Father's Name
            </label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mother's Name
            </label>
            <input
              type="text"
              name="motherName"
              value={formData.motherName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Father's Phone
            </label>
            <input
              type="tel"
              name="fatherPhone"
              value={formData.fatherPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mother's Phone
            </label>
            <input
              type="tel"
              name="motherPhone"
              value={formData.motherPhone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}