import { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Lock, Settings } from "lucide-react";

export default function Footer() {
  const { isAdmin, login } = useAuth();
  const navigate = useNavigate();

  // Login dialog state
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleOpenLogin = () => {
    if (isAdmin) {
      navigate("/admin");
    } else {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPassword("");
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      handleClose();
      navigate("/admin");
    } else {
      setError(true);
      passwordInputRef.current?.focus();
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        py: 4, // Reduced from 6
        mt: "auto",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        bgcolor: "rgba(0, 0, 0, 0.2)",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="caption"
          align="center"
          sx={{
            color: "rgba(255, 255, 255, 0.4)",
            fontWeight: 600,
            letterSpacing: "0.5px",
            mb: 1, // Reduced from 3
            display: "block",
            fontSize: "0.65rem",
          }}
        >
          © {new Date().getFullYear()} Subseksi Katekumen Dewasa • Paroki St. Petrus, Katedral • Keuskupan Bandung<br />v1.2.0
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleOpenLogin}
            startIcon={isAdmin ? <Settings size={14} /> : <Lock size={14} />}
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(52, 152, 219, 0.15)", // Dark blue tint
              borderColor: "rgba(52, 152, 219, 0.4)", // Border color
              borderRadius: 1,
              fontSize: "0.7rem",
              textTransform: "none",
              fontWeight: 700,
              px: 2,
              py: 0.3, // Reduced vertical padding
              maxHeight: "32px", // Ensure button doesn't get too tall
              "&:hover": {
                bgcolor: "rgba(52, 152, 219, 0.25)",
                borderColor: "rgba(52, 152, 219, 0.6)",
              },
            }}
          >
            {isAdmin ? "Panel Admin" : "Admin Login"}
          </Button>
        </Box>
      </Container>

      {/* Obscured Login Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          className: "refined-card",
          sx: { width: "100%", maxWidth: 300 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Akses Admin
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              fullWidth
              autoFocus
              type="password"
              label="Password"
              size="small"
              sx={{ 
                mt: 1,
                "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
                  bgcolor: "#1a1a1a", // Matches .refined-card background
                  px: 1,
                  borderRadius: 1,
                  ml: -0.5
                }
              }}
              inputRef={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              helperText={error ? "Password incorrect" : ""}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={handleClose} color="inherit" size="small">
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="small">
              Login
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
