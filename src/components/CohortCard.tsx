import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  CardContent,
  Grid,
  Button,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { motion } from "framer-motion";
import { CircleChevronRight } from "lucide-react";

import type { CohortWithSlots } from "../types";
import RegistrationStatus from "./RegistrationStatus";

const motionItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

interface Props {
  cohort: CohortWithSlots;
  isAdmin: boolean;
  now?: Date;
  onStatusChange?: () => void;
}

/**
 * CohortCard Component
 *
 * Represents a single event card on the home page.
 * Handles visual state based on access rules:
 * - Administrators can always access/preview cards.
 * - Regular users can only access if registration is open and slots exist.
 */
export default function CohortCard({ cohort, isAdmin, now: parentNow, onStatusChange }: Props) {
  const [internalNow, setInternalNow] = useState(new Date());
  const now = parentNow || internalNow;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Update internal time every minute only if parent doesn't provide it
  useEffect(() => {
    if (parentNow) return;
    const timer = setInterval(() => setInternalNow(new Date()), 1000 * 60);
    return () => clearInterval(timer);
  }, [parentNow]);

  const isStarted = !cohort.start_at || now >= new Date(cohort.start_at);
  const isEnded = cohort.end_at && now >= new Date(cohort.end_at);
  const hasSlots = cohort.slots.length > 0;

  // Access control: disable if unscheduled or past. Admins can access even if not started.
  const canAccess = (isStarted || isAdmin) && !isEnded && hasSlots;

  return (
    <motion.div
      variants={motionItem}
      whileHover={canAccess ? { y: -4 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Paper
        component={canAccess ? Link : Box}
        to={canAccess ? `/cohort/${cohort.unique_slug}` : undefined}
        elevation={0}
        sx={{
          cursor: canAccess ? "pointer" : "default",
          textDecoration: "none",
          display: "block",
          position: "relative",
          borderRadius: 1,
          overflow: "hidden",
          background: "rgba(25, 25, 25, 0.6)",
          backdropFilter: "blur(12px)",
          border: canAccess
            ? "1px solid rgba(212, 175, 55, 0.25)"
            : "1px solid rgba(255, 255, 255, 0.08)",
          transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
          pointerEvents: canAccess ? "auto" : "none",
          "&:hover": canAccess
            ? {
                background: "rgba(35, 35, 35, 0.8)",
                borderColor: "rgba(212, 175, 55, 0.7)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(212, 175, 55, 0.12)",
              }
            : {},
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={4} alignItems="center">

            {/* Left: Info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  color: isEnded || !hasSlots ? "rgba(255,255,255,0.4)" : "#d4af37",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  fontSize: { xs: "1rem", md: "1.15rem" },
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                Kelompok {cohort.nama_kelompok}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 500, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.2px", fontSize: "0.85rem" }}
                >
                  {cohort.title}
                </Typography>
                {isAdmin && (
                  <Chip
                    label="Admin"
                    size="small"
                    sx={{ height: 16, fontSize: "0.55rem", fontWeight: 800, bgcolor: "rgba(212, 175, 55, 0.1)", color: "#d4af37", border: "1px solid rgba(212, 175, 55, 0.2)" }}
                  />
                )}
              </Stack>

              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem", lineHeight: 1.5, mb: hasSlots ? 1.5 : 0 }}
              >
                {cohort.description}
              </Typography>

              {hasSlots && (
                <RegistrationStatus
                  startAt={cohort.start_at}
                  endAt={cohort.end_at}
                  isAdmin={isAdmin}
                  small
                  align={isMobile ? "center" : "flex-start"}
                  onStatusChange={onStatusChange}
                />
              )}
            </Grid>

            {/* Middle: Dynamic Content (Slots or Countdown) */}
            <Grid size={{ xs: 12, md: 5.5 }}>
              {hasSlots && !isEnded ? (
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, mb: -0.5 }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Tanggal
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Ketersediaan
                    </Typography>
                  </Box>
                  {cohort.slots.map((slot) => {
                    const remaining = slot.quota - slot.count;
                    const isFull = remaining <= 0;
                    return (
                      <Box
                        key={slot.id}
                        sx={{
                          px: 2, py: 1, borderRadius: 1,
                          bgcolor: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: "0.75rem", fontFamily: "monospace" }}>
                          {format(parseISO(slot.date.replace(/^0006-/, "2026-")), "EEEE, d MMMM yyyy", { locale: id })}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: isFull ? "#e74c3c" : "#2ecc71", fontSize: "0.75rem", fontFamily: "monospace" }}>
                          {isFull ? "Full" : `${remaining} Slot`}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  {!isEnded && (
                    <RegistrationStatus
                      startAt={cohort.start_at}
                      endAt={cohort.end_at}
                      isAdmin={isAdmin}
                      small
                      align="center"
                      onStatusChange={onStatusChange}
                    />
                  )}
                </Box>
              )}
            </Grid>

            {/* Right: Action */}
            <Grid size={{ xs: 12, md: 2.5 }} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}>
              {hasSlots ? (
                <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ width: "100%" }}>
                  <Button
                    variant="contained"
                    disabled={!canAccess}
                    sx={{
                      height: 48,
                      width: { xs: "100%", md: "auto" },
                      minWidth: 100,
                      borderRadius: 1,
                      fontSize: "1rem",
                      fontWeight: 700,
                      lineHeight: 1.25,
                      textTransform: "none",
                      position: "relative",
                      overflow: "hidden",
                      background: canAccess ? "rgba(20, 80, 45, 0.25)" : "rgba(255,255,255,0.05)",
                      backdropFilter: canAccess ? "blur(12px)" : "none",
                      border: canAccess ? "1px solid rgba(46, 204, 113, 0.3)" : "1px solid rgba(255,255,255,0.05)",
                      color: canAccess ? "#2ecc71" : "rgba(255,255,255,0.15)",
                      transition: "all 0.4s ease",
                      animation: canAccess ? "glow-alternate 4s ease-in-out infinite" : "none",
                      "@keyframes glow-alternate": {
                        "0%": { boxShadow: "0 0 8px rgba(123, 239, 178, 0.3)", borderColor: "rgba(46, 204, 113, 0.4)" },
                        "50%": { boxShadow: "0 0 8px rgba(212, 175, 55, 0.3)", borderColor: "rgba(212, 175, 55, 0.4)" },
                        "100%": { boxShadow: "0 0 8px rgba(123, 239, 178, 0.3)", borderColor: "rgba(46, 204, 113, 0.4)" },
                      },
                      "&:hover": {
                        background: "rgba(46, 204, 113, 0.2)",
                        borderColor: "rgba(46, 204, 113, 0.6)",
                        transform: "translateY(-2px)",
                      },
                      "&.Mui-disabled": { color: "rgba(255,255,255,0.15)" },
                    }}
                  >
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {isAdmin && !isStarted ? "Daftar (Admin)" : isEnded ? "Selesai" : "Daftar"}
                      {canAccess && (
                        <motion.span
                          variants={{
                            initial: { x: 0, opacity: 1 },
                            hover: {
                              x: [0, 4, 4, 40],
                              opacity: [1, 1, 1, 0],
                              transition: { repeat: Infinity, duration: 1.2, times: [0, 0.2, 0.5, 1], ease: "easeIn" },
                            },
                          }}
                          initial="initial"
                          whileHover="hover"
                          style={{ display: "inline-flex" }}
                        >
                          <CircleChevronRight size={21} />
                        </motion.span>
                      )}
                    </Box>
                  </Button>
                </Stack>
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.25)",
                    fontWeight: 600,
                    fontStyle: "italic",
                    border: "1px solid rgba(255,255,255,0.05)",
                    px: 2, py: 1, borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.02)",
                  }}
                >
                  Jadwal belum tersedia
                </Typography>
              )}
            </Grid>

          </Grid>
        </CardContent>
      </Paper>
    </motion.div>
  );
}
