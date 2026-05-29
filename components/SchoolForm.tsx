"use client";

import { useState } from "react";
import uploadImageToCloudinary from "@/utils/cloudService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SchoolFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Credentials {
  username: string;
  password: string;
  schoolName: string;
}

export default function SchoolForm({ onClose, onSuccess }: SchoolFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    caption: "",
    address: "",
    phone: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "signature",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "logo") setLogoFile(file);
    else setSignatureFile(file);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = "";
      let signatureUrl = "";
      if (logoFile) logoUrl = await uploadImageToCloudinary(logoFile);
      if (signatureFile)
        signatureUrl = await uploadImageToCloudinary(signatureFile);

      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, logoUrl, signatureUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials({
          username: data.credentials.username,
          password: data.credentials.password,
          schoolName: formData.name,
        });
        onSuccess();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create school");
      }
    } catch {
      alert("Failed to create school");
    } finally {
      setLoading(false);
    }
  };

  const credText = credentials
    ? `School: ${credentials.schoolName}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(credText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!credentials) return;
    const blob = new Blob(
      [
        credText +
          "\n\nShare these credentials securely with school staff only.",
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${credentials.schoolName.replace(/\s+/g, "_")}_credentials.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Credentials modal ────────────────────────────────────────────────────
  if (credentials) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-sm shadow-2xl">
          {/* Success header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            <div className="w-9 sm:w-10 h-9 sm:h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg
                className="w-4 sm:w-5 h-4 sm:h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                School Created!
              </h2>
              <p className="text-xs text-gray-500">
                Save these credentials — shown only once
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 mb-3 sm:mb-4">
            <svg
              className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-amber-700 font-medium">
              Share securely with school staff only. Cannot be recovered.
            </p>
          </div>

          {/* Credential fields */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                School
              </p>
              <p className="font-semibold text-gray-800 text-xs sm:text-sm">
                {credentials.schoolName}
              </p>
            </div>
            {[
              { label: "Username", value: credentials.username },
              { label: "Password", value: credentials.password },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {label}
                </p>
                <code className="block bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 font-mono text-xs sm:text-sm text-gray-800 select-all break-all">
                  {value}
                </code>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:gap-3 mb-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs sm:text-sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </Button>
            <Button type="button" className="flex-1" onClick={handleDownload}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Done — I&apos;ve saved the credentials
          </Button>
        </div>
      </div>
    );
  }

  // ── Create form ──────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">
            Create School
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {(
              [
                { label: "School Name", name: "name", type: "text" },
                { label: "Caption / Tagline", name: "caption", type: "text" },
                { label: "Phone", name: "phone", type: "tel" },
              ] as {
                label: string;
                name: keyof typeof formData;
                type: string;
              }[]
            ).map(({ label, name, type }) => (
              <div key={name}>
                <Label htmlFor={name} className="text-xs sm:text-sm">
                  {label} *
                </Label>
                <Input
                  id={name}
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleInputChange}
                  required
                  className="text-xs sm:text-sm"
                />
              </div>
            ))}

            <div>
              <Label htmlFor="address" className="text-xs sm:text-sm">
                Address *
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={4}
                className="text-xs sm:text-sm"
              />
            </div>

            {[
              { label: "School Logo", key: "logo" as const },
              { label: "Signature Photo", key: "signature" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <Label htmlFor={key} className="text-xs sm:text-sm">
                  {label}
                </Label>
                <Input
                  id={key}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, key)}
                  className="text-xs sm:text-sm file:mr-2 sm:file:mr-3 file:py-1 sm:file:py-1.5 file:px-2 sm:file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            ))}

            <div className="flex flex-col gap-2 sm:gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 text-xs sm:text-sm"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create School"}
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
    </div>
  );
}
