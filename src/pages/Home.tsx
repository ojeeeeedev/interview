import { useState, useEffect, useMemo, useTransition } from "react";
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
  ChevronRight,
  ChevronDown,
  Info,
  Edit2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
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
      whileHover={canAccess ? { y: -4 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Paper
        component={canAccess ? Link : Box}
        to={canAccess ? `/cohort/${cohort.unique_slug}` : undefined}
        elevation={0}
        sx={{
          cursor: canAccess ? "pointer" : "default",
          textDecoration: "none",
          display: "block",
          position: "relative",
          borderRadius: 1.5,
          overflow: "hidden",
          background: "rgba(25, 25, 25, 0.6)", // Distinct fill color
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
          "&:hover": canAccess ? {
            background: "rgba(35, 35, 35, 0.8)",
            borderColor: "rgba(52, 152, 219, 0.4)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(52, 152, 219, 0.1)",
          } : {},
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '4px', 
            height: '100%', 
            background: isEnded ? 'rgba(255,255,255,0.1)' : 'linear-gradient(to bottom, #3498db, #2980b9)',
            opacity: 0.8
          }} 
        />

        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={4} alignItems="center">
            
            {/* Left: Info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: isEnded ? "rgba(255,255,255,0.3)" : "#3498db",
                    letterSpacing: "0.5px",
                    textTransform: 'uppercase',
                    fontSize: '0.65rem'
                  }}
                >
                  Kelompok {cohort.nama_kelompok}
                </Typography>
                {isAdmin && (
                  <Chip label="Admin" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: 'rgba(52, 152, 219, 0.1)', color: '#3498db', border: '1px solid rgba(52, 152, 219, 0.2)' }} />
                )}
              </Stack>
              
              <Typography
                variant="h6"
                sx={{
                  color: isEnded ? "rgba(255,255,255,0.4)" : "#ffffff",
                  fontWeight: 700,
                  mb: 1,
                  lineHeight: 1.2
                }}
              >
                {cohort.title}
              </Typography>
              
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "0.8rem",
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {cohort.description}
              </Typography>
            </Grid>

            {/* Middle: Dynamic Content (Countdown or Slots) */}
            <Grid size={{ xs: 12, md: 5.5 }}>
              {!isStarted && !isAdmin ? (
                <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.4 }}>
                    Pendaftaran Dibuka
                  </Typography>
                  <CountdownTimer
                    targetDate={cohort.start_at!}
                    onFinish={() => setNow(new Date())}
                  />
                </Stack>
              ) : isEnded && !isAdmin ? (
                <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
                   <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                    Pendaftaran Selesai
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>
                    Terima kasih atas partisipasi Anda
                  </Typography>
                </Stack>
              ) : cohort.slots.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {cohort.slots.map((slot) => {
                    const remaining = slot.quota - slot.count;
                    const isFull = remaining <= 0;
                    return (
                      <Box
                        key={slot.id}
                        sx={{
                          flex: { xs: '1 1 100%', sm: '1 1 calc(33.333% - 8px)' }, // 3 columns
                          px: 1.2,
                          py: 0.8,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.2
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.65rem' }}>
                          {format(parseISO(slot.date), "EEE, d MMM", { locale: id })}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: isFull ? '#e74c3c' : '#2ecc71', fontSize: '0.65rem' }}>
                          {isFull ? "Full" : `${remaining} Slot`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : null}
            </Grid>

            {/* Right: Action */}
            <Grid size={{ xs: 12, md: 2.5 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, alignItems: 'center' }}>
              {cohort.slots.length > 0 ? (
                <Button
                  variant="contained"
                  disabled={!canAccess}
                  endIcon={canAccess ? <ChevronRight size={18} /> : null}
                  sx={{
                    height: 48,
                    width: { xs: '100%', md: 'auto' },
                    minWidth: 100,
                    borderRadius: 2,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    lineHeight: 1.4,
                    textTransform: 'none',
                    background: canAccess ? '#3498db' : 'rgba(255,255,255,0.05)',
                    '&:hover': { background: '#2980b9' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.15)' }
                  }}
                >
                  {isAdmin && !isStarted ? "Daftar (Admin)" : isEnded ? "Selesai" : "Daftar"}
                </Button>
              ) : (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.25)', 
                    fontWeight: 600, 
                    fontStyle: 'italic',
                    border: '1px solid rgba(255,255,255,0.05)',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.02)'
                  }}
                >
                  Jadwal belum tersedia
                </Typography>
              )}
            </Grid>

          </Grid>
        </CardContent>
      </Paper>
    </motion.div>
  );
}

interface ReservationSearch {
  id: string;
  slots: {
    cohorts: {
      unique_slug: string;
    }
  }
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

  const checkCodeExists = async (code: string) => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("access_code", code.toUpperCase())
      .maybeSingle();

    setIsSearching(false);
    if (error || !data) {
      setSearchStatus("error");
    } else {
      setSearchStatus("success");
    }
  };

  const [, startTransitionSearch] = useTransition();

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
      const slug = reservation.slots.cohorts.unique_slug;
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
            p: 1.5,
            px: 2,
            mb: 3,
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
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minWidth: "fit-content",
              }}
            >
              <Box
                sx={{
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
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  transition: "all 0.3s ease",
                }}
              >
                {isSearching ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Search size={16} />
                )}
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ 
                    fontWeight: 500, 
                    color: "#ffffff", 
                    lineHeight: 1.1, 
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                    letterSpacing: '-0.2px'
                  }}
                >
                  Sudah punya jadwal?
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    display: "block",
                    fontSize: '0.7rem',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    letterSpacing: '-0.1px'
                  }}
                >
                  Masukkan kode akses untuk mengubah.
                </Typography>
              </Box>
            </Box>

            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: "flex",
                flexGrow: 1,
                gap: 1.5,
                alignItems: "flex-start",
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Kode Akses (6 digit)..."
                value={searchCode}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 6).toUpperCase();
                  setSearchCode(val);
                  if (val.length === 6) {
                    void checkCodeExists(val);
                  } else {
                    startTransitionSearch(() => {
                      setSearchStatus((prev) => prev !== "idle" ? "idle" : prev);
                    });
                  }
                }}
                error={searchStatus === "error"}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        {isSearching ? (
                          <CircularProgress size={14} />
                        ) : searchStatus === "success" ? (
                          <CheckCircle2 size={14} color="#2ecc71" />
                        ) : searchStatus === "error" ? (
                          <XCircle size={14} color="#e74c3c" />
                        ) : null}
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2.5,
                      textTransform: "uppercase",
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      fontStyle: 'italic',
                      letterSpacing: '-0.3px',
                      bgcolor: "rgba(0,0,0,0.3)",
                      height: 38,
                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.1) !important",
                      },
                    },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={searchStatus !== "success" || isSearching}
                startIcon={<Edit2 size={14} />}
                sx={{
                  height: 38,
                  px: 3,
                  whiteSpace: 'nowrap',
                  borderRadius: 2.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  letterSpacing: '-0.2px',
                  boxShadow: searchStatus === "success" 
                    ? "0 4px 12px 0 rgba(46, 204, 113, 0.2)" 
                    : "none",
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
                    Event yang belum terjadwal ({unscheduled.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, background: "transparent" }}>
                <Grid container spacing={2.5}>
                  {unscheduled.map((cohort) => (
                    <Grid size={{ xs: 12 }} key={cohort.id}>
                      <CohortCard cohort={cohort} isAdmin={isAdmin} />
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
