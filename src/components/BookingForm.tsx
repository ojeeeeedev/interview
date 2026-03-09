import { useState, useEffect, useActionState, useTransition, useCallback } from "react";
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
  CircularProgress,
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
  onSuccess: (code: string, userName: string, dateStr: string, rawDate: Date) => void;
}

type ActionState = {
  error: string | null;
  success: boolean;
  code?: string;
  userName?: string;
  dateStr?: string;
  rawDate?: Date;
};

export default function BookingForm({ cohortId, slots, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [allowedNames, setAllowedNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Validation states
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [isNameVerified, setIsNameVerified] = useState(false);
  const [nameCheckError, setNameCheckError] = useState<string | null>(null);
  const [forceShowError, setForceShowError] = useState(false);

  // 10 second timeout for showing error if name < 4 chars
  useEffect(() => {
    if (name.trim().length > 0 && !isNameVerified && !nameCheckError) {
      const timer = setTimeout(() => {
        setForceShowError(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
        // Use a functional update to avoid synchronous setState in effect
        setForceShowError((prev) => (prev ? false : prev));
    }
  }, [name, isNameVerified, nameCheckError]);

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

  // Server-side check before allowing click
  useEffect(() => {
    const trimmedName = name.trim();
    if (!trimmedName || name.length < 1) {
      // Use startTransition to avoid synchronous setState error
      startTransition(() => {
        setIsNameVerified(false);
        setNameCheckError(null);
      });
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingName(true);

      const { data, error } = await supabase
        .from("allowed_names")
        .select("id")
        .eq("cohort_id", cohortId)
        .ilike("full_name", trimmedName)
        .maybeSingle();

      if (error) {
        setNameCheckError("Gagal memverifikasi nama");
        setIsNameVerified(false);
      } else if (!data) {
        // Only show error if 4+ chars OR 10s timeout reached
        if (trimmedName.length >= 4 || forceShowError) {
            setNameCheckError("Nama tidak terdaftar");
        }
        setIsNameVerified(false);
      } else {
        setIsNameVerified(true);
        setNameCheckError(null);
      }
      setIsValidatingName(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [name, cohortId, forceShowError]);

  const generateCode = useCallback(() => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }, []);

  const bookingAction = async (_prevState: ActionState | null, formData: FormData): Promise<ActionState> => {
    const userName = formData.get("userName") as string;
    const dateStr = formData.get("dateStr") as string;
    const selectedDateObj = new Date(dateStr);

    // 1. Check for double booking
    const { data: existing, error: checkError } = await supabase
      .from("reservations")
      .select("id, slots!inner(cohort_id)")
      .ilike("user_name", userName.trim())
      .eq("slots.cohort_id", cohortId)
      .maybeSingle();

    if (checkError) console.error(checkError);
    if (existing) {
      return { 
        error: "Anda sudah terdaftar untuk event ini. Mohon gunakan Kode Akses Anda pada menu 'Cari Reservasi' di atas jika ingin mengubah jadwal.",
        success: false 
      };
    }

    // 2. Double check on server for final safety
    const { data: allowed, error: allowedError } = await supabase
      .from("allowed_names")
      .select("*")
      .eq("cohort_id", cohortId)
      .ilike("full_name", userName.trim())
      .single();

    if (allowedError || !allowed) {
      return { error: "Nama Anda tidak terdaftar untuk event ini.", success: false };
    }

    // 3. Find slot
    const dateFormatted = format(selectedDateObj, "yyyy-MM-dd");
    const slot = slots.find((s) => s.date === dateFormatted);
    if (!slot) {
      return { error: "Tanggal yang dipilih tidak tersedia.", success: false };
    }

    const code = generateCode();
    const { error: bookError } = await supabase.rpc("book_reservation", {
      p_cohort_id: cohortId,
      p_slot_id: slot.id,
      p_user_name: userName.trim(),
      p_access_code: code,
    });

    if (bookError) {
      return { error: bookError.message, success: false };
    }

    const formattedDate = format(selectedDateObj, "EEEE, d MMMM yyyy", { locale: id });
    return {
      success: true,
      error: null,
      code,
      userName: userName.trim(),
      dateStr: formattedDate,
      rawDate: selectedDateObj
    };
  };

  const [state, formAction] = useActionState(bookingAction, null);

  const isSearching = name.trim().length > 0 && !isNameVerified && !nameCheckError;

  useEffect(() => {
    if (state?.success && state.code && state.userName && state.dateStr && state.rawDate) {
      onSuccess(state.code, state.userName, state.dateStr, state.rawDate);
    }
  }, [state, onSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isNameVerified && selectedDate) {
      setConfirmOpen(true);
    }
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    const formData = new FormData();
    formData.append("userName", name);
    formData.append("dateStr", selectedDate!.toISOString());
    
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {(state?.error || nameCheckError) && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Alert
            severity="error"
            sx={{ 
              borderRadius: 3, 
              border: "1px solid rgba(231, 76, 60, 0.2)",
              bgcolor: 'rgba(231, 76, 60, 0.05)',
              color: '#ff8a80',
              '& .MuiAlert-icon': { color: '#ff8a80' }
            }}
          >
            {state?.error || nameCheckError}
          </Alert>
        </motion.div>
      )}

      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: isNameVerified ? '#2ecc71' : '#3498db', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, transition: 'all 0.3s' }}>1</Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                color: "#ffffff",
                textTransform: "uppercase",
                fontSize: "0.8rem",
                letterSpacing: "1px",
              }}
            >
              Identitas Peserta
            </Typography>
          </Box>
          {isSearching && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#3498db', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                Mencari Nama...
              </Typography>
              <CircularProgress size={12} sx={{ color: '#3498db' }} />
            </Box>
          )}
          {isNameVerified && !isSearching && (
            <Typography variant="caption" sx={{ color: '#2ecc71', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>
              Nama Terdaftar ✓
            </Typography>
          )}
        </Box>
        <Autocomplete
          freeSolo
          disableClearable
          open={dropdownOpen && name.length >= 1}
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
                  borderRadius: 3,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
                  backgroundImage: "none",
                  "& .MuiAutocomplete-option": {
                    py: 1.5,
                    px: 2,
                    fontSize: '0.9rem',
                    color: "rgba(255,255,255,0.8) !important",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05) !important",
                      color: "#fff !important"
                    },
                    '&[aria-selected="true"]': {
                      bgcolor: "rgba(52, 152, 219, 0.2) !important",
                      color: "#3498db !important"
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
              required
              variant="outlined"
              placeholder="Masukkan nama lengkap sesuai pendaftaran..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress color="inherit" size={20} sx={{ mr: 1, opacity: 0.5 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                  sx: { 
                    bgcolor: "rgba(0,0,0,0.2)", 
                    borderRadius: 3,
                    fontSize: '0.95rem',
                    border: isNameVerified ? "1px solid rgba(46, 204, 113, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                    "& fieldset": { border: 'none' },
                    "&.Mui-focused": {
                       bgcolor: "rgba(0,0,0,0.4)",
                    }
                  },
                },
              }}
            />
          )}
        />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', px: 1 }}>
          * Nama harus sesuai dengan data yang terdaftar di sistem.
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#3498db', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>2</Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 900,
              color: "#ffffff",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              letterSpacing: "1px",
            }}
          >
            Pilih Tanggal Wawancara
          </Typography>
        </Box>
        <Calendar
          slots={slots}
          onSelect={setSelectedDate}
          selected={selectedDate}
        />
      </Stack>

      <Box sx={{ pt: 2, textAlign: "center" }}>
        <motion.div 
          whileHover={!isPending && selectedDate && isNameVerified ? { scale: 1.02 } : {}} 
          whileTap={!isPending && selectedDate && isNameVerified ? { scale: 0.98 } : {}}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isPending || !selectedDate || !isNameVerified || isValidatingName}
            fullWidth
            startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              py: 2,
              borderRadius: 3,
              bgcolor: "#3498db",
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: '0.5px',
              boxShadow: isNameVerified ? "0 8px 24px rgba(52, 152, 219, 0.3)" : "none",
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.2)"
              }
            }}
          >
            {isPending ? "Memproses..." : isValidatingName ? "Memverifikasi Nama..." : "Konfirmasi Jadwal"}
          </Button>
        </motion.div>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        PaperProps={{
          className: "refined-card",
          sx: { p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffffff" }}>
          Konfirmasi Jadwal
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
            Apakah Anda yakin ingin menjadwalkan wawancara pada:
          </DialogContentText>
          <Box
            sx={{
              bgcolor: "rgba(52, 152, 219, 0.1)",
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(52, 152, 219, 0.3)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#3498db" }}>
              {selectedDate &&
                format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mt: 0.5, color: "#ffffff" }}
            >
              Atas Nama: {name}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={isPending}
            sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            disabled={isPending}
            sx={{ fontWeight: 800, px: 3 }}
          >
            Ya, Jadwalkan
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
