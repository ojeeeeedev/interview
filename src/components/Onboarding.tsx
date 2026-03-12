import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  MobileStepper,
  Stack,
  IconButton
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Ticket,
  Edit2,
  Clock,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

const steps = [
  {
    title: "Selamat Datang!",
    description: "Sistem Manajemen Event ini akan membantu Anda mendaftar pada jadwal wawancara atau event yang tersedia.",
    icon: <CalendarDays size={48} color="#3498db" />
  },
  {
    title: "Memilih Event",
    description: "Pilih event yang sedang 'Dibuka'. Perhatikan waktu buka (countdown) dan waktu tutup pendaftaran pada setiap kartu event.",
    icon: <Clock size={48} color="#f39c12" />
  },
  {
    title: "Pendaftaran Jadwal",
    description: "Klik 'Daftar', ketik nama Anda untuk verifikasi, lalu pilih tanggal wawancara yang masih memiliki slot ketersediaan.",
    icon: <CheckCircle2 size={48} color="#2ecc71" />
  },
  {
    title: "Simpan Tiket Anda",
    description: "Setelah berhasil, Anda akan mendapatkan Tiket dan Kode Akses 6 digit. Harap simpan atau screenshot tiket tersebut!",
    icon: <Ticket size={48} color="#9b59b6" />
  },
  {
    title: "Ubah atau Batal",
    description: "Untuk mengubah jadwal atau membatalkan reservasi, masukkan 6 digit Kode Akses Anda di kolom pencarian pada halaman utama.",
    icon: <Edit2 size={48} color="#e74c3c" />
  },
  {
    title: "Tukar Jadwal?",
    description: "Jika jadwal sudah penuh dan Anda ingin bertukar slot dengan orang lain, Anda berdua harus 'Hapus Reservasi' terlebih dahulu, lalu mendaftar ulang di slot yang baru.",
    icon: <RefreshCw size={48} color="#9b59b6" />
  },
  {
    title: "Perhatian Penting",
    description: "Tidak akan ada slot tambahan, dan slot yang sudah didaftarkan hanya dapat diubah oleh peserta secara mandiri, panitia tidak dapat merubah pendaftaran yang sudah tercatat dalam sistem.",
    icon: <CalendarDays size={48} color="#e74c3c" />
  }
];

export default function Onboarding() {
  const [open, setOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("hasSeenOnboarding");
    }
    return false;
  });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleOpenOnboarding = () => {
      setActiveStep(0);
      setOpen(true);
    };

    window.addEventListener("open-onboarding", handleOpenOnboarding);
    return () => window.removeEventListener("open-onboarding", handleOpenOnboarding);
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: "#1a1a1a",
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 3,
        }
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "rgba(255,255,255,0.5)",
            zIndex: 10,
          }}
        >
          <X size={20} />
        </IconButton>

        <DialogContent sx={{ p: 4, minHeight: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ textAlign: "center" }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {steps[activeStep].icon}
                </Box>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                {steps[activeStep].title}
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                {steps[activeStep].description}
              </Typography>
            </motion.div>
          </AnimatePresence>
        </DialogContent>

        <Box sx={{ p: 3, pt: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MobileStepper
            variant="dots"
            steps={steps.length}
            position="static"
            activeStep={activeStep}
            sx={{
              bgcolor: "transparent",
              p: 0,
              mb: 3,
              "& .MuiMobileStepper-dot": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
              "& .MuiMobileStepper-dotActive": {
                bgcolor: "#3498db",
              }
            }}
            nextButton={null}
            backButton={null}
          />
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
            <IconButton
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ color: "rgba(255,255,255,0.6)", "&.Mui-disabled": { opacity: 0 } }}
            >
              <ChevronLeft size={24} />
            </IconButton>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#2ecc71",
                  "&:hover": {
                    bgcolor: "#27ae60",
                  }
                }}
              >
                Mulai
              </Button>
            ) : (
              <IconButton
                onClick={handleNext}
                sx={{ color: "rgba(255,255,255,0.6)" }}
              >
                <ChevronRight size={24} />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
