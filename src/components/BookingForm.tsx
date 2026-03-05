import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Autocomplete,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Slot } from "../types";
import Calendar from "./Calendar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";

interface Props {
  cohortId: string;
  slots: Slot[];
  onSuccess: (code: string, userName: string, dateStr: string) => void;
}

export default function BookingForm({ cohortId, slots, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [allowedNames, setAllowedNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchAllowedNames = async () => {
      const { data, error } = await supabase
        .from("allowed_names")
        .select("full_name")
        .eq("cohort_id", cohortId);

      if (data) {
        setAllowedNames(data.map((n) => n.full_name));
      }
      if (error) console.error(error);
    };
    fetchAllowedNames();
  }, [cohortId]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleBooking = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);

    // 1. Check for double booking in this cohort
    const { data: existing, error: checkError } = await supabase
        .from('reservations')
        .select('id, slots!inner(cohort_id)')
        .ilike('user_name', name.trim())
        .eq('slots.cohort_id', cohortId)
        .maybeSingle();

    if (checkError) {
        console.error(checkError);
    }

    if (existing) {
        setError("Anda sudah terdaftar untuk event ini. Mohon gunakan Kode Akses Anda pada menu 'Cari Reservasi' di atas jika ingin mengubah jadwal.");
        setLoading(false);
        return;
    }

    // 2. Validate name in allowed_names
    const { data: allowed, error: allowedError } = await supabase
      .from("allowed_names")
      .select("*")
      .eq("cohort_id", cohortId)
      .ilike("full_name", name.trim())
      .single();

    if (allowedError || !allowed) {
      setError("Nama Anda tidak terdaftar untuk event ini.");
      setLoading(false);
      return;
    }

    // 3. Find slot id
    const dateStr = format(selectedDate!, "yyyy-MM-dd");
    const slot = slots.find((s) => s.date === dateStr);
    if (!slot) {
      setError("Tanggal yang dipilih tidak tersedia.");
      setLoading(false);
      return;
    }

    const code = generateCode();
    const { error: bookError } = await supabase.rpc("book_reservation", {
      p_slot_id: slot.id,
      p_user_name: name.trim(),
      p_access_code: code,
    });

    if (bookError) {
      setError(bookError.message);
    } else {
      const formattedDate = format(selectedDate!, "EEEE, d MMMM yyyy", { locale: id });
      onSuccess(code, name.trim(), formattedDate);
    }
    setLoading(false);
  };

  return (
    <Stack spacing={2.5}>
      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, border: '1px solid rgba(231, 76, 60, 0.3)' }}>
          {error}
        </Alert>
      )}

      <Stack spacing={1}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}
        >
          Nama Peserta
        </Typography>
        <Autocomplete
          freeSolo
          disableClearable
          open={dropdownOpen && name.length >= 2}
          onOpen={() => setDropdownOpen(true)}
          onClose={() => setDropdownOpen(false)}
          options={allowedNames}
          inputValue={name}
          onInputChange={(_, newValue) => setName(newValue)}
          onChange={(_, newValue) => setName(newValue || "")}
          slots={{
            paper: (props) => (
              <Paper
                {...props}
                sx={{
                  bgcolor: "#1a1a1a !important",
                  border: "1px solid rgba(255,255,255,0.1)",
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
                  backgroundImage: "none",
                  "& .MuiAutocomplete-option": {
                    py: 1.5,
                    color: "#ffffff !important",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.1) !important",
                    },
                    '&[aria-selected="true"]': {
                      bgcolor: "rgba(52, 152, 219, 0.3) !important",
                    },
                  },
                }}
              />
            ),
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              variant="outlined"
              placeholder="Ketik nama lengkap Anda..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  sx: { bgcolor: 'rgba(255,255,255,0.03)' }
                }
              }}
            />
          )}
        />
      </Stack>

      <Stack spacing={1}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}
        >
          Pilih Tanggal
        </Typography>
        <Calendar
          slots={slots}
          onSelect={setSelectedDate}
          selected={selectedDate}
        />
      </Stack>

      <Box sx={{ pt: 1, textAlign: "center" }}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !selectedDate || !name}
            fullWidth
            sx={{ 
                maxWidth: { sm: 400 },
                py: 1.5, 
                bgcolor: "#3498db",
                fontWeight: 800,
                fontSize: '0.9rem'
            }}
          >
            {loading ? "Memproses..." : "Jadwalkan Wawancara"}
          </Button>
        </motion.div>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          className: 'refined-card',
          sx: { p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ffffff' }}>
          Konfirmasi Jadwal
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Apakah Anda yakin ingin menjadwalkan wawancara pada:
          </DialogContentText>
          <Box sx={{ bgcolor: 'rgba(52, 152, 219, 0.1)', p: 2, borderRadius: 2, border: '1px solid rgba(52, 152, 219, 0.3)' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#3498db' }}>
              {selectedDate && format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: '#ffffff' }}>
              Atas Nama: {name}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
            Batal
          </Button>
          <Button 
            onClick={handleBooking} 
            variant="contained" 
            color="primary"
            sx={{ fontWeight: 800, px: 3 }}
          >
            Ya, Jadwalkan
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
