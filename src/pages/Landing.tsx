import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Button,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import BookingForm from "../components/BookingForm";
import SuccessTicket from "../components/SuccessTicket";
import EditBooking from "../components/EditBooking";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Lock, ArrowLeft } from "lucide-react";
import CountdownTimer from "../components/CountdownTimer";

export default function Landing() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [successDate, setSuccessDate] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchData();
  }, [slug, location.search]);

  const handleSearchCode = async (codeToSearch: string) => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(*)")
      .eq("access_code", codeToSearch.toUpperCase())
      .single();

    if (!error && data) {
      setEditingReservation(data);
    }
  };

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );

  const isStarted = !cohort?.start_at || now >= new Date(cohort.start_at);
  const canAccess = isStarted || isAdmin;

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
              Pendaftaran untuk Kelompok {cohort.nama_kelompok} ({cohort.title}) akan dibuka dalam:
            </Typography>
            
            <Box sx={{ mb: 6 }}>
              <CountdownTimer targetDate={cohort.start_at!} onFinish={() => setNow(new Date())} />
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
            onDone={() => {
                setSuccessCode(null);
                setSuccessName(null);
                setSuccessDate(null);
            }}
          />
        </motion.div>
      </AnimatePresence>
    );

  if (editingReservation)
    return (
      <Container maxWidth="md" sx={{ py: 12 }}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box className="refined-card">
            <EditBooking
              reservation={editingReservation}
              slots={slots}
              onDone={() => {
                setEditingReservation(null);
                fetchData();
              }}
            />
          </Box>
        </motion.div>
      </Container>
    );

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 2, md: 4 }, minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: 'column', justifyContent: 'flex-start' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Paper
          className="refined-card"
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            width: "100%", 
            maxWidth: '450px', // Constraining width to match compact calendar
            bgcolor: 'rgba(255,255,255,0.02) !important', 
            position: 'relative' 
          }}
        >
          <Box sx={{ mb: 2, textAlign: 'right' }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 900,
                color: "#3498db",
                letterSpacing: "1.5px",
                display: 'block',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              KELOMPOK {cohort?.nama_kelompok?.toUpperCase()}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.5rem' }, lineHeight: 1.1 }}>
              {cohort?.title}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2, opacity: 0.1 }} />

          <BookingForm
            cohortId={cohort!.id}
            slots={slots}
            onSuccess={(code, name, date) => {
                setSuccessCode(code);
                setSuccessName(name);
                setSuccessDate(date);
            }}
          />
        </Paper>
      </motion.div>
    </Container>
  );
}
