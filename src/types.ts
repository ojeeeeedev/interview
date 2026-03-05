export interface Cohort {
    id: string;
    title: string;
    description: string;
    unique_slug: string;
    nama_kelompok: string; // New field
    created_at: string;
}

export interface Slot {
    id: string;
    cohort_id: string;
    date: string;
    quota: number;
    count: number;
}

export interface Reservation {
    id: string;
    slot_id: string;
    user_name: string;
    access_code: string;
    created_at: string;
}

export interface AllowedName {
    id: string;
    cohort_id: string;
    full_name: string;
}
