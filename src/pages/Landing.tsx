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
import { ArrowLeft } from "lucide-react";
import RegistrationStatus from "../components/RegistrationStatus";

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
        <Paper className="refined-card" sx={{ p: { xs: 3, sm: 4, md: 5 }, width: "100%", maxWidth: '450px' }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="text" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
            <Divider sx={{ opacity: 0.1 }} />
            <Box sx={{ pt: 2 }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: "12px", bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 3, borderRadius: "12px", bgcolor: 'rgba(255,255,255,0.05)' }} />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: "12px", bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
          </Stack>
        </Paper>
      </Container>
    );

  if (error)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>
      </Container>
    );

  const isStarted = !cohort?.start_at || now >= new Date(cohort.start_at);
  const isEnded = cohort?.end_at && now >= new Date(cohort.end_at);
  const canAccess = (isStarted && !isEnded) || isAdmin;

  if (isEnded && !isAdmin && cohort) {
    return (
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Paper className="refined-card" sx={{ p: 6, textAlign: 'center' }}>
            <RegistrationStatus 
              startAt={cohort.start_at}
              endAt={cohort.end_at}
              isAdmin={isAdmin}
              onStatusChange={() => setNow(new Date())}
            />

            <Box sx={{ mt: 4 }}>
              <Button 
                component={Link} 
                to="/" 
                variant="outlined" 
                startIcon={<ArrowLeft size={18} />}
                sx={{ borderRadius: "12px", px: 4, color: 'rgba(255,255,255,0.6)' }}
              >
                Kembali ke Beranda
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  if (!canAccess && cohort) {
    return (
      <Container maxWidth="sm" sx={{ py: 12 }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Paper className="refined-card" sx={{ p: 6, textAlign: 'center' }}>
            <RegistrationStatus 
              startAt={cohort.start_at}
              endAt={cohort.end_at}
              isAdmin={isAdmin}
              onStatusChange={() => setNow(new Date())}
            />

            <Box sx={{ mt: 4 }}>
              <Button 
                component={Link} 
                to="/" 
                variant="outlined" 
                startIcon={<ArrowLeft size={18} />}
                sx={{ borderRadius: "12px", px: 4, color: 'rgba(255,255,255,0.6)' }}
              >
                Kembali ke Beranda
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  if (successCode)
    return (
      <AnimatePresence mode="wait">
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
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' }, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                  {cohort?.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                  Silakan isi formulir di bawah ini untuk mengonfirmasi kehadiran Anda pada jadwal yang tersedia.
                </Typography>

                {cohort?.end_at && !isEnded && (
                  <RegistrationStatus 
                    startAt={cohort.start_at}
                    endAt={cohort.end_at}
                    isAdmin={isAdmin}
                    small
                    onStatusChange={() => setNow(new Date())}
                  />
                )}
              </Box>

              <Divider sx={{ opacity: 0.1 }} />

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
