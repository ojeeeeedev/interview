/**
 * Core data models for the Cohort Booking System.
 * These interfaces mirror the Supabase database schema.
 */

/**
 * Represents a group or event (e.g., "Kelompok A").
 * Contains metadata and time-based access constraints.
 */
export interface Cohort {
    id: string;
    title: string;
    description: string;
    unique_slug: string; // Used for direct landing page URLs
    nama_kelompok: string; // The group name (e.g., Kelompok Santo Tomasz)
    start_at: string | null; // Opening time for registration
    end_at: string | null; // Closing time for registration
    created_at: string;
}

/**
 * Represents a specific interview date/time slot for a Cohort.
 * Tracks capacity via quota and current booking count.
 */
export interface Slot {
    id: string;
    cohort_id: string;
    date: string; // ISO Date string (YYYY-MM-DD)
    quota: number; // Maximum allowed bookings
    count: number; // Current number of bookings
    session_name: string; // The session label (e.g., 'Sesi Utama', 'Pagi', 'Sore')
    cohorts?: {
        title: string;
        nama_kelompok: string;
    };
}

/**
 * A user's booking entry.
 * Linked to a specific slot and secured by a 6-character access_code.
 */
export interface Reservation {
    id: string;
    slot_id: string;
    user_name: string;
    access_code: string; // Unique 6-character code for self-service editing/deletion
    created_at: string;
    slots?: {
        date: string;
        cohorts?: {
            title: string;
            nama_kelompok: string;
        };
    };
}

/**
 * The whitelist of permitted participants for each cohort.
 * Users can only book if their full_name exists here for the given cohort.
 */
export interface AllowedName {
    id: string;
    cohort_id: string;
    full_name: string;
    cohorts?: {
        title: string;
        nama_kelompok: string;
    };
}

// ---------------------------------------------------------------------------
// Extended / Helper UI Types
// ---------------------------------------------------------------------------

export interface ReservationExtended {
  id: string;
  user_name: string;
  access_code: string;
  created_at: string;
  slot_id: string;
  slots: {
    date: string;
    cohort_id: string;
    cohorts: {
      title: string;
      nama_kelompok: string;
    };
  };
}

export interface AllowedNameExtended {
  id: string;
  full_name: string;
  cohort_id: string;
  cohorts: {
    title: string;
    nama_kelompok: string;
  };
}

export interface SlotWithCohorts extends Slot {
  cohorts: {
    title: string;
    nama_kelompok: string;
  };
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface ReservationWithSlot {
  id: string;
  user_name: string;
  access_code: string;
  created_at: string;
  slot_id: string;
  slots: Slot;
}

export interface CohortWithSlots extends Cohort {
  slots: Slot[];
}

export interface ReservationSearch {
  id: string;
  slots: { cohorts: { unique_slug: string } };
}

