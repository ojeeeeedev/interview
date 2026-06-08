import {
  Box,
  Typography,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { ChevronDown, FileDown, FileText, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../../../lib/supabase";
import type { Cohort, Slot } from "../../../types";
import type { ReservationExtended } from "../hooks/useAdminData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

type ReportData = Record<
  string,
  {
    cohort: Cohort;
    slots: Record<
      string,
      { slot: Slot; reservations: ReservationExtended[] }
    >;
  }
>;

interface Props {
  reportData: ReportData;
  loading: boolean;
  showToast: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  fetchAll: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecapTab({
  reportData,
  loading,
  showToast,
  fetchAll,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // -------------------------------------------------------------------------
  // PDF Generation
  // -------------------------------------------------------------------------

  const downloadCohortPDF = (cohortId: string) => {
    const data = reportData[cohortId];
    if (!data) return;

    const { cohort, slots: cohortSlots } = data;
    const doc = new jsPDF();
    let currentY = 15;

    doc.setFontSize(20);
    doc.text("Rekapitulasi Reservasi Wawancara", 105, currentY, {
      align: "center",
    });
    currentY += 15;

    doc.setFontSize(16);
    doc.setTextColor(212, 175, 55);
    doc.text(`${cohort.nama_kelompok} - ${cohort.title}`, 14, currentY);
    currentY += 10;

    const sortedSlots = Object.values(cohortSlots).sort((a, b) =>
      a.slot.date.localeCompare(b.slot.date),
    );
    let hasAnyData = false;

    sortedSlots.forEach(({ slot, reservations: slotReservations }) => {
      if (slotReservations.length === 0) return;
      hasAnyData = true;

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Tanggal: ${slot.date}`, 14, currentY);
      currentY += 5;

      const tableRows = slotReservations
        .sort((a, b) => a.user_name.localeCompare(b.user_name))
        .map((r) => [
          r.user_name,
          r.access_code,
          new Date(r.created_at).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          "", // Empty cell for "Kehadiran"
        ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Nama Peserta", "Kode Akses", "Waktu Daftar", "Kehadiran"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [212, 175, 55] },
        columnStyles: {
          0: { cellWidth: 72 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 40 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
    });

    if (!hasAnyData) {
      showToast("Tidak ada reservasi untuk cohort ini", "info");
      return;
    }

    doc.save(
      `rekap-${cohort.nama_kelompok}-${cohort.title}-${new Date().toISOString().split("T")[0]}.pdf`,
    );
    showToast(`Laporan ${cohort.nama_kelompok} berhasil diunduh`);
  };

  // -------------------------------------------------------------------------
  // Reservation deletion
  // -------------------------------------------------------------------------

  const handleDeleteReservation = async (id: string, slotId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus reservasi ini?")) return;
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      await supabase.rpc("decrement_slot_count", { p_slot_id: slotId });
      showToast("Reservasi berhasil dihapus");
      fetchAll();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Box>
      <Box mb={3} px={1}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Rekapitulasi Reservasi
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Rekap daftar reservasi event/wawancara
        </Typography>
      </Box>

      <Stack spacing={2}>
        {loading ? (
          [1, 2, 3].map((n) => (
            <Skeleton
              key={n}
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)" }}
            />
          ))
        ) : (
          Object.values(reportData)
            .sort((a, b) =>
              a.cohort.nama_kelompok.localeCompare(b.cohort.nama_kelompok),
            )
            .map(({ cohort, slots: cohortSlots }) => {
              const totalReservations = Object.values(cohortSlots).reduce(
                (sum, s) => sum + s.reservations.length,
                0,
              );
              if (totalReservations === 0) return null;

              return (
                <Accordion key={cohort.id} className="refined-card">
                  <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={2}
                      width="100%"
                      pr={2}
                    >
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: "rgba(212,175,55,0.1)",
                          borderRadius: 2,
                          color: "#d4af37",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        <FileText size={20} />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 900,
                            color: "#d4af37",
                            letterSpacing: 1,
                            display: "block",
                          }}
                        >
                          {cohort.nama_kelompok.toUpperCase()}
                        </Typography>
                        <Typography sx={{ fontWeight: 800 }}>
                          {cohort.title}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<FileDown size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadCohortPDF(cohort.id);
                          }}
                          sx={{
                            borderRadius: 1,
                            fontWeight: 700,
                            py: 0.5,
                            px: 1.5,
                            maxHeight: "32px",
                            borderColor: "rgba(212,175,55,0.4)",
                            color: "#d4af37",
                            "&:hover": {
                              borderColor: "#d4af37",
                              bgcolor: "rgba(212,175,55,0.1)",
                            },
                          }}
                        >
                          PDF
                        </Button>
                        <Box sx={{ textAlign: "right", minWidth: 80 }}>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              fontWeight: 700,
                              display: "block",
                              fontSize: "0.65rem",
                            }}
                          >
                            TOTAL RESERVASI
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 900,
                              color: "#2ecc71",
                              lineHeight: 1,
                            }}
                          >
                            {totalReservations}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: 3 }}
                  >
                    <Divider sx={{ mb: 2, opacity: 0.1 }} />
                    <Stack spacing={3}>
                      {Object.values(cohortSlots)
                        .sort((a, b) =>
                          a.slot.date.localeCompare(b.slot.date),
                        )
                        .map(({ slot, reservations: slotReservations }) => (
                          <Box
                            key={slot.id}
                            sx={{
                              pl: { xs: 1, md: 2 },
                              borderLeft:
                                "2px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              mb={1.5}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  color: "rgba(255,255,255,0.7)",
                                  fontSize: "0.9rem",
                                }}
                              >
                                {new Date(slot.date).toLocaleDateString(
                                  "id-ID",
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  px: 1.2,
                                  py: 0.3,
                                  bgcolor: "rgba(255,255,255,0.05)",
                                  borderRadius: 1,
                                }}
                              >
                                {slotReservations.length} Orang
                              </Typography>
                            </Box>

                            {slotReservations.length > 0 ? (
                              <TableContainer>
                                <Table
                                  aria-label="Daftar Reservasi Peserta"
                                  size="small"
                                  sx={{
                                    tableLayout: isMobile ? "auto" : "fixed",
                                  }}
                                >
                                  <TableHead>
                                    <TableRow>
                                      <TableCell
                                        sx={{
                                          color: "rgba(255,255,255,0.4)",
                                          fontWeight: 700,
                                          width: "40px",
                                        }}
                                      >
                                        No
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: "rgba(255,255,255,0.4)",
                                          fontWeight: 700,
                                          width: isMobile ? "auto" : "40%",
                                        }}
                                      >
                                        Nama
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: "rgba(255,255,255,0.4)",
                                          fontWeight: 700,
                                          width: isMobile ? "auto" : "120px",
                                        }}
                                      >
                                        Waktu Daftar
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          color: "rgba(255,255,255,0.4)",
                                          fontWeight: 700,
                                          width: isMobile ? "auto" : "80px",
                                        }}
                                      >
                                        Kode
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{ width: "50px" }}
                                      />
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {slotReservations
                                      .sort((a, b) =>
                                        a.user_name.localeCompare(b.user_name),
                                      )
                                      .map((r, idx) => (
                                        <TableRow
                                          key={r.id}
                                          sx={{ "& td": { py: 1 } }}
                                        >
                                          <TableCell
                                            sx={{
                                              color:
                                                "rgba(255,255,255,0.3)",
                                              fontWeight: 700,
                                            }}
                                          >
                                            {idx + 1}
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              fontWeight: 600,
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              maxWidth: isMobile
                                                ? "140px"
                                                : "none",
                                            }}
                                          >
                                            {isMobile
                                              ? r.user_name.split(" ").length >
                                                2
                                                ? r.user_name
                                                    .split(" ")
                                                    .slice(0, 2)
                                                    .join(" ") + "..."
                                                : r.user_name
                                              : r.user_name}
                                          </TableCell>
                                          <TableCell
                                            sx={{
                                              color:
                                                "rgba(255,255,255,0.5)",
                                              fontSize: "0.75rem",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {new Date(
                                              r.created_at,
                                            ).toLocaleString("id-ID", {
                                              day: "2-digit",
                                              month: "short",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </TableCell>
                                          <TableCell>
                                            <code>{r.access_code}</code>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Tooltip title="Hapus Reservasi">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                  handleDeleteReservation(
                                                    r.id,
                                                    r.slot_id,
                                                  )
                                                }
                                                sx={{
                                                  bgcolor:
                                                    "rgba(231,76,60,0.1)",
                                                  "&:hover": {
                                                    bgcolor:
                                                      "rgba(231,76,60,0.2)",
                                                  },
                                                }}
                                              >
                                                <Trash2 size={14} />
                                              </IconButton>
                                            </Tooltip>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ fontStyle: "italic", pl: 1 }}
                              >
                                Belum ada pendaftar
                              </Typography>
                            )}
                          </Box>
                        ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })
        )}
      </Stack>
    </Box>
  );
}
