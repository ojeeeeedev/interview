export interface Cohort {
    id: string;
    title: string;
    description: string;
    unique_slug: string;
    nama_kelompok: string;
    start_at: string | null;
    end_at: string | null;
    created_at: string;
}

export interface Slot {
    id: string;
    cohort_id: string;
    date: string;
    quota: number;
    count: number;
    cohorts?: {
        title: string;
        nama_kelompok: string;
    };
}

export interface Reservation {
    id: string;
    slot_id: string;
    user_name: string;
    access_code: string;
    created_at: string;
    slots?: {
        date: string;
        cohorts?: {
            title: string;
            nama_kelompok: string;
        };
    };
}

export interface AllowedName {
    id: string;
    cohort_id: string;
    full_name: string;
    cohorts?: {
        title: string;
        nama_kelompok: string;
    };
}
