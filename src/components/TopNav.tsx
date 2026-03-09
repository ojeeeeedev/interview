import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
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
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Menu as MenuIcon,
  Home,
  LogOut,
  Settings,
} from "lucide-react";

export default function TopNav() {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Mobile Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "transparent !important",
        backgroundImage: "none !important",
        boxShadow: "none !important",
        border: "none !important",
        mt: { xs: 1, md: 2 },
        mb: { xs: 0.5, md: 1 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 1, md: 0 } }}>
        <Toolbar
          disableGutters
          sx={{
            height: 64,
            px: { xs: 2, md: 2 },
            bgcolor: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box
            component={Link}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              flexGrow: 1,
              mr: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 52,
                width: 52,
                borderRadius: "50%",
                bgcolor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{
                  height: 48,
                  width: "auto",
                }}
              />
            </Box>
            <Typography
              sx={{
                color: "#ffffff",
                fontWeight: 900,
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                letterSpacing: "-0.5px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Sistem Reservasi
            </Typography>
          </Box>

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
                    borderLeft: "1px solid rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                    Menu
                  </Typography>
                  <List
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <ListItem disablePadding>
                      <ListItemButton
                        component={Link}
                        to="/"
                        onClick={() => setDrawerOpen(false)}
                        sx={{
                          borderRadius: 2,
                          bgcolor: isActive("/")
                            ? "rgba(52, 152, 219, 0.15)"
                            : "transparent",
                          color: isActive("/") ? "#3498db" : "#ffffff",
                        }}
                      >
                        <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                          <Home size={20} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Daftar Event/Wawancara"
                          primaryTypographyProps={{ fontWeight: 700 }}
                        />
                      </ListItemButton>
                    </ListItem>

                    {isAdmin && (
                      <ListItem disablePadding>
                        <ListItemButton
                          component={Link}
                          to="/admin"
                          onClick={() => setDrawerOpen(false)}
                          sx={{
                            borderRadius: 2,
                            bgcolor: isActive("/admin")
                              ? "rgba(52, 152, 219, 0.15)"
                              : "transparent",
                            color: isActive("/admin") ? "#3498db" : "#ffffff",
                          }}
                        >
                          <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                            <Settings size={20} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Pengaturan"
                            primaryTypographyProps={{ fontWeight: 700 }}
                          />
                        </ListItemButton>
                      </ListItem>
                    )}
                  </List>

                  <Divider
                    sx={{ my: 3, borderColor: "rgba(255,255,255,0.1)" }}
                  />

                  {isAdmin && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<LogOut size={18} />}
                      onClick={() => {
                        logout();
                        setDrawerOpen(false);
                        navigate("/");
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      Logout
                    </Button>
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
                startIcon={<Home size={18} />}
                sx={{
                  bgcolor: isActive("/")
                    ? "rgba(52, 152, 219, 0.2) !important"
                    : "rgba(255, 255, 255, 0.08)",
                  borderColor: isActive("/")
                    ? "rgba(52, 152, 219, 0.5) !important"
                    : "rgba(255, 255, 255, 0.1)",
                  color: isActive("/") ? "#3498db" : "#ffffff",
                  border: "1px solid",
                }}
              >
                Daftar Event/Wawancara
              </Button>

              {isAdmin ? (
                <>
                  <Button
                    component={Link}
                    to="/admin"
                    variant="contained"
                    startIcon={<Settings size={18} />}
                    sx={{
                      bgcolor: isActive("/admin")
                        ? "rgba(52, 152, 219, 0.2) !important"
                        : "rgba(255, 255, 255, 0.08)",
                      borderColor: isActive("/admin")
                        ? "rgba(52, 152, 219, 0.5) !important"
                        : "rgba(255, 255, 255, 0.1)",
                      color: isActive("/admin") ? "#3498db" : "#ffffff",
                      border: "1px solid",
                    }}
                  >
                    Panel Admin
                  </Button>
                  <Button
                    onClick={() => {
                        logout();
                        navigate("/");
                    }}
                    variant="contained"
                    color="error"
                    startIcon={<LogOut size={18} />}
                  >
                    Logout
                  </Button>
                </>
              ) : null}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
