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
