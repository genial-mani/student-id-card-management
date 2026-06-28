"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export default function BulkDeleteModal({
  isOpen,
  onClose,
  selectedIds,
  onSuccess,
}: BulkDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/students/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to bulk delete students");
      }

      toast.success(data.message || `Successfully deleted ${selectedIds.length} students`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to bulk delete students");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: "scale-in 0.2s ease-out" }}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <HugeiconsIcon icon={Alert02Icon} size={24} className="text-rose-600" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Delete {selectedIds.length} {selectedIds.length === 1 ? "Student" : "Students"}?
          </h3>
          
          <p className="text-slate-600 mb-6">
            You are about to delete <strong>{selectedIds.length}</strong> selected student records. 
            This will also permanently delete their data and photos from database.
            <br/><br/>
            This action <strong>cannot</strong> be undone. Are you sure you want to proceed?
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete All"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
