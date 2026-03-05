import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import BookingForm from "../components/BookingForm";
import SuccessTicket from "../components/SuccessTicket";
import EditBooking from "../components/EditBooking";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const { slug } = useParams<{ slug: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [editingReservation, setEditingReservation] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: cohortData, error: cohortError } = await supabase
      .from("cohorts")
      .select("*")
      .eq("unique_slug", slug)
      .single();

    if (cohortError || !cohortData) {
      setError("Gelombang tidak ditemukan");
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
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const handleSearchCode = async () => {
    if (!searchCode) return;
    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(*)")
      .eq("access_code", searchCode.toUpperCase())
      .single();

    if (error || !data) {
      alert("Kode Akses tidak valid");
    } else {
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
            onDone={() => setSuccessCode(null)}
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
      sx={{ py: 12, minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%" }}
      >
        <Paper
          className="refined-card"
          sx={{ p: { xs: 4, md: 8 }, width: "100%" }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
            {cohort?.title}
          </Typography>
          <Typography
            variant="h6"
            color="textSecondary"
            paragraph
            sx={{ mb: 6, fontWeight: 500, opacity: 0.8 }}
          >
            {cohort?.description}
          </Typography>

          <Box
            mb={8}
            p={4}
            sx={{
              background: "rgba(0, 0, 0, 0.15)",
              borderRadius: 2,
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Ingin mengubah jadwal?
            </Typography>
            <Box
              display="flex"
              gap={2}
              mt={2}
              sx={{ flexDirection: { xs: "column", sm: "row" } }}
            >
              <TextField
                label="Masukkan Kode Akses anda..."
                variant="outlined"
                value={searchCode}
                onChange={(e: any) => setSearchCode(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearchCode}
                  sx={{ px: 4, height: "100%" }}
                >
                  Ubah
                </Button>
              </motion.div>
            </Box>
          </Box>

          <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
            Jadwalkan Wawancara
          </Typography>
          <BookingForm
            cohortId={cohort!.id}
            slots={slots}
            onSuccess={(code) => setSuccessCode(code)}
          />
        </Paper>
      </motion.div>
    </Container>
  );
}
