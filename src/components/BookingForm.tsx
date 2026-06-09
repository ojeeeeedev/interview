import { useState, useEffect, useActionState, useTransition, useRef } from "react";
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
  ToggleButtonGroup,
  ToggleButton,
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

/**
 * BookingForm Component
 * 
 * The core interaction point for public users. Features include:
 * 1. Real-time name verification against the whitelist.
 * 2. Visual date selection using a custom Calendar.
 * 3. Atomic booking process via Supabase RPC.
 * 4. Double-booking prevention.
 */
export default function BookingForm({ cohortId, slots, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [allowedNames, setAllowedNames] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation states
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [isNameVerified, setIsNameVerified] = useState(false);
  const [nameCheckError, setNameCheckError] = useState<string | null>(null);
  const [forceShowError, setForceShowError] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      startTransition(() => {
        setSelectedSlot(null);
      });
      return;
    }
    const dateFormatted = format(selectedDate, "yyyy-MM-dd");
    const daySlots = slots.filter((s) => s.date === dateFormatted);
    
    startTransition(() => {
      if (daySlots.length === 1) {
        setSelectedSlot(daySlots[0]);
      } else {
        setSelectedSlot(null); // Force user to manually pick the session
      }
    });
  }, [selectedDate, slots]);

  /**
   * Smart Error Suppression Logic
   * To improve UX, errors for "Name not found" are suppressed until the user
   * has typed at least 4 characters or 10 seconds have passed.
   */
  useEffect(() => {
    if (name.trim().length > 0 && !isNameVerified && !nameCheckError) {
      const timer = setTimeout(() => {
        setForceShowError(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
        // Defer to avoid synchronous setState in effect
        const timer = setTimeout(() => setForceShowError(false), 0);
        return () => clearTimeout(timer);
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

    const lowercaseTrimmed = trimmedName.toLowerCase();
    const localMatches = allowedNames.filter(n => n.toLowerCase().includes(lowercaseTrimmed));
    const exactMatch = allowedNames.find(n => n.toLowerCase() === lowercaseTrimmed);
    const hasLocalMatches = localMatches.length > 0;

    let nameToCheck = trimmedName;
    let nameToSet = "";

    if (exactMatch) {
      nameToCheck = exactMatch;
      if (name !== exactMatch) {
        nameToSet = exactMatch;
      }
    } else if (localMatches.length === 1) {
      nameToCheck = localMatches[0];
      nameToSet = localMatches[0];
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setIsValidatingName(true);

      const { data, error } = await supabase
        .from("allowed_names")
        .select("id")
        .eq("cohort_id", cohortId)
        .ilike("full_name", nameToCheck)
        .maybeSingle();

      if (error) {
        setNameCheckError("Gagal memverifikasi nama");
        setIsNameVerified(false);
      } else if (!data) {
        // Only show error if 4+ chars OR 10s timeout reached, AND there are no local matches
        if (!hasLocalMatches && (trimmedName.length >= 4 || forceShowError)) {
            setNameCheckError("Nama tidak terdaftar");
        } else {
            setNameCheckError(null);
        }
        setIsNameVerified(false);
      } else {
        setIsNameVerified(true);
        setNameCheckError(null);
        if (nameToSet) {
          setName(nameToSet);
        }
      }
      setIsValidatingName(false);
    }, 600);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [name, cohortId, forceShowError, allowedNames]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      // If the dropdown is open, let Autocomplete handle the option selection first
      if (dropdownOpen) {
        return;
      }

      // If name is already verified, let the form submit normally
      if (isNameVerified) {
        return;
      }

      e.preventDefault();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        setIsNameVerified(false);
        setNameCheckError(null);
        return;
      }

      const lowercaseTrimmed = trimmedName.toLowerCase();
      const localMatches = allowedNames.filter(n => n.toLowerCase().includes(lowercaseTrimmed));
      const exactMatch = allowedNames.find(n => n.toLowerCase() === lowercaseTrimmed);

      let nameToCheck = trimmedName;
      let nameToSet = "";

      if (exactMatch) {
        nameToCheck = exactMatch;
        if (name !== exactMatch) {
          nameToSet = exactMatch;
        }
      } else if (localMatches.length === 1) {
        nameToCheck = localMatches[0];
        nameToSet = localMatches[0];
      }

      setIsValidatingName(true);

      const { data, error } = await supabase
        .from("allowed_names")
        .select("id")
        .eq("cohort_id", cohortId)
        .ilike("full_name", nameToCheck)
        .maybeSingle();

      if (error) {
        setNameCheckError("Gagal memverifikasi nama");
        setIsNameVerified(false);
      } else if (!data) {
        // If they hit Enter and it is invalid, immediately throw the error with the spelling check note
        setNameCheckError("Nama tidak terdaftar. Periksa ejaan nama anda");
        setIsNameVerified(false);
      } else {
        setIsNameVerified(true);
        setNameCheckError(null);
        if (nameToSet) {
          setName(nameToSet);
        }
      }
      setIsValidatingName(false);
    }
  };

  /**
   * Main Booking Action
   * This server-side action (React 19 pattern) handles:
   * 1. Double booking check.
   * 2. Final whitelist verification.
   * 3. Atomic transaction via RPC 'book_reservation' to prevent race conditions.
   */
  const bookingAction = async (_prevState: ActionState | null, formData: FormData): Promise<ActionState> => {
    const userName = formData.get("userName") as string;
    const dateStr = formData.get("dateStr") as string;
    const slotId = formData.get("slotId") as string;
    const selectedDateObj = new Date(dateStr);

    if (!slotId) {
      return { error: "Sesi belum dipilih.", success: false };
    }

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

    // 3. Find slot in DB and lock/verify
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .single();

    if (slotError || !slot) {
      return { error: "Slot yang dipilih tidak ditemukan.", success: false };
    }

    if (slot.count >= slot.quota) {
      return { error: "Slot yang dipilih sudah penuh.", success: false };
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
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
    const finalDateStr = slot.session_name !== "Sesi Utama"
      ? `${formattedDate} (${slot.session_name})`
      : formattedDate;

    return {
      success: true,
      error: null,
      code,
      userName: userName.trim(),
      dateStr: finalDateStr,
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
    if (isNameVerified && selectedSlot) {
      setConfirmOpen(true);
    }
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    const formData = new FormData();
    formData.append("userName", name);
    formData.append("dateStr", selectedDate!.toISOString());
    formData.append("slotId", selectedSlot!.id);
    
    startTransition(() => {
      formAction(formData);
    });
  };

  const daySlots = selectedDate
    ? slots.filter((s) => s.date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  return (
    <Stack spacing={3} component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {(state?.error || nameCheckError) && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Alert
            severity="error"
            sx={{ 
              borderRadius: "12px", 
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
            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: isNameVerified ? '#2ecc71' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, transition: 'all 0.3s' }}>1</Box>
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
              <Typography variant="caption" sx={{ color: '#2ecc71', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                Mencari Nama...
              </Typography>
              <CircularProgress size={12} sx={{ color: '#2ecc71' }} />
            </Box>
          )}          {isNameVerified && !isSearching && (
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
                  bgcolor: "rgba(25, 25, 25, 0.95) !important",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  mt: 1,
                  borderRadius: "12px",
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
                      bgcolor: "rgba(212, 175, 55, 0.2) !important",
                      color: "#d4af37 !important"
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
              placeholder="Masukkan nama lengkap..."
              onKeyDown={handleKeyDown}
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
                    borderRadius: "12px",
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
          * Nama harus sesuai dengan yang didaftarkan kepada panitia.
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: selectedDate ? '#2ecc71' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, transition: 'all 0.3s' }}>2</Box>
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
        {selectedDate && daySlots.length > 0 && (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 900,
                color: "rgba(255, 255, 255, 0.6)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
              }}
            >
              Pilih Sesi Wawancara:
            </Typography>
            <ToggleButtonGroup
              value={selectedSlot?.id || null}
              exclusive
              onChange={(_, value) => {
                if (value !== null) {
                  const found = slots.find((s) => s.id === value);
                  setSelectedSlot(found || null);
                }
              }}
              fullWidth
              sx={{
                display: "grid",
                gridTemplateColumns: daySlots.length > 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(100px, 1fr))",
                gap: 1.5,
                "& .MuiToggleButtonGroup-grouped": {
                  border: "1px solid rgba(255, 255, 255, 0.1) !important",
                  borderRadius: "12px !important",
                  color: "rgba(255, 255, 255, 0.6)",
                  bgcolor: "rgba(0, 0, 0, 0.2)",
                  py: 1.25,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                  },
                  "&.Mui-selected": {
                    bgcolor: "rgba(46, 204, 113, 0.15) !important",
                    color: "#2ecc71 !important",
                    borderColor: "rgba(46, 204, 113, 0.4) !important",
                    boxShadow: "0 0 10px rgba(46, 204, 113, 0.15)",
                    fontWeight: 800,
                    "&:hover": {
                      bgcolor: "rgba(46, 204, 113, 0.2) !important",
                    }
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255, 255, 255, 0.15)",
                    bgcolor: "rgba(255, 255, 255, 0.02)",
                    borderColor: "rgba(255, 255, 255, 0.05) !important",
                  }
                },
              }}
            >
              {daySlots.map((s) => {
                const isFull = s.count >= s.quota;
                return (
                  <ToggleButton
                    key={s.id}
                    value={s.id}
                    disabled={isFull}
                  >
                    <Stack spacing={0.25} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: "inherit", fontSize: '0.9rem' }}>
                        {s.session_name}
                      </Typography>
                      {isFull ? (
                        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "#ff8a80", fontWeight: 700 }}>
                          Penuh
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>
                          {s.quota - s.count} slot
                        </Typography>
                      )}
                    </Stack>
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Stack>
        )}
        {selectedSlot && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "10px",
              px: 2,
              py: 1,
              mt: 1.5,
            }}
          >
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>
              Sisa Kuota Sesi:
            </Typography>
            <Typography variant="caption" sx={{ color: selectedSlot.quota - selectedSlot.count <= 2 ? "#ff8a80" : "#2ecc71", fontWeight: 800 }}>
              {selectedSlot.quota - selectedSlot.count} / {selectedSlot.quota} slot tersedia
            </Typography>
          </Box>
        )}
      </Stack>

      <Box sx={{ pt: 2, textAlign: "center" }}>
        <motion.div 
          whileHover={!isPending && selectedSlot && isNameVerified && !isValidatingName ? { scale: 1.02, y: -4 } : {}} 
          whileTap={!isPending && selectedSlot && isNameVerified && !isValidatingName ? { scale: 0.98 } : {}}
        >
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isPending || !selectedSlot || !isNameVerified || isValidatingName}
            fullWidth
            startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              height: 56,
              borderRadius: "12px",
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: '0.5px',
              textTransform: 'none',
              position: 'relative',
              // Glassmorphic Green Style
              background: (!isPending && !isValidatingName && isNameVerified && selectedSlot) 
                ? 'rgba(20, 80, 45, 0.25)' 
                : 'rgba(255,255,255,0.05)',
              backdropFilter: (!isPending && !isValidatingName && isNameVerified && selectedSlot) ? 'blur(12px)' : 'none',
              border: (!isPending && !isValidatingName && isNameVerified && selectedSlot) ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(255,255,255,0.05)',
              color: (!isPending && !isValidatingName && isNameVerified && selectedSlot) ? '#2ecc71' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.4s ease',
              // Persistent Glow Animation (Alternating Colors)
              animation: (!isPending && !isValidatingName && isNameVerified && selectedSlot) ? 'glow-alternate-btn 4s ease-in-out infinite' : 'none',
              '@keyframes glow-alternate-btn': {
                '0%': { 
                  boxShadow: '0 0 8px rgba(123, 239, 178, 0.3)',
                  borderColor: 'rgba(46, 204, 113, 0.4)' 
                },
                 '50%': { 
                   boxShadow: '0 0 8px rgba(212, 175, 55, 0.3)',
                   borderColor: 'rgba(212, 175, 55, 0.4)' 
                 },
                '100%': { 
                  boxShadow: '0 0 8px rgba(123, 239, 178, 0.3)',
                  borderColor: 'rgba(46, 204, 113, 0.4)' 
                },
              },
              '&:hover': { 
                background: 'rgba(46, 204, 113, 0.2)',
                borderColor: 'rgba(46, 204, 113, 0.6)',
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.2)",
                border: '1px solid rgba(255,255,255,0.05)',
              }
            }}
          >
            {isPending ? "Memproses..." : isValidatingName ? "Memverifikasi Nama..." : "Konfirmasi Jadwal"}
          </Button>
        </motion.div>
        
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 2, 
            color: 'rgba(255,255,255,0.4)', 
            fontSize: '0.7rem',
            lineHeight: 1.4,
            px: 1
          }}
        >
          <strong>Perhatian:</strong> Tidak akan ada slot tambahan, dan slot yang sudah didaftarkan hanya dapat diubah oleh peserta secara mandiri, panitia tidak dapat merubah pendaftaran yang sudah tercatat dalam sistem.
        </Typography>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        PaperProps={{
          className: "refined-card",
          sx: { p: 1, borderRadius: "12px" },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffffff" }}>
          Konfirmasi Jadwal
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.4)", mb: 2 }}>
            Apakah Anda yakin ingin menjadwalkan wawancara pada:
          </DialogContentText>
          <Box
            sx={{
              bgcolor: "rgba(46, 204, 113, 0.1)",
              p: 2.5,
              borderRadius: "12px",
              border: "1px solid rgba(46, 204, 113, 0.3)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#2ecc71" }}>
              {selectedDate &&
                format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
              {selectedSlot && selectedSlot.session_name !== "Sesi Utama" && ` (${selectedSlot.session_name})`}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mt: 0.5, color: "#ffffff" }}
            >
              Atas Nama: {name}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0.5 }}>
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
              variant="outlined"
              fullWidth
              sx={{ 
                color: "rgba(255,255,255,0.5)", 
                fontWeight: 700, 
                height: 44,
                borderRadius: "10px",
                borderColor: "rgba(255,255,255,0.1)",
                textTransform: 'none',
                '&:hover': {
                  borderColor: "rgba(255,255,255,0.2)",
                  bgcolor: "rgba(255,255,255,0.05)"
                }
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              disabled={isPending}
              fullWidth
              sx={{ 
                fontWeight: 800, 
                height: 44,
                borderRadius: "10px",
                bgcolor: 'rgba(20, 80, 45, 0.4)',
                border: '1px solid rgba(46, 204, 113, 0.4)',
                color: '#2ecc71',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'rgba(46, 204, 113, 0.2)',
                  borderColor: 'rgba(46, 204, 113, 0.6)',
                }
              }}
            >
              Jadwalkan
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
