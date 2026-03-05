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
} from "@mui/material";
import { CheckCircle, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";

interface Props {
  code: string;
  userName: string;
  cohortName: string;
  schedule: string;
  onDone: () => void;
}

export default function SuccessTicket({
  code,
  userName,
  cohortName,
  schedule,
  onDone,
}: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
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
            <Button
              variant="contained"
              color="primary"
              startIcon={<ImageIcon size={18} />}
              onClick={handleDownloadImage}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 3,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "1rem",
                background: "linear-gradient(45deg, #3498db, #2980b9)",
                boxShadow: "0 4px 14px 0 rgba(52, 152, 219, 0.39)",
              }}
            >
              Simpan Tiket
            </Button>

            <Button
              variant="outlined"
              onClick={onDone}
              startIcon={<ArrowLeft size={18} />}
              fullWidth
              sx={{
                py: 1.5,
                borderRadius: 3,
                color: "#ffffff",
                borderColor: "rgba(255,255,255,0.2)",
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(255,255,255,0.4)",
                  bgcolor: "rgba(255,255,255,0.05)",
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
