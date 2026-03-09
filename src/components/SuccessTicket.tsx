import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Fade,
  Snackbar,
  Alert,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { CheckCircle, Image as ImageIcon, ArrowLeft, CalendarDays } from "lucide-react";
import { toPng } from "html-to-image";
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
} from "../lib/calendar";
import type { CalendarEvent } from "../lib/calendar";

interface Props {
  code: string;
  userName: string;
  cohortName: string;
  schedule: string;
  rawDate: Date;
  onDone: () => void;
}

export default function SuccessTicket({
  code,
  userName,
  cohortName,
  schedule,
  rawDate,
  onDone,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const handleDownloadImage = async () => {
    if (ticketRef.current === null) return;

    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: "#1a1a1a",
      });
      const link = document.createElement("a");
      link.download = `tiket-interview-${code}.png`;
      link.href = dataUrl;
      link.click();
      setSnackbar({
        open: true,
        message: "Gambar tiket berhasil diunduh!",
        severity: "success",
      });
    } catch (err) {
      console.error("oops, something went wrong!", err);
      setSnackbar({
        open: true,
        message: "Gagal mengunduh gambar tiket.",
        severity: "error",
      });
    }
  };

  const handleCalendarClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const getEventData = (): CalendarEvent => {
    const startDate = new Date(rawDate);
    startDate.setHours(9, 0, 0);

    return {
      title: `Event: ${cohortName}`,
      description: `Wawancara untuk ${userName}.\nKode Akses: ${code}\nLokasi: (Silakan cek pengumuman kelompok)`,
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
    downloadIcsFile(getEventData(), `wawancara-${code}.ics`);
    handleCloseMenu();
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: "rgba(0,0,0,0.8)" }}
    >
      <Fade in={true} timeout={1000}>
        <Box sx={{ maxWidth: 400, width: "100%", px: 2 }}>
          {/* Capturable Ticket Area */}
          <Paper
            ref={ticketRef}
            className="refined-card"
            sx={{
              p: { xs: 3, md: 4 },
              textAlign: "center",
              width: "100%",
              bgcolor: "#1a1a1a !important",
              mb: 3,
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <CheckCircle
              size={60}
              color="#2ecc71"
              style={{ marginBottom: 20 }}
            />
            <Typography
              variant="h4"
              sx={{ color: "#ffffff", fontWeight: 800, mb: 1 }}
            >
              Berhasil!
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.6)", mb: 4, fontWeight: 500 }}
            >
              Gunakan kode di bawah ini untuk merubah jadwal wawancara Anda jika
              diperlukan.
            </Typography>

            <Box
              sx={{
                bgcolor: "rgba(52, 152, 219, 0.05)",
                py: 2,
                px: 4,
                borderRadius: 3,
                display: "inline-block",
                mb: 2,
                border: "1px dashed rgba(52, 152, 219, 0.4)",
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 4,
                  color: "#3498db",
                  m: 0,
                }}
              >
                {code}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "left", mt: 1, mb: 3 }}>
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  Nama Peserta
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#ffffff", fontWeight: 700 }}
                >
                  {userName}
                </Typography>
              </Box>
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  Event / Kelompok
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#ffffff", fontWeight: 700 }}
                >
                  {cohortName}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.4)",
                    textTransform: "uppercase",
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  Jadwal Wawancara
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#ffffff", fontWeight: 700 }}
                >
                  {schedule}
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.3)",
                display: "block",
                letterSpacing: 2,
                fontWeight: 800,
              }}
            >
              Sistem Reservasi Wawancara
              <br />
              Katekumen Dewasa
              <br />
              Paroki St. Petrus, Bandung
            </Typography>
          </Paper>

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ImageIcon size={16} />}
                onClick={handleDownloadImage}
                fullWidth
                sx={{
                  py: 1,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  fontSize: "0.8rem",
                  background: "linear-gradient(45deg, #3498db, #2980b9)",
                  boxShadow: "0 4px 14px 0 rgba(52, 152, 219, 0.39)",
                }}
              >
                Simpan Tiket
              </Button>

              <Button
                variant="contained"
                onClick={handleCalendarClick}
                startIcon={<CalendarDays size={16} />}
                fullWidth
                sx={{
                  py: 1,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  fontSize: "0.8rem",
                  bgcolor: "rgba(46, 204, 113, 0.15)",
                  color: "#2ecc71",
                  border: "1px solid rgba(46, 204, 113, 0.3)",
                  "&:hover": {
                    bgcolor: "rgba(46, 204, 113, 0.25)",
                    borderColor: "rgba(46, 204, 113, 0.5)",
                  },
                }}
              >
                Ke Kalender
              </Button>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleCloseMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  bgcolor: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  borderRadius: 3,
                  minWidth: 180,
                  "& .MuiMenuItem-root": {
                    py: 1.2,
                    px: 2,
                    fontSize: '0.9rem',
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
                <ListItemIcon sx={{ color: '#ea4335' }}>G</ListItemIcon>
                <ListItemText primary="Google Calendar" />
              </MenuItem>
              <MenuItem onClick={addToOutlookCalendar}>
                <ListItemIcon sx={{ color: '#0078d4' }}>O</ListItemIcon>
                <ListItemText primary="Outlook / Office 365" />
              </MenuItem>
              <MenuItem onClick={downloadIcal}>
                <ListItemIcon sx={{ color: '#95a5a6' }}>I</ListItemIcon>
                <ListItemText primary="Apple Calendar / iCal" />
              </MenuItem>
            </Menu>

            <Button
              variant="outlined"
              onClick={onDone}
              startIcon={<ArrowLeft size={18} />}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 3,
                color: "rgba(255,255,255,0.5)",
                borderColor: "rgba(255,255,255,0.1)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.4)",
                  bgcolor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                },
              }}
            >
              Selesai & Kembali
            </Button>
          </Stack>
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
