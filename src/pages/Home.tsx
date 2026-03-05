import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Paper,
  CardContent,
  Grid,
  Button,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  Search,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  Info,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CountdownTimer from "../components/CountdownTimer";

const motionContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const motionItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

interface CohortWithSlots extends Cohort {
  slots: Slot[];
}

export default function Home() {
  const [cohorts, setCohorts] = useState<CohortWithSlots[]>([]);
  const { isAdmin } = useAuth();
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  // Search state
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Auto-check code when it reaches 6 characters
  useEffect(() => {
    if (searchCode.length === 6) {
      checkCodeExists(searchCode);
    } else {
      setSearchStatus("idle");
    }
  }, [searchCode]);

  const checkCodeExists = async (code: string) => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("access_code", code.toUpperCase())
      .single();

    setIsSearching(false);
    if (error || !data) {
      setSearchStatus("error");
    } else {
      setSearchStatus("success");
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.length !== 6) return;

    setIsSearching(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(cohorts(unique_slug))")
      .eq("access_code", searchCode.toUpperCase())
      .single();

    setIsSearching(false);
    if (error || !data) {
      setSearchStatus('error');
    } else {

      const slug = (data.slots as any).cohorts.unique_slug;
      navigate(`/cohort/${slug}?edit=${searchCode.toUpperCase()}`);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCohorts = async () => {
      const { data: cohortsData } = await supabase.from("cohorts").select("*");
      const { data: slotsData } = await supabase
        .from("slots")
        .select("*")
        .order("date", { ascending: true });

      if (cohortsData) {
        const combined = cohortsData.map((c: Cohort) => ({
          ...c,
          slots: slotsData?.filter((s: Slot) => s.cohort_id === c.id) || [],
        }));
        setCohorts(combined);
      }
    };
    fetchCohorts();
  }, []);

  const { scheduled, unscheduled } = useMemo(() => {
    return {
      scheduled: cohorts.filter((c) => c.slots.length > 0),
      unscheduled: cohorts.filter((c) => c.slots.length === 0),
    };
  }, [cohorts]);

  return (
    <Container maxWidth="md" sx={{ pt: 0, pb: 4 }}>
      {/* Search Widget */}
      <motion.div
        initial={{ opacity: 0, y: 0 }} // Removed -20 offset to eliminate top space
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          className="refined-card"
          sx={{
            p: 2.5, // Reduced padding
            mb: 2, // Reduced margin
            bgcolor: "rgba(255, 255, 255, 0.02) !important",
            border: "1px solid",
            borderColor:
              searchStatus === "success"
                ? "rgba(46, 204, 113, 0.4)"
                : searchStatus === "error"
                  ? "rgba(231, 76, 60, 0.4)"
                  : "rgba(255, 255, 255, 0.05)",
            transition: "all 0.3s ease",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor:
                  searchStatus === "success"
                    ? "rgba(46, 204, 113, 0.1)"
                    : searchStatus === "error"
                      ? "rgba(231, 76, 60, 0.1)"
                      : "rgba(52, 152, 219, 0.1)",
                color:
                  searchStatus === "success"
                    ? "#2ecc71"
                    : searchStatus === "error"
                      ? "#e74c3c"
                      : "#3498db",
                transition: "all 0.3s ease",
              }}
            >
              {isSearching ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Search size={18} />
              )}
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}
              >
                Sudah punya jadwal?
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  display: "block",
                  mt: -0.2,
                }}
              >
                Ubah jadwal dengan memasukkan kode akses.
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleSearchSubmit}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 9 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Kode Akses..."
                  value={searchCode}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 6);
                    setSearchCode(val);
                  }}
                  error={searchStatus === "error"}
                  helperText={
                    searchStatus === "error"
                      ? "Kode reservasi tidak ditemukan!"
                      : ""
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {isSearching && (
                            <CircularProgress
                              size={20}
                              sx={{ color: "rgba(255,255,255,0.3)" }}
                            />
                          )}
                          {!isSearching && searchStatus === "success" && (
                            <CheckCircle2 size={20} color="#2ecc71" />
                          )}
                          {!isSearching && searchStatus === "error" && (
                            <XCircle size={20} color="#e74c3c" />
                          )}
                        </InputAdornment>
                      ),
                      sx: {
                        textTransform: "uppercase",
                        fontWeight: 200,
                        letterSpacing: 0.5,
                        bgcolor:
                          searchStatus === "success"
                            ? "rgba(46, 204, 113, 0.05)"
                            : searchStatus === "error"
                              ? "rgba(231, 76, 60, 0.05)"
                              : "rgba(0,0,0,0.2)",
                        fontSize: "0.875rem",
                        "& fieldset": {
                          borderColor:
                            searchStatus === "success"
                              ? "rgba(46, 204, 113, 0.5) !important"
                              : searchStatus === "error"
                                ? "rgba(231, 76, 60, 0.5) !important"
                                : undefined,
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={searchStatus !== "success" || isSearching}
                  startIcon={<Edit2 size={16} />}
                  sx={{
                    height: 40,
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    fontSize: "0.85rem",
                    bgcolor: searchStatus === "success" ? "#2ecc71" : undefined,
                    "&:hover": {
                      bgcolor:
                        searchStatus === "success" ? "#27ae60" : undefined,
                    },
                  }}
                >
                  Ubah Jadwal
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>

      <Divider sx={{ mb: 2, opacity: 0.1 }} />

      {/* Main Scheduled Events */}
      <motion.div variants={motionContainer} initial="hidden" animate="show">
        <Grid container spacing={2.5}>
          {scheduled.map((cohort) => {
            const isStarted =
              !cohort.start_at || now >= new Date(cohort.start_at);
            const canAccess = isStarted || isAdmin;

            return (
              <Grid size={{ xs: 12 }} key={cohort.id}>
                <motion.div
                  variants={motionItem}
                  whileHover={canAccess ? { scale: 1.005, x: 4 } : {}}
                  whileTap={canAccess ? { scale: 0.995 } : {}}
                >
                  <Paper
                    component={canAccess ? Link : Box}
                    to={canAccess ? `/cohort/${cohort.unique_slug}` : undefined}
                    className="refined-card"
                    sx={{
                      cursor: canAccess ? "pointer" : "default",
                      textDecoration: "none",
                      display: "block",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      opacity: canAccess ? 1 : 0.8,
                      "&:hover": canAccess
                        ? {
                            borderColor: "rgba(52, 152, 219, 0.6) !important",
                            background: "#222222 !important",
                            transform: "translateX(4px)",
                          }
                        : {},
                    }}
                  >
                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                      <Grid container spacing={3} alignItems="flex-start">
                        {/* Event Identity */}
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography
                            variant="overline"
                            sx={{
                              fontWeight: 900,
                              color: "#3498db",
                              letterSpacing: "1.5px",
                              display: "block",
                              lineHeight: 1.2,
                              mb: 0.5,
                            }}
                          >
                            Kelompok {cohort.nama_kelompok}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              color: "#ffffff",
                              fontWeight: 800,
                              lineHeight: 1.2,
                              mb: 1,
                            }}
                          >
                            {cohort.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: "0.8rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {cohort.description}
                          </Typography>
                        </Grid>

                        {/* Vertical Slots List */}
                        <Grid size={{ xs: 12, md: 5 }}>
                          {!isStarted && !isAdmin ? (
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: "rgba(52, 152, 219, 0.05)",
                                border: "1px solid rgba(52, 152, 219, 0.2)",
                                textAlign: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 1,
                                  mb: 1,
                                  opacity: 0.8,
                                }}
                              >
                                <Lock size={14} color="#3498db" />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                    color: "#ffffff",
                                  }}
                                >
                                  Pendaftaran Dibuka Dalam
                                </Typography>
                              </Box>
                              <CountdownTimer
                                targetDate={cohort.start_at!}
                                onFinish={() => setNow(new Date())}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 0.5,
                                  opacity: 0.7,
                                }}
                              >
                                <CalendarIcon size={14} color="#3498db" />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                    color: "#ffffff",
                                  }}
                                >
                                  Jadwal Tersedia
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.75,
                                }}
                              >
                                {cohort.slots.map((slot) => {
                                  const remaining = slot.quota - slot.count;
                                  const isFull = remaining <= 0;
                                  return (
                                    <Box
                                      key={slot.id}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        px: 2,
                                        py: 1,
                                        borderRadius: 2,
                                        bgcolor: "rgba(255,255,255,0.05)",
                                        border:
                                          "1px solid rgba(255,255,255,0.08)",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          color: "#ffffff",
                                        }}
                                      >
                                        {format(
                                          parseISO(slot.date),
                                          "EEEE, d MMMM yyyy",
                                          { locale: id },
                                        )}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={
                                          isFull ? "Penuh" : `${remaining} Slot`
                                        }
                                        color={isFull ? "error" : "success"}
                                        variant={isFull ? "filled" : "outlined"}
                                        sx={{
                                          height: 22,
                                          fontSize: "0.65rem",
                                          fontWeight: 800,
                                          minWidth: 70,
                                        }}
                                      />
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </Grid>

                        {/* Action Button */}
                        <Grid
                          size={{ xs: 12, md: 3 }}
                          sx={{ alignSelf: "center", textAlign: "right" }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!canAccess}
                            endIcon={
                              canAccess ? (
                                <ChevronRight size={18} />
                              ) : (
                                <Lock size={18} />
                              )
                            }
                            sx={{
                              pointerEvents: "none",
                              borderRadius: 2.5,
                              fontWeight: 800,
                              py: 1.5,
                              background: canAccess
                                ? "rgba(52, 152, 219, 0.2)"
                                : "rgba(255, 255, 255, 0.05)",
                              border: canAccess
                                ? "1px solid rgba(52, 152, 219, 0.4)"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                              color: canAccess
                                ? "#ffffff"
                                : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {isAdmin && !isStarted
                              ? "Akses Admin"
                              : "Pilih Jadwal Wawancara"}
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Paper>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Unscheduled Events Accordion */}
        {unscheduled.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Accordion
              sx={{
                background: "#1a1a1a !important",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px !important",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown color="white" />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Info size={18} color="rgba(255,255,255,0.5)" />
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Wawancara yang belum terjadwal ({unscheduled.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, background: "#121212" }}>
                <Grid container spacing={1}>
                  {unscheduled.map((cohort) => (
                    <Grid size={{ xs: 12 }} key={cohort.id}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.03)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#3498db",
                              fontWeight: 800,
                              display: "block",
                              mb: 0.2,
                            }}
                          >
                            KELOMPOK {cohort.nama_kelompok.toUpperCase()}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "rgba(255,255,255,0.8)",
                            }}
                          >
                            {cohort.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.4)",
                            fontStyle: "italic",
                          }}
                        >
                          Belum ada jadwal
                        </Typography>
                      </Box>
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
