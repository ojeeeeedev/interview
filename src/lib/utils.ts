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

/**
 * Returns a priority number for sorting sessions:
 * Pagi (1) > Siang (2) > Sore (3) > Malam (4) > others (5)
 */
export const getSessionPriority = (sessionName: string): number => {
  const name = (sessionName || "").toLowerCase();
  if (name.includes("pagi")) return 1;
  if (name.includes("siang")) return 2;
  if (name.includes("sore")) return 3;
  if (name.includes("malam")) return 4;
  return 5;
};

/**
 * Compare function to sort slots chronologically, then by session priority
 */
export const compareSlots = (
  a: { date: string; session_name?: string },
  b: { date: string; session_name?: string }
): number => {
  const dateCompare = (a.date || "").localeCompare(b.date || "");
  if (dateCompare !== 0) return dateCompare;

  const pA = getSessionPriority(a.session_name || "");
  const pB = getSessionPriority(b.session_name || "");
  if (pA !== pB) return pA - pB;

  return (a.session_name || "").localeCompare(b.session_name || "");
};

