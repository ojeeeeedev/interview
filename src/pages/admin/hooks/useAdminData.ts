import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  Cohort,
  Slot,
  ReservationExtended,
  AllowedNameExtended,
  SlotWithCohorts,
  SnackbarState,
} from "../../../types";
import { compareSlots } from "../../../lib/utils";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminData() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [slots, setSlots] = useState<SlotWithCohorts[]>([]);
  const [reservations, setReservations] = useState<ReservationExtended[]>([]);
  const [allowedNames, setAllowedNames] = useState<AllowedNameExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (
    message: string,
    severity: SnackbarState["severity"] = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /**
   * Concurrent fetch of all administrative data points from Supabase.
   */
  const fetchAll = useCallback(async () => {
    const [
      { data: c },
      { data: s },
      { data: r },
      { data: an },
    ] = await Promise.all([
      supabase
        .from("cohorts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("slots")
        .select("*, cohorts(title, nama_kelompok)")
        .order("date", { ascending: true }),
      supabase
        .from("reservations")
        .select("*, slots(date, cohort_id, cohorts(title, nama_kelompok))"),
      supabase.from("allowed_names").select("*, cohorts(title, nama_kelompok)"),
    ]);

    if (c) setCohorts(c);
    if (s) setSlots((s as unknown as SlotWithCohorts[]).sort(compareSlots));
    if (r) setReservations(r as unknown as ReservationExtended[]);
    if (an) setAllowedNames(an as unknown as AllowedNameExtended[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  /**
   * Allowed names grouped by cohort_id for the Participant tab.
   */
  const groupedNames = useMemo(() => {
    const groups: Record<string, AllowedNameExtended[]> = {};
    allowedNames.forEach((an) => {
      const key = an.cohort_id || "Tanpa Event";
      if (!groups[key]) groups[key] = [];
      groups[key].push(an);
    });
    return groups;
  }, [allowedNames]);

  /**
   * Nested cohort -> slot -> reservation structure for the Recap tab.
   */
  const reportData = useMemo(() => {
    const cohortMap: Record<
      string,
      {
        cohort: Cohort;
        slots: Record<string, { slot: Slot; reservations: ReservationExtended[] }>;
      }
    > = {};

    cohorts.forEach((c) => {
      cohortMap[c.id] = { cohort: c, slots: {} };
    });

    const slotLookup = new Map<string, SlotWithCohorts>();

    slots.forEach((s) => {
      slotLookup.set(s.id, s);
      if (cohortMap[s.cohort_id]) {
        cohortMap[s.cohort_id].slots[s.id] = { slot: s, reservations: [] };
      }
    });

    reservations.forEach((r) => {
      const slotObj = slotLookup.get(r.slot_id);
      if (
        slotObj &&
        cohortMap[slotObj.cohort_id] &&
        cohortMap[slotObj.cohort_id].slots[r.slot_id]
      ) {
        cohortMap[slotObj.cohort_id].slots[r.slot_id].reservations.push(r);
      }
    });

    return cohortMap;
  }, [cohorts, slots, reservations]);

  return {
    // State
    cohorts,
    setCohorts,
    slots,
    setSlots,
    reservations,
    setReservations,
    allowedNames,
    setAllowedNames,
    loading,
    showErrors,
    setShowErrors,
    snackbar,
    // Helpers
    showToast,
    handleCloseSnackbar,
    fetchAll,
    // Derived
    groupedNames,
    reportData,
  };
}
