import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { id } from 'date-fns/locale';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import TopNav from './components/TopNav';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3498db', // Retaining Action Blue
      contrastText: '#ffffff',
    },
    background: {
      default: '#000000', // Pure Black Background
      paper: '#121212',   // Very Dark Grey Surface
    },
    text: {
      primary: '#ffffff',   // Crisp White
      secondary: '#b0b0b0', // Off-White
    },
    success: { main: '#2ecc71' },
    warning: { main: '#f39c12' },
    error: { main: '#e74c3c' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    h1: { fontWeight: 800, color: '#ffffff' },
    h2: { fontWeight: 800, color: '#ffffff' },
    h3: { fontWeight: 700, color: '#ffffff' },
    h4: { fontWeight: 700, color: '#ffffff' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.5)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000', // Black Nav
          backgroundImage: 'none',
          boxShadow: '0 1px 0px rgba(255,255,255,0.1)', // Border-like shadow
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
            <TopNav />
            <Box sx={{ pt: 10 }}> 
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
            </Box>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
