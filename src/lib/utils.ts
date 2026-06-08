/**
 * Shared Utility Functions
 *
 * Centralises helper functions used across multiple pages and components
 * to avoid duplication and ensure consistency.
 */

/**
 * Formats an ISO date string into the "YYYY-MM-DDThh:mm" format required
 * by datetime-local HTML inputs.
 */
export const formatDateForInput = (dateString: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Generates a URL-friendly slug from a group name and event title.
 * Example: "Kelompok A", "Wawancara 2026" → "kelompok-a-wawancara-2026"
 */
export const generateSlug = (namaKelompok: string, title: string): string => {
  return `${namaKelompok} ${title}`
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
