import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { supabase } from "../lib/supabase";
import type { Slot, Reservation } from "../types";
import Calendar from "./Calendar";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCcw, Trash2, CalendarDays } from "lucide-react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
} from "../lib/calendar";
import type { CalendarEvent } from "../lib/calendar";

interface Props {
  reservation: Reservation & { slots: Slot };
  slots: Slot[];
  onDone: () => void;
}

export default function EditBooking({ reservation, slots, onDone }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    parseISO(reservation.slots.date),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const getEventData = (): CalendarEvent => {
    const startDate = parseISO(reservation.slots.date);
    startDate.setHours(9, 0, 0);

    return {
      title: `Wawancara: Kelompok ${reservation.slots.cohorts?.nama_kelompok} - ${reservation.slots.cohorts?.title}`,
      description: `Wawancara for ${reservation.user_name}.\nAccess Code: ${reservation.access_code}\nLocation: (Please check cohort announcement)`,
      startDate,
    };
  };

  const addToGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(getEventData()), "_blank");
    handleCloseMenu();
  };

  const addToOutlookCalendar = () => {
    window.open(getOutlookCalendarUrl(getEventData()), "_blank");
    handleCloseMenu();
  };

  const downloadIcal = () => {
    downloadIcsFile(getEventData(), `wawancara-${reservation.access_code}.ics`);
    handleCloseMenu();
  };

  const handleUpdate = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const newSlot = slots.find((s) => s.date === dateStr);
    if (!newSlot) {
      setError("Tanggal yang dipilih tidak tersedia.");
      return;
    }

    setConfirmOpen(false);
    setLoading(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("change_reservation", {
      p_access_code: reservation.access_code,
      p_new_slot_id: newSlot.id,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
    } else {
      onDone();
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    setLoading(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservation.id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
    } else {
      // Decrement the slot count using RPC
      await supabase.rpc("decrement_slot_count", {
        p_slot_id: reservation.slots.id,
      });
      onDone();
    }
  };

  const isSameDate = !!(
    selectedDate &&
    format(selectedDate, "yyyy-MM-dd") === reservation.slots.date
  );

  return (
    <Stack spacing={2.5}>
      {/* Header Section */}
      <Stack spacing={0.5} sx={{ textAlign: "right" }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: 900,
            color: "#3498db",
            letterSpacing: "1.5px",
            lineHeight: 1,
          }}
        >
          Ubah Reservasi
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#ffffff",
            fontSize: { xs: "1.2rem", sm: "1.5rem" },
            lineHeight: 1.1,
          }}
        >
          Halo, {reservation.user_name}
        </Typography>
      </Stack>

      <Divider sx={{ opacity: 0.1 }} />

      {error && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2, border: "1px solid rgba(231, 76, 60, 0.3)" }}
        >
          {error}
        </Alert>
      )}

      {/* Current Schedule Info */}
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              letterSpacing: "1px",
            }}
          >
            Jadwal Anda Saat Ini
          </Typography>
          <Button
            size="small"
            startIcon={<CalendarDays size={14} />}
            onClick={handleCalendarClick}
            sx={{
              color: "#2ecc71",
              fontSize: "0.7rem",
              fontWeight: 800,
              textTransform: "none",
              py: 0,
              minWidth: 0,
              "&:hover": { bgcolor: "rgba(46, 204, 113, 0.1)" },
            }}
          >
            Simpan ke Kalender
          </Button>
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: "rgba(52, 152, 219, 0.05)",
            borderRadius: 2,
            border: "1px solid rgba(52, 152, 219, 0.2)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ffffff" }}>
            {format(parseISO(reservation.slots.date), "EEEE, d MMMM yyyy", {
              locale: id,
            })}
          </Typography>
        </Box>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            bgcolor: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            borderRadius: 3,
            minWidth: 180,
            "& .MuiMenuItem-root": {
              py: 1,
              px: 1.5,
              fontSize: '0.85rem',
              color: "rgba(255,255,255,0.8)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "#fff",
              },
            },
          },
        }}
      >
        <MenuItem onClick={addToGoogleCalendar}>
          <ListItemIcon sx={{ color: '#ea4335', minWidth: '32px !important', fontSize: '1rem', fontWeight: 'bold' }}>G</ListItemIcon>
          <ListItemText primary="Google Calendar" />
        </MenuItem>
        <MenuItem onClick={addToOutlookCalendar}>
          <ListItemIcon sx={{ color: '#0078d4', minWidth: '32px !important', fontSize: '1rem', fontWeight: 'bold' }}>O</ListItemIcon>
          <ListItemText primary="Outlook / Office 365" />
        </MenuItem>
        <MenuItem onClick={downloadIcal}>
          <ListItemIcon sx={{ color: '#95a5a6', minWidth: '32px !important', fontSize: '1rem', fontWeight: 'bold' }}>I</ListItemIcon>
          <ListItemText primary="Apple Calendar / iCal" />
        </MenuItem>
      </Menu>

      {/* Date Selection */}
      <Stack spacing={1}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "1px",
          }}
        >
          Pilih Tanggal Baru
        </Typography>
        <Calendar
          slots={slots}
          onSelect={setSelectedDate}
          selected={selectedDate}
        />
      </Stack>

      {/* Action Buttons */}
      <Stack spacing={2} sx={{ pt: 1 }}>
        <motion.div
          whileHover={!isSameDate ? { scale: 1.02 } : {}}
          whileTap={!isSameDate ? { scale: 0.98 } : {}}
        >
          <Button
            variant="contained"
            fullWidth
            startIcon={<RefreshCcw size={18} />}
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !selectedDate || isSameDate}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 800,
              bgcolor: "#3498db",
              fontSize: "0.9rem",
              textTransform: "none",
            }}
          >
            {loading ? "Memproses..." : "Ubah Jadwal"}
          </Button>
        </motion.div>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onDone}
            startIcon={<ArrowLeft size={18} />}
            fullWidth
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              color: "rgba(255,255,255,0.5)",
              borderColor: "rgba(255,255,255,0.1)",
              fontWeight: 700,
              textTransform: "none",
              border: "1px solid",
              "&:hover": {
                borderColor: "rgba(255,255,255,0.3)",
                bgcolor: "rgba(255,255,255,0.02)",
                color: "#ffffff",
              },
            }}
          >
            Kembali
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteConfirmOpen(true)}
            startIcon={<Trash2 size={18} />}
            fullWidth
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              fontWeight: 700,
              textTransform: "none",
              border: "1px solid",
              opacity: 0.8,
              "&:hover": {
                opacity: 1,
                bgcolor: "rgba(231, 76, 60, 0.05)",
              },
            }}
          >
            Hapus Reservasi
          </Button>
        </Box>
      </Stack>

      {/* Update Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          className: "refined-card",
          sx: { p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffffff" }}>
          Konfirmasi Perubahan
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
            Apakah Anda yakin ingin memindahkan jadwal wawancara ke tanggal:
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            color="primary"
            sx={{ fontWeight: 800, px: 3 }}
          >
            Ya, Perbarui
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          className: "refined-card",
          sx: { p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#e74c3c" }}>
          Hapus Reservasi
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255,255,255,0.7)" }}>
            Apakah Anda yakin ingin menghapus reservasi ini? Tindakan ini tidak
            dapat dibatalkan dan slot Anda akan dikosongkan untuk orang lain.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}
          >
            Batal
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            sx={{ fontWeight: 800, px: 3 }}
          >
            Ya, Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
