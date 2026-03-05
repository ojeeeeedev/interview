import { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Popover,
  TextField,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Search, Menu as MenuIcon, Home, LogOut, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function TopNav() {
  const { isAdmin, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Popover state
  const [adminAnchorEl, setAdminAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState(false);

  const [searchAnchorEl, setSearchAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchCode, setSearchCode] = useState("");
  const [searchError, setSearchError] = useState(false);

  // Mobile Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);

  const handleOpenLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setMobileLoginOpen(!mobileLoginOpen);
    } else {
      setAdminAnchorEl(event.currentTarget);
    }
  };

  const handleCloseLogin = () => {
    setAdminAnchorEl(null);
    setPassword("");
    setAdminError(false);
    setMobileLoginOpen(false);
  };

  const handleOpenSearch = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) {
      setMobileSearchOpen(!mobileSearchOpen);
    } else {
      setSearchAnchorEl(event.currentTarget);
    }
  };

  const handleCloseSearch = () => {
    setSearchAnchorEl(null);
    setSearchCode("");
    setSearchError(false);
    setMobileSearchOpen(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      handleCloseLogin();
      navigate("/admin");
    } else {
      setAdminError(true);
      passwordInputRef.current?.focus();
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode) return;

    const { data, error } = await supabase
      .from("reservations")
      .select("*, slots(cohorts(unique_slug))")
      .eq("access_code", searchCode.toUpperCase())
      .single();

    if (error || !data) {
      setSearchError(true);
      if (isMobile) {
        // Simple alert or feedback for mobile
      } else {
        searchInputRef.current?.focus();
      }
    } else {
      const slug = (data.slots as any).cohorts.unique_slug;
      handleCloseSearch();
      setDrawerOpen(false);
      navigate(`/cohort/${slug}?edit=${searchCode.toUpperCase()}`);
    }
  };

  const isAdminOpen = Boolean(adminAnchorEl);
  const isSearchOpen = Boolean(searchAnchorEl);
  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64, px: { xs: 2, md: 0 } }}>
          <Typography
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: { xs: "1rem", sm: "1.2rem" },
              letterSpacing: "-0.5px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mr: 2
            }}
          >
            Sistem Reservasi Wawancara
          </Typography>

          {isMobile ? (
            <>
              <IconButton 
                color="inherit" 
                onClick={() => setDrawerOpen(true)}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                  sx: {
                    width: 280,
                    bgcolor: "#000000",
                    borderLeft: "1px solid rgba(255,255,255,0.1)"
                  }
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Menu</Typography>
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <ListItem disablePadding>
                      <ListItemButton
                        component={Link}
                        to="/"
                        onClick={() => setDrawerOpen(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isActive("/") ? "rgba(52, 152, 219, 0.15)" : "transparent",
                          color: isActive("/") ? "#3498db" : "#ffffff",
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Home size={20} /></ListItemIcon>
                        <ListItemText primary="Beranda" primaryTypographyProps={{ fontWeight: 700 }} />
                      </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <ListItemButton
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: mobileSearchOpen ? "rgba(255, 255, 255, 0.05)" : "transparent",
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Search size={20} /></ListItemIcon>
                        <ListItemText primary="Ubah Jadwal" primaryTypographyProps={{ fontWeight: 700 }} />
                        {mobileSearchOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </ListItemButton>
                      
                      <Collapse in={mobileSearchOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, mt: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <form onSubmit={handleSearchSubmit}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Kode Akses"
                              value={searchCode}
                              onChange={(e) => setSearchCode(e.target.value)}
                              error={searchError}
                              helperText={searchError ? "Kode tidak ditemukan" : ""}
                              sx={{ mb: 2 }}
                              slotProps={{
                                input: {
                                  sx: { textTransform: 'uppercase', fontWeight: 700 }
                                }
                              }}
                            />
                            <Button 
                              fullWidth 
                              variant="contained" 
                              type="submit"
                              size="small"
                            >
                              Cari & Ubah
                            </Button>
                          </form>
                        </Box>
                      </Collapse>
                    </ListItem>

                    {isAdmin && (
                      <ListItem disablePadding>
                        <ListItemButton
                          component={Link}
                          to="/admin"
                          onClick={() => setDrawerOpen(false)}
                          sx={{
                            borderRadius: 2,
                            bgcolor: isActive("/admin") ? "rgba(52, 152, 219, 0.15)" : "transparent",
                            color: isActive("/admin") ? "#3498db" : "#ffffff",
                          }}
                        >
                          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Settings size={20} /></ListItemIcon>
                          <ListItemText primary="Pengaturan" primaryTypographyProps={{ fontWeight: 700 }} />
                        </ListItemButton>
                      </ListItem>
                    )}
                  </List>
                  
                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                  
                  {isAdmin ? (
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<LogOut size={18} />}
                      onClick={() => {
                        logout();
                        setDrawerOpen(false);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Logout
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <ListItemButton
                        onClick={() => setMobileLoginOpen(!mobileLoginOpen)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: mobileLoginOpen ? "rgba(255, 255, 255, 0.05)" : "transparent",
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Lock size={20} /></ListItemIcon>
                        <ListItemText primary="Admin Login" primaryTypographyProps={{ fontWeight: 700 }} />
                        {mobileLoginOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </ListItemButton>
                      
                      <Collapse in={mobileLoginOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, mt: 1, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <form onSubmit={handleLoginSubmit}>
                            <TextField
                              fullWidth
                              size="small"
                              type="password"
                              label="Admin Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              error={adminError}
                              helperText={adminError ? "Password salah" : ""}
                              sx={{ mb: 2 }}
                            />
                            <Button 
                              fullWidth 
                              variant="contained" 
                              type="submit"
                              size="small"
                            >
                              Masuk
                            </Button>
                          </form>
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                component={Link}
                to="/"
                variant="contained"
                sx={{
                  bgcolor: isActive("/") ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  borderColor: isActive("/") ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
                }}
              >
                Beranda
              </Button>

              <Button
                onClick={handleOpenSearch}
                variant="contained"
                sx={{
                  bgcolor: isSearchOpen ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                  borderColor: isSearchOpen ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)",
                }}
              >
                Ubah Jadwal
              </Button>

              {isAdmin ? (
                <>
                  <Button
                    component={Link}
                    to="/admin"
                    variant="contained"
                    color="primary"
                    sx={{
                      bgcolor: isActive("/admin") ? "rgba(52, 152, 219, 0.3)" : undefined,
                      borderColor: isActive("/admin") ? "rgba(52, 152, 219, 0.6)" : undefined,
                    }}
                  >
                    Pengaturan Wawancara
                  </Button>
                  <Button
                    onClick={logout}
                    variant="contained"
                    color="error"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleOpenLogin}
                  variant="contained"
                >
                  Admin Login
                </Button>
              )}
            </Box>
          )}

          {/* Search Popover (Desktop Only) */}
          {!isMobile && (
            <Popover
              open={isSearchOpen}
              anchorEl={searchAnchorEl}
              onClose={handleCloseSearch}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              TransitionProps={{
                onEntered: () => {
                  searchInputRef.current?.focus();
                }
              }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  p: 3,
                  width: 320,
                  bgcolor: "#121212 !important",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundImage: "none",
                  borderRadius: 3,
                  backdropFilter: 'blur(20px)',
                },
              }}
            >
              <form onSubmit={handleSearchSubmit}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Search size={16} color="#3498db" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#ffffff" }}>
                    Cari Reservasi
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  label="Kode Akses (misal: ABCDEF)"
                  inputRef={searchInputRef}
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  error={searchError}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      sx: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }
                    }
                  }}
                />

                {searchError && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mb: 2, fontWeight: 600 }}>
                    Kode tidak ditemukan! Silakan cek kembali.
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  color="primary"
                  sx={{ py: 1.2 }}
                >
                  Cari & Ubah
                </Button>
              </form>
            </Popover>
          )}

          {/* Admin Login Popover */}
          <Popover
            open={isAdminOpen}
            anchorEl={adminAnchorEl}
            onClose={handleCloseLogin}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            TransitionProps={{
              onEntered: () => {
                passwordInputRef.current?.focus();
              }
            }}
            PaperProps={{
              sx: {
                mt: 1.5,
                p: 3,
                width: { xs: "calc(100vw - 32px)", sm: 280 },
                maxWidth: 280,
                bgcolor: "#121212 !important",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundImage: "none",
                borderRadius: 3,
              },
            }}
          >
            <form onSubmit={handleLoginSubmit}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Lock size={16} color="#3498db" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#ffffff" }}>
                  Admin Password
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                type="password"
                label="Password..."
                inputRef={passwordInputRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={adminError}
                sx={{ mb: 2 }}
              />

              {adminError && (
                <Typography variant="caption" color="error" sx={{ display: "block", mb: 2, fontWeight: 600 }}>
                  Password salah!
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                type="submit"
                size="large"
                sx={{ py: 1.2 }}
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
