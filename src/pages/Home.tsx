import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Grid,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  InputAdornment,
  CircularProgress,
  Skeleton,
  Typography,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Slot, CohortWithSlots, ReservationSearch } from "../types";
import { motion } from "framer-motion";
import { Search, ChevronDown, Info, History, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import CohortCard from "../components/CohortCard";

const motionContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

/**
 * Home Page Component
 *
 * The main landing page for the application. It displays:
 * 1. A Search Widget for users to find and edit their existing reservations.
 * 2. Active Scheduled Events (Events with available slots).
 * 3. Unscheduled Events (Events created by admin but without calendar slots).
 * 4. Past Events (Events where the end_at time has passed).
 */
export default function Home() {
  const [cohorts, setCohorts] = useState<CohortWithSlots[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Single timer for the entire page to keep countdowns and access rules fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // --- Search Widget State & Handlers ---
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<"idle" | "success" | "error">("idle");

  /** Validates an access code exists without navigating (used on input change). */
  const checkCodeExists = async (code: string) => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("access_code", code.toUpperCase())
      .maybeSingle();
    setIsSearching(false);
    setSearchStatus(error || !data ? "error" : "success");
  };

  /** Navigates to the cohort edit page when the form is submitted. */
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.length !== 6) return;

    setIsSearching(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(cohorts(unique_slug))")
      .eq("access_code", searchCode.toUpperCase())
      .maybeSingle();
    setIsSearching(false);

    if (error || !data) {
      setSearchStatus("error");
    } else {
      const reservation = data as unknown as ReservationSearch;
      navigate(`/cohort/${reservation.slots.cohorts.unique_slug}?edit=${searchCode.toUpperCase()}`);
    }
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchCohorts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("cohorts")
        .select("*, slots(*)")
        .order("date", { foreignTable: "slots", ascending: true });

      if (data) {
        // Ensure slots are strictly sorted by date client-side as well
        const sortedData = data.map((cohort: CohortWithSlots) => ({
          ...cohort,
          slots: (cohort.slots || []).sort(
            (a: Slot, b: Slot) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        }));
        setCohorts(sortedData as CohortWithSlots[]);
      }
      if (error) console.error(error);
      setIsLoading(false);
    };
    fetchCohorts();
  }, []);

  // --- Cohort Grouping ---
  const { scheduled, unscheduled, past } = useMemo(() => {
    const isPast = (c: CohortWithSlots) => c.end_at && new Date() >= new Date(c.end_at);
    return {
      scheduled: cohorts.filter((c) => c.slots.length > 0 && !isPast(c)),
      unscheduled: cohorts.filter((c) => c.slots.length === 0 && !isPast(c)),
      past: cohorts.filter((c) => isPast(c)),
    };
  }, [cohorts]);

  return (
    <Container maxWidth="md" sx={{ pt: 0, pb: 4 }}>

      {/* Search Widget */}
      <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper
          className="refined-card"
          sx={{
            p: 1.5, px: 2, mb: 3,
            bgcolor: "rgba(255, 255, 255, 0.02) !important",
            border: "1px solid",
            borderColor:
              searchStatus === "success" ? "rgba(46, 204, 113, 0.4)"
              : searchStatus === "error" ? "rgba(231, 76, 60, 0.4)"
              : "rgba(255, 255, 255, 0.05)",
            transition: "all 0.3s ease",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: "fit-content" }}>
              <Box
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  bgcolor: searchStatus === "success" ? "rgba(46, 204, 113, 0.1)" : searchStatus === "error" ? "rgba(231, 76, 60, 0.1)" : "rgba(212, 175, 55, 0.1)",
                  color: searchStatus === "success" ? "#2ecc71" : searchStatus === "error" ? "#e74c3c" : "#d4af37",
                  width: 32, height: 32, borderRadius: "50%", transition: "all 0.3s ease",
                }}
              >
                {isSearching ? <CircularProgress size={16} color="inherit" /> : <Search size={16} />}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "#ffffff", lineHeight: 1.1, fontSize: "0.85rem", fontStyle: "italic", letterSpacing: "-0.2px" }}>
                  Sudah punya jadwal?
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "0.7rem", fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.1px" }}>
                  Masukkan kode akses untuk mengubah.
                </Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", flexGrow: 1, gap: 1.5, alignItems: "flex-start" }}>
              <TextField
                fullWidth size="small"
                placeholder="Kode Akses (6 digit)..."
                value={searchCode}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 6).toUpperCase();
                  setSearchCode(val);
                  if (val.length === 6) {
                    void checkCodeExists(val);
                  } else if (searchStatus !== "idle") {
                    setSearchStatus("idle");
                  }
                }}
                error={searchStatus === "error"}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        {isSearching ? <CircularProgress size={14} />
                          : searchStatus === "success" ? <CheckCircle2 size={14} color="#2ecc71" />
                          : searchStatus === "error" ? <XCircle size={14} color="#e74c3c" />
                          : null}
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2.5, textTransform: "uppercase", fontWeight: 500,
                      fontSize: "0.85rem", fontStyle: "italic", letterSpacing: "-0.3px",
                      bgcolor: "rgba(0,0,0,0.3)", height: 38,
                      "& fieldset": { borderColor: "rgba(255,255,255,0.1) !important" },
                    },
                  },
                }}
              />
              <Button
                type="submit" variant="contained"
                disabled={searchStatus !== "success" || isSearching}
                startIcon={<Edit2 size={14} />}
                sx={{
                  height: 38, px: 3, whiteSpace: "nowrap", borderRadius: 1,
                  fontSize: "0.8rem", fontWeight: 600, fontStyle: "italic", letterSpacing: "-0.2px",
                  boxShadow: searchStatus === "success" ? "0 4px 12px 0 rgba(46, 204, 113, 0.2)" : "none",
                }}
              >
                Ubah Jadwal
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Divider sx={{ mb: 2, opacity: 0.1 }} />

      {/* Main Scheduled Events */}
      <motion.div variants={motionContainer} initial="hidden" animate="show">
        <Grid container spacing={2.5}>
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid size={{ xs: 12 }} key={i}>
                  <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)" }} />
                </Grid>
              ))
            : scheduled.map((cohort) => (
                <Grid size={{ xs: 12 }} key={cohort.id}>
                  <CohortCard cohort={cohort} isAdmin={isAdmin} now={now} onStatusChange={() => setNow(new Date())} />
                </Grid>
              ))}
        </Grid>

        {/* Unscheduled Events Accordion */}
        {!isLoading && unscheduled.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Accordion sx={{ background: "#1a1a1a !important", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px !important", overflow: "hidden", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ChevronDown color="white" />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Info size={18} color="rgba(255,255,255,0.5)" />
                  <Typography sx={{ fontWeight: 700, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                    Event yang belum terjadwal ({unscheduled.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, background: "transparent" }}>
                <Grid container spacing={2.5}>
                  {unscheduled.map((cohort) => (
                    <Grid size={{ xs: 12 }} key={cohort.id}>
                      <CohortCard cohort={cohort} isAdmin={isAdmin} now={now} onStatusChange={() => setNow(new Date())} />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Past Events Accordion */}
        {!isLoading && past.length > 0 && (
          <Box sx={{ mt: unscheduled.length > 0 ? 2 : 6 }}>
            <Accordion sx={{ background: "#1a1a1a !important", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px !important", overflow: "hidden", "&:before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ChevronDown color="white" />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <History size={18} color="rgba(255,255,255,0.5)" />
                  <Typography sx={{ fontWeight: 700, color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                    Event yang telah usai ({past.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, background: "transparent" }}>
                <Grid container spacing={2.5}>
                  {past.map((cohort) => (
                    <Grid size={{ xs: 12 }} key={cohort.id}>
                      <CohortCard cohort={cohort} isAdmin={isAdmin} now={now} onStatusChange={() => setNow(new Date())} />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </motion.div>
    </Container>
  );
}
