"use client";

  import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload04Icon, FileUploadIcon, Alert01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  classId?: string; // If provided, imported students default to this class
  customFieldsConfig?: any;
  onSuccess: () => void;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  schoolId,
  classId,
  customFieldsConfig,
  onSuccess,
}: BulkImportModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setParsedData([]);
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine expected columns based on customFieldsConfig
  let expectedColumns: {key: string, label: string, isCustom?: boolean}[] = [];
  try {
    const parsed = typeof customFieldsConfig === "string" ? JSON.parse(customFieldsConfig) : customFieldsConfig;
    if (parsed?.student) {
      expectedColumns = parsed.student
        .filter((f: any) => f.enabled && f.key !== "profilePictureUrl" && f.key !== "camSno")
        .map((f: any) => ({ key: f.key, label: f.label, isCustom: !f.default }));
    }
  } catch (e) {
    // Ignore parse error
  }

  // Fallback to defaults if config parsing failed or is empty
  if (expectedColumns.length === 0) {
    expectedColumns = [
      { key: "name", label: "Student Name" },
      { key: "fatherName", label: "Father Name" },
      { key: "fatherPhone", label: "Father Phone" },
      { key: "address", label: "Address" },
    ];
  }

  // If importing globally in student directory, "Class Name" column must exist.
  if (!classId) {
    expectedColumns.push({ key: "className", label: "Class Name" });
  }

  const expectedLabels = expectedColumns.map(c => c.label);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setParsedData([]);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length === 0) {
          setError("The Excel file is empty.");
          return;
        }

        const headers = data[0] as string[];
        
        // Validate headers (case insensitive, trimmed)
        const missingColumns = expectedLabels.filter(
          label => !headers.find(h => h?.toString().trim().toLowerCase() === label.toLowerCase())
        );

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(", ")}`);
          return;
        }

        // Parse rows
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        setParsedData(rows);
      } catch (err) {
        setError("Failed to parse the Excel file. Please ensure it is a valid .xlsx file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsImporting(true);
    setError(null);

    try {
      // Map data
      const payload = parsedData.map(row => {
        // Map standard fields using the expected labels
        const getValue = (label: string) => {
          const key = Object.keys(row).find(k => k.trim().toLowerCase() === label.toLowerCase());
          return key ? row[key]?.toString().trim() : "";
        };

        const customValues: Record<string, string> = {};
        expectedColumns.filter(c => c.isCustom).forEach(cf => {
          customValues[cf.key] = getValue(cf.label);
        });

        // Find standard keys
        const getName = () => getValue(expectedColumns.find(c => c.key === "name")?.label || "Student Name");
        const getIdNo = () => getValue(expectedColumns.find(c => c.key === "idNo")?.label || "ID Number");
        const getFatherName = () => getValue(expectedColumns.find(c => c.key === "fatherName")?.label || "Father Name");
        const getFatherPhone = () => getValue(expectedColumns.find(c => c.key === "fatherPhone")?.label || "Father Phone");
        const getAddress = () => getValue(expectedColumns.find(c => c.key === "address")?.label || "Address");

        return {
          schoolId,
          className: classId ? undefined : getValue("Class Name"),
          classId: classId,
          name: getName(),
          idNo: getIdNo(),
          fatherName: getFatherName(),
          fatherPhone: getFatherPhone(),
          address: getAddress(),
          customValues: Object.keys(customValues).length > 0 ? customValues : null,
        };
      });

      // Filter out empty rows or rows without name or class info
      const validPayload = payload.filter(p => p.name && (p.classId || p.className));

      if (validPayload.length === 0) {
        throw new Error("No valid student rows found. Each student must have at least a Name and Class Name.");
      }

      const response = await fetch("/api/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: validPayload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to bulk import students");
      }

      toast.success(data.message || `Successfully imported students`);
      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to import students");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: "scale-in 0.2s ease-out" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <HugeiconsIcon icon={FileUploadIcon} size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Import Students via Excel</h2>
              <p className="text-sm text-slate-500 mt-0.5">Upload a .xlsx file to bulk add students.</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 p-4 rounded-xl bg-violet-50 border border-violet-100">
            <h4 className="text-sm font-bold text-violet-900 mb-2">Expected Column Names:</h4>
            <div className="flex flex-wrap gap-2">
              {expectedLabels.map((label, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-white text-violet-700 border border-violet-200 rounded-md shadow-sm font-medium">
                  {label}
                </span>
              ))}
            </div>
            <p className="text-xs text-violet-600 mt-3 flex gap-1 items-start">
              <span className="mt-0.5"><HugeiconsIcon icon={Alert01Icon} size={14} /></span>
              <span>The Excel file <strong>must</strong> include all of the column names exactly as displayed above. Extra columns will be ignored. Profile photos cannot be imported via Excel.</span>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-violet-300 transition-colors">
            <HugeiconsIcon icon={Upload04Icon} size={32} className="text-gray-400 mb-3" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              Select Excel File
            </Button>
            <p className="text-xs text-gray-500 text-center px-4">
              <strong>Important:</strong> 
              {!classId ? (
                <> Please make sure to include a <strong>"Class Name"</strong> column (e.g., 10th, 9th) to specify which class each student belongs to. The class name must exactly match the ones existing in the platform.</>
              ) : (
                <> Since you are in a specific class, all imported students will be assigned to this class automatically.</>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-2 text-center px-4">
              The columns expected exactly match the active form fields configured by the school administrator. Please ensure the column names match perfectly (excluding profile pictures).
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm flex items-start gap-2">
              <HugeiconsIcon icon={Alert01Icon} size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {parsedData.length > 0 && !error && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-start gap-2">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="shrink-0 mt-0.5" />
              <span>Successfully parsed <strong>{parsedData.length}</strong> rows. Ready to import.</span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-150 flex justify-end gap-3 bg-gray-50/50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isImporting}
            className="text-slate-700 bg-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || parsedData.length === 0 || !!error}
            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
          >
            {isImporting ? "Importing..." : "Import Students"}
          </Button>
        </div>
      </div>
    </div>
  );
}
