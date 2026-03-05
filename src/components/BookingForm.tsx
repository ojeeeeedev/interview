import { useState, useEffect, useMemo } from "react";
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Autocomplete,
  Paper,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Slot } from "../types";
import Calendar from "./Calendar";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Props {
  cohortId: string;
  slots: Slot[];
  onSuccess: (code: string) => void;
}

export default function BookingForm({ cohortId, slots, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [allowedNames, setAllowedNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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

  const filteredOptions = useMemo(() => {
    if (name.length < 2) return [];
    return allowedNames.filter((option) =>
      option.toLowerCase().includes(name.toLowerCase())
    );
  }, [name, allowedNames]);

  const handleNameChange = (newValue: string) => {
    setName(newValue);
    if (newValue.length >= 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleBooking = async () => {
    if (!name || !selectedDate) {
      setError("Mohon masukkan nama Anda dan pilih tanggal.");
      return;
    }

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
        setError("Anda sudah terdaftar untuk gelombang ini. Mohon gunakan Kode Akses Anda pada menu 'Cari Reservasi' di atas jika ingin mengubah jadwal.");
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
      setError("Nama Anda tidak terdaftar untuk gelombang ini.");
      setLoading(false);
      return;
    }

    // 3. Find slot id
    const dateStr = format(selectedDate, "yyyy-MM-dd");
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
      onSuccess(code);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(231, 76, 60, 0.3)' }}>
          {error}
        </Alert>
      )}

      <Autocomplete
        freeSolo
        disableClearable
        open={open && filteredOptions.length > 0}
        onOpen={() => {
          if (name.length >= 2) setOpen(true);
        }}
        onClose={() => setOpen(false)}
        options={filteredOptions}
        inputValue={name}
        onInputChange={(_, newValue) => handleNameChange(newValue)}
        onChange={(_, newValue) => {
          setName(newValue || "");
          setOpen(false);
        }}
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
                  color: "#ffffff",
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
            label="Nama Lengkap"
            fullWidth
            variant="outlined"
            placeholder="Masukkan minimal 2 karakter..."
            sx={{ mb: 4 }}
          />
        )}
      />

      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: "#ffffff" }}
      >
        Pilih Tanggal
      </Typography>
      <Calendar
        slots={slots}
        onSelect={setSelectedDate}
        selected={selectedDate}
      />

      <Box mt={6} textAlign="center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleBooking}
            disabled={loading || !selectedDate || !name}
            sx={{ px: 8, py: 2, bgcolor: "#3498db" }}
          >
            {loading ? "Memproses..." : "Konfirmasi Reservasi"}
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}
