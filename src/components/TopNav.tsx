import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Popover,
  TextField,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock } from "lucide-react";

export default function TopNav() {
  const { isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();

  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleOpenLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseLogin = () => {
    setAnchorEl(null);
    setPassword("");
    setError(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      handleCloseLogin();
      navigate("/admin");
    } else {
      setError(true);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64 }}>
          <Typography
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-1px",
            }}
          >
            Subseksi Katekumen Dewasa - Paroki St. Petrus, Bandung
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            {isAdmin ? (
              <>
                <Button
                  component={Link}
                  to="/admin"
                  sx={{ color: "#ffffff", fontWeight: 700 }}
                >
                  Pengaturan Wawancara
                </Button>
                <Button
                  onClick={logout}
                  sx={{ color: "#e74c3c", fontWeight: 700 }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={handleOpenLogin}
                variant="outlined"
                sx={{
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                  px: 3,
                  borderRadius: 2,
                }}
              >
                Admin Login
              </Button>
            )}
          </Box>

          {/* Admin Login Popover */}
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleCloseLogin}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                mt: 1.5,
                p: 3,
                width: 280,
                bgcolor: "#121212 !important", // Dark gray for popover
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundImage: "none",
              },
            }}
          >
            <form onSubmit={handleLoginSubmit}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Lock size={16} color="#3498db" />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: "#ffffff" }}
                >
                  Admin Password
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                type="password"
                label="Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                autoFocus
                sx={{ mb: 2 }}
              />

              {error && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mb: 2, fontWeight: 600 }}
                >
                  Password salah!
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                type="submit"
                size="small"
                sx={{ bgcolor: "#3498db" }}
              >
                Masuk
              </Button>
            </form>
          </Popover>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
