"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassFormProps {
  schoolId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClassForm({
  schoolId,
  onClose,
  onSuccess,
}: ClassFormProps) {
  const [name, setName] = useState("");
  const [customFieldsConfig, setCustomFieldsConfig] = useState<any>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSchoolConfig() {
      try {
        const res = await fetch(`/api/schools/${schoolId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.customFieldsConfig) {
            setCustomFieldsConfig(
              typeof data.customFieldsConfig === "string"
                ? JSON.parse(data.customFieldsConfig)
                : data.customFieldsConfig
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch school config", err);
      }
    }
    fetchSchoolConfig();
  }, [schoolId]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          schoolId,
          customValues,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create class");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const fields = customFieldsConfig?.class || [
    { key: "name", label: "Class Name", type: "text", required: true, default: true, enabled: true }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Create Class</h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {fields.map((f: any) => {
            if (f.default) {
              return (
                <div key={f.key}>
                  <Label htmlFor="class-name" className="text-xs sm:text-sm">
                    Class Name (Do not type 'Class') *
                  </Label>
                  <Input
                    id="class-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., 10A, VII, UKG, etc."
                    className="text-xs sm:text-sm mt-1"
                  />
                </div>
              );
            } else if (f.enabled) {
              return (
                <div key={f.key}>
                  <Label htmlFor={`class-custom-${f.key}`} className="text-xs sm:text-sm">
                    {f.label} {f.required && <span className="text-rose-500">*</span>}
                  </Label>
                  <Input
                    id={`class-custom-${f.key}`}
                    type="text"
                    value={customValues[f.key] || ""}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    required={f.required}
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    className="text-xs sm:text-sm mt-1"
                  />
                </div>
              );
            }
            return null;
          })}

          <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button
              type="submit"
              className="flex-1 text-xs sm:text-sm"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Class"}
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
