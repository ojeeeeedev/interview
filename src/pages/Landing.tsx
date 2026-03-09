import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Divider,
  Button,
  Stack,
  Skeleton,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import BookingForm from "../components/BookingForm";
import SuccessTicket from "../components/SuccessTicket";
import EditBooking from "../components/EditBooking";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { Lock, ArrowLeft } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";

interface ReservationWithSlot {
    id: string;
    user_name: string;
    access_code: string;
    created_at: string;
    slot_id: string;
    slots: Slot;
}

export default function Landing() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [successDate, setSuccessDate] = useState<string | null>(null);
  const [successRawDate, setSuccessRawDate] = useState<Date | null>(null);
  const [editingReservation, setEditingReservation] = useState<ReservationWithSlot | null>(null);
  const [now, setNow] = useState(new Date());

  const handleSearchCode = useCallback(async (codeToSearch: string) => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(*)")
      .eq("access_code", codeToSearch.toUpperCase())
      .maybeSingle();

    if (!error && data) {
      setEditingReservation(data as unknown as ReservationWithSlot);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const { data: cohortData, error: cohortError } = await supabase
      .from("cohorts")
      .select("*")
      .eq("unique_slug", slug)
      .single();

    if (cohortError || !cohortData) {
      setError("Event tidak ditemukan");
      setLoading(false);
      return;
    }

    setCohort(cohortData);

    const { data: slotsData, error: slotsError } = await supabase
      .from("slots")
      .select("*")
      .eq("cohort_id", cohortData.id);

    if (slotsError) {
      setError("Gagal memuat jadwal");
    } else {
      setSlots(slotsData);
    }
    setLoading(false);

    // Check for edit code in query params
    const queryParams = new URLSearchParams(location.search);
    const editCode = queryParams.get("edit");
    if (editCode) {
      handleSearchCode(editCode);
    }
  }, [slug, location.search, handleSearchCode]);

  useEffect(() => {
    let ignore = false;
    if (!ignore) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchData();
    }
    return () => { ignore = true; };
  }, [fetchData]);

  if (loading)
    return (
      <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: 'center' }}>
        <Paper className="refined-card" sx={{ p: { xs: 2, sm: 3, md: 4 }, width: "100%", maxWidth: '450px', bgcolor: 'rgba(255,255,255,0.02) !important' }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
            <Divider sx={{ opacity: 0.1 }} />
            <Box sx={{ pt: 2 }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
          </Stack>
        </Paper>
      </Container>
    );

  if (error)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );

  const isStarted = !cohort?.start_at || now >= new Date(cohort.start_at);
  const isEnded = cohort?.end_at && now >= new Date(cohort.end_at);
  const canAccess = (isStarted && !isEnded) || isAdmin;

  if (isEnded && !isAdmin && cohort) {
    return (
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Paper className="refined-card" sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02) !important' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: 'rgba(231, 76, 60, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(231, 76, 60, 0.3)'
            }}>
              <Lock size={40} color="#e74c3c" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Pendaftaran Ditutup</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
              Pendaftaran untuk Kelompok {cohort.nama_kelompok} ({cohort.title}) telah berakhir pada:
              <br />
              <strong>{new Date(cohort.end_at!).toLocaleString("id-ID", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
            </Typography>

            <Button 
              component={Link} 
              to="/" 
              variant="outlined" 
              startIcon={<ArrowLeft size={18} />}
              sx={{ borderRadius: 3, px: 4 }}
            >
              Kembali ke Beranda
            </Button>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  if (!canAccess && cohort) {
    return (
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Paper className="refined-card" sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02) !important' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: 'rgba(52, 152, 219, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(52, 152, 219, 0.3)'
            }}>
              <Lock size={40} color="#3498db" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Akses Belum Dibuka</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4 }}>
              Pendaftaran untuk Kelompok {cohort.nama_kelompok} ({cohort.title}) segera dibuka:
            </Typography>
            
            <Box sx={{ mb: 6 }}>
              <CountdownTimer 
                targetDate={cohort.start_at!} 
                onFinish={() => setNow(new Date())} 
                showTarget
                targetLabel="DIBUKA"
              />
            </Box>

            <Button 
              component={Link} 
              to="/" 
              variant="outlined" 
              startIcon={<ArrowLeft size={18} />}
              sx={{ borderRadius: 3, px: 4 }}
            >
              Kembali ke Beranda
            </Button>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  if (successCode)
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <SuccessTicket
            code={successCode}
            userName={successName || ""}
            cohortName={`Kelompok ${cohort?.nama_kelompok} - ${cohort?.title}`}
            schedule={successDate || ""}
            rawDate={successRawDate || new Date()}
            onDone={() => {
                setSuccessCode(null);
                setSuccessName(null);
                setSuccessDate(null);
                setSuccessRawDate(null);
            }}
          />
        </motion.div>
      </AnimatePresence>
    );

  return (
    <Container
      maxWidth="md"
      sx={{ pt: 2, pb: { xs: 4, md: 8 }, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", maxWidth: '500px' }}
      >
        <Paper
          className="refined-card"
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            width: "100%", 
            bgcolor: 'rgba(255,255,255,0.02) !important', 
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5) !important'
          }}
        >
          {editingReservation ? (
            <EditBooking
              reservation={editingReservation}
              slots={slots}
              onDone={() => {
                setEditingReservation(null);
                navigate("/"); // Return to homepage
              }}
            />
          ) : (
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 900,
                    color: "#3498db",
                    letterSpacing: "2px",
                    display: 'block',
                    lineHeight: 1,
                    mb: 1
                  }}
                >
                  KELOMPOK {cohort?.nama_kelompok?.toUpperCase()}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.1 }}>
                  {cohort?.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                  Silakan isi formulir di bawah ini untuk mengonfirmasi kehadiran Anda pada jadwal yang tersedia.
                </Typography>
              </Box>

              <Divider sx={{ opacity: 0.1 }} />

              {cohort?.end_at && !isEnded && (
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: "rgba(231, 76, 60, 0.05)",
                    border: "1px solid rgba(231, 76, 60, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#e74c3c",
                    }}
                  >
                    Berakhir Dalam:
                  </Typography>
                  <CountdownTimer
                    targetDate={cohort.end_at}
                    onFinish={() => setNow(new Date())}
                    small
                    showTarget
                    targetLabel="BATAS PENDAFTARAN"
                  />
                </Box>
              )}

              <BookingForm
                cohortId={cohort!.id}
                slots={slots}
                onSuccess={(code, name, date, rawDate) => {
                    setSuccessCode(code);
                    setSuccessName(name);
                    setSuccessDate(date);
                    setSuccessRawDate(rawDate);
                }}
              />
            </Stack>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
}
