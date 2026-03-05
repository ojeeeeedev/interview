import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon } from 'lucide-react';

const motionContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const motionItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface CohortWithSlots extends Cohort {
  slots: Slot[];
}

export default function Home() {
  const [cohorts, setCohorts] = useState<CohortWithSlots[]>([]);

  useEffect(() => {
    const fetchCohorts = async () => {
      const { data: cohortsData } = await supabase.from("cohorts").select("*");
      const { data: slotsData } = await supabase
        .from("slots")
        .select("*")
        .order("date", { ascending: true });

      if (cohortsData) {
        const combined = cohortsData.map((c: Cohort) => ({
          ...c,
          slots: slotsData?.filter((s: Slot) => s.cohort_id === c.id) || [],
        }));
        setCohorts(combined);
      }
    };
    fetchCohorts();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 12 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Box textAlign="center" mb={10}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{ color: "#ffffff", fontWeight: 800 }}
          >
            Sistem Reservasi Wawancara
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "#ecf0f1",
              opacity: 0.8,
              maxWidth: 600,
              mx: "auto",
              fontWeight: 500,
            }}
          >
            Silakan mendaftarkan jadwal wawancara dengan memilih kelompok Anda.
          </Typography>
        </Box>
      </motion.div>

      <motion.div variants={motionContainer} initial="hidden" animate="show">
        <Grid container spacing={4} justifyContent="center">
          {cohorts.map((cohort) => (
            <Grid size={{ xs: 12, sm: 6 }} key={cohort.id}>
              <motion.div
                variants={motionItem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="refined-card"
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ p: 4, flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 900,
                          color: "#3498db",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                        }}
                      >
                        Kelompok {cohort.nama_kelompok}
                      </Typography>
                    </Box>

                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ color: "#ffffff", fontWeight: 700 }}
                    >
                      {cohort.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#ecf0f1", mb: 3, opacity: 0.7 }}
                    >
                      {cohort.description}
                    </Typography>

                    <Divider
                      sx={{ my: 2, borderColor: "rgba(255,255,255,0.1)" }}
                    />

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="overline"
                        sx={{
                          color: "#ecf0f1",
                          opacity: 0.6,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <CalendarIcon size={14} /> JADWAL TERSEDIA
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {cohort.slots.length > 0 ? (
                          cohort.slots.slice(0, 3).map((slot) => {
                            const remaining = slot.quota - slot.count;
                            const isFull = remaining <= 0;

                            return (
                              <Box
                                key={slot.id}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  bgcolor: "rgba(0,0,0,0.15)",
                                  px: 1.5,
                                  py: 0.8,
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, color: "#ecf0f1" }}
                                >
                                  {format(parseISO(slot.date), "d MMM yyyy", {
                                    locale: id,
                                  })}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={isFull ? "Penuh" : `${remaining} Slot`}
                                  color={
                                    isFull
                                      ? "error"
                                      : remaining < 3
                                        ? "warning"
                                        : "success"
                                  }
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    height: 20,
                                  }}
                                />
                              </Box>
                            );
                          })
                        ) : (
                          <Typography variant="caption" sx={{ opacity: 0.5 }}>
                            Belum ada jadwal diatur.
                          </Typography>
                        )}
                        {cohort.slots.length > 3 && (
                          <Typography
                            variant="caption"
                            sx={{ textAlign: "center", mt: 0.5, opacity: 0.6 }}
                          >
                            + {cohort.slots.length - 3} tanggal lainnya
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Button
                      component={Link}
                      to={`/cohort/${cohort.unique_slug}`}
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{ py: 1.5, mt: "auto", bgcolor: "#2980b9" }}
                    >
                      Akses Portal
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Container>
  );
}
