/**
 * printSelectionStorage.ts
 *
 * Safe client-side storage for student IDs selected for ID card printing.
 * Avoids passing large lists of UUIDs in URL query parameters, preventing HTTP 431
 * (Request Header Fields Too Large) errors.
 */

const STORAGE_KEY = "print_selected_student_ids";

export function savePrintSelectedIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const data = JSON.stringify(ids);
    sessionStorage.setItem(STORAGE_KEY, data);
    localStorage.setItem(STORAGE_KEY, data);
  } catch (err) {
    console.error("Failed to save selected student IDs for printing:", err);
  }
}

export function getPrintSelectedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const data = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load selected student IDs for printing:", err);
    return [];
  }
}

export function clearPrintSelectedIds(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    // ignore
  }
}
