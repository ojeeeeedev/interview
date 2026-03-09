import { useState, useEffect, useMemo, useCallback } from "react";
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
  Skeleton,
  Stack,
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

function CohortCard({ cohort, isAdmin }: { cohort: CohortWithSlots; isAdmin: boolean }) {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const isStarted = !cohort.start_at || now >= new Date(cohort.start_at);
  const isEnded = cohort.end_at && now >= new Date(cohort.end_at);
  const canAccess = (isStarted && !isEnded) || isAdmin;

  return (
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
          position: "relative",
          overflow: "hidden",
          "&:hover": canAccess
            ? {
                borderColor: "rgba(52, 152, 219, 0.6) !important",
                background: "#222222 !important",
                transform: "translateX(4px)",
              }
            : {},
        }}
      >
        {isEnded && !isAdmin && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0,0,0,0.6)",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(2px)",
            }}
          >
            <Chip
              icon={<Lock size={14} />}
              label="PENDAFTARAN DITUTUP"
              color="error"
              sx={{ fontWeight: 900, px: 2, py: 2.5, borderRadius: 2 }}
            />
          </Box>
        )}
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4.5 }}>
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 900,
                  color: isEnded ? "rgba(255,255,255,0.3)" : "#3498db",
                  letterSpacing: "2px",
                  display: "block",
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                Kelompok {cohort.nama_kelompok}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: isEnded ? "rgba(255,255,255,0.3)" : "#ffffff",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  mb: 1.5,
                }}
              >
                {cohort.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.85rem",
                  lineHeight: 1.4,
                  display: { xs: 'none', md: 'block' }
                }}
              >
                {cohort.description}
              </Typography>

              {cohort.end_at && !isEnded && isStarted && (
                <Box
                  sx={{
                    mt: 2,
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 2,
                    bgcolor: "rgba(231, 76, 60, 0.05)",
                    border: "1px solid rgba(231, 76, 60, 0.1)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#e74c3c",
                      fontSize: '0.65rem'
                    }}
                  >
                    Berakhir:
                  </Typography>
                  <CountdownTimer
                    targetDate={cohort.end_at}
                    onFinish={() => setNow(new Date())}
                    small
                    showTarget
                    targetLabel="BATAS"
                  />
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4.5 }}>
              {!isStarted && !isAdmin ? (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
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
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <Lock size={16} color="#3498db" />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Pendaftaran Dibuka Dalam
                    </Typography>
                  </Box>
                  <CountdownTimer
                    targetDate={cohort.start_at!}
                    onFinish={() => setNow(new Date())}
                    showTarget
                    targetLabel="DIBUKA"
                  />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      opacity: 0.6,
                    }}
                  >
                    <CalendarIcon size={14} color="#3498db" />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "#ffffff",
                      }}
                    >
                      Slot Tersedia
                    </Typography>
                  </Box>

                  <Stack spacing={1}>
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
                            py: 1.25,
                            borderRadius: 2.5,
                            bgcolor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            opacity: isEnded ? 0.3 : 1
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#ffffff",
                              fontSize: '0.8rem'
                            }}
                          >
                            {format(parseISO(slot.date), "EEEE, d MMM yyyy", {
                              locale: id,
                            })}
                          </Typography>
                          <Chip
                            size="small"
                            label={isFull ? "Penuh" : `${remaining} Slot`}
                            color={isFull ? "error" : "success"}
                            variant={isFull ? "filled" : "outlined"}
                            sx={{
                              height: 22,
                              fontSize: "0.6rem",
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              minWidth: 70,
                              borderRadius: 1.5
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Grid>

            <Grid
              size={{ xs: 12, md: 3 }}
              sx={{ textAlign: "right", mt: { xs: 1, md: 0 } }}
            >
              <Button
                variant="contained"
                fullWidth
                disabled={!canAccess}
                endIcon={
                  canAccess ? <ChevronRight size={18} /> : <Lock size={18} />
                }
                sx={{
                  pointerEvents: "none",
                  borderRadius: 3,
                  fontWeight: 800,
                  py: 1.8,
                  fontSize: '0.9rem',
                  background: canAccess
                    ? "rgba(52, 152, 219, 0.15)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: canAccess
                    ? "1px solid rgba(52, 152, 219, 0.3)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  color: canAccess ? "#ffffff" : "rgba(255,255,255,0.2)",
                  boxShadow: "none",
                }}
              >
                {isAdmin && !isStarted ? "Akses Admin" : isEnded ? "Selesai" : "Daftar Sekarang"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Paper>
    </motion.div>
  );
}

export default function Home() {
  const [cohorts, setCohorts] = useState<CohortWithSlots[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const checkCodeExists = useCallback(async (code: string) => {
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
  }, []);

  // Auto-check code when it reaches 6 characters
  useEffect(() => {
    if (searchCode.length === 6) {
      checkCodeExists(searchCode);
    } else {
      setSearchStatus("idle");
    }
  }, [searchCode, checkCodeExists]);

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
      setSearchStatus("error");
    } else {
      const slug = (data.slots as any).cohorts.unique_slug;
      navigate(`/cohort/${slug}?edit=${searchCode.toUpperCase()}`);
    }
  };

  useEffect(() => {
    const fetchCohorts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("cohorts")
        .select("*, slots(*)")
        .order("date", { foreignTable: "slots", ascending: true });

      if (data) {
        setCohorts(data as CohortWithSlots[]);
      }
      if (error) console.error(error);
      setIsLoading(false);
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
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          className="refined-card"
          sx={{
            p: 2.5,
            mb: 2,
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
            <Grid container spacing={1.5} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Kode Akses (6 digit)..."
                  value={searchCode}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 6).toUpperCase();
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
                          {isSearching ? (
                            <CircularProgress size={18} />
                          ) : searchStatus === "success" ? (
                            <CheckCircle2 size={18} color="#2ecc71" />
                          ) : searchStatus === "error" ? (
                            <XCircle size={18} color="#e74c3c" />
                          ) : null}
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 3,
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: 1,
                        bgcolor: "rgba(0,0,0,0.3)",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.1) !important",
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={searchStatus !== "success" || isSearching}
                  startIcon={<Edit2 size={16} />}
                  sx={{
                    height: 40,
                    borderRadius: 3,
                    boxShadow: searchStatus === "success" 
                      ? "0 4px 14px 0 rgba(46, 204, 113, 0.3)" 
                      : "none",
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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Grid size={{ xs: 12 }} key={i}>
                <Skeleton 
                  variant="rectangular" 
                  height={180} 
                  sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)" }} 
                />
              </Grid>
            ))
          ) : (
            scheduled.map((cohort) => (
              <Grid size={{ xs: 12 }} key={cohort.id}>
                <CohortCard cohort={cohort} isAdmin={isAdmin} />
              </Grid>
            ))
          )}
        </Grid>

        {/* Unscheduled Events Accordion */}
        {!isLoading && unscheduled.length > 0 && (
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
