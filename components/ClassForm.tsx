"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Create Class</h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
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
              className="text-xs sm:text-sm"
            />
          </div>

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
