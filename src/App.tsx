import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { id } from "date-fns/locale";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const Admin = lazy(() => import("./pages/Admin"));

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3498db", // Retaining Action Blue
      contrastText: "#ffffff",
    },
    background: {
      default: "#000000", // Pure Black Background
      paper: "#121212", // Very Dark Grey Surface
    },
    text: {
      primary: "#ffffff", // Crisp White
      secondary: "rgba(255, 255, 255, 0.7)", // Improved Contrast
    },
    success: { main: "#2ecc71" },
    warning: { main: "#f39c12" },
    error: { main: "#e74c3c" },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    h1: { fontWeight: 800, color: "#ffffff", letterSpacing: "-1px" },
    h2: { fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" },
    h3: { fontWeight: 700, color: "#ffffff" },
    h4: { fontWeight: 700, color: "#ffffff" },
    button: { fontWeight: 700, textTransform: "none", letterSpacing: "0.2px" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          boxShadow: "none",
          textTransform: "none",
          fontWeight: 700,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            transform: "translateY(-1px)",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
        },
        contained: {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.15)",
          },
        },
        containedPrimary: {
          backgroundColor: "rgba(52, 152, 219, 0.15)",
          borderColor: "rgba(52, 152, 219, 0.3)",
          "&:hover": {
            backgroundColor: "rgba(52, 152, 219, 0.25)",
            borderColor: "rgba(52, 152, 219, 0.4)",
          },
        },
        containedError: {
          backgroundColor: "rgba(231, 76, 60, 0.15)",
          borderColor: "rgba(231, 76, 60, 0.3)",
          color: "#e74c3c",
          "&:hover": {
            backgroundColor: "rgba(231, 76, 60, 0.25)",
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.2)",
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "rgba(255, 255, 255, 0.4)",
          },
        },
        text: {
          backgroundColor: "transparent",
          border: "1px solid transparent",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#000000", // Black Nav
          backgroundImage: "none",
          boxShadow: "0 1px 0px rgba(255,255,255,0.1)", // Border-like shadow
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={id}>
        <AuthProvider>
          <CssBaseline />
          <Router>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <TopNav />
              <Box sx={{ pt: 3, flexGrow: 1 }}>
                <Suspense fallback={
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress size={40} thickness={4} sx={{ color: '#3498db' }} />
                  </Box>
                }>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/cohort/:slug" element={<Landing />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute>
                          <Admin />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </Box>
              <Footer />
            </Box>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
