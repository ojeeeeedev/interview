import { useState, useMemo } from "react";
import {
  Grid,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { Cohort, SlotWithCohorts } from "../../../types";
import TableSkeleton from "../components/TableSkeleton";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  cohorts: Cohort[];
  slots: SlotWithCohorts[];
  loading: boolean;
  showErrors: boolean;
  setShowErrors: (v: boolean) => void;
  showToast: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  fetchAll: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_SLOT = { cohort_id: "", date: "", quota: 10 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SlotTab({
  cohorts,
  slots,
  loading,
  showErrors,
  setShowErrors,
  showToast,
  fetchAll,
}: Props) {
  const [newSlot, setNewSlot] = useState(EMPTY_SLOT);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [selectedKelompok, setSelectedKelompok] = useState("");

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const uniqueKelompok = useMemo(() => {
    return Array.from(new Set(cohorts.map((c) => c.nama_kelompok))).sort();
  }, [cohorts]);

  const filteredCohortsForSlot = useMemo(() => {
    return cohorts.filter((c) => c.nama_kelompok === selectedKelompok);
  }, [cohorts, selectedKelompok]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const cancelEdit = () => {
    setEditingSlotId(null);
    setNewSlot({ ...EMPTY_SLOT });
  };

  const handleCreateSlot = async () => {
    if (!newSlot.cohort_id || !newSlot.date || !selectedKelompok) {
      setShowErrors(true);
      showToast("Mohon lengkapi semua field wajib", "error");
      return;
    }
    const { error } = await supabase.from("slots").insert([
      {
        cohort_id: newSlot.cohort_id,
        date: newSlot.date,
        quota: newSlot.quota,
      },
    ]);
    if (error) {
      showToast(error.message, "error");
    } else {
      setNewSlot({ ...EMPTY_SLOT });
      setShowErrors(false);
      showToast("Jadwal berhasil ditambahkan");
      fetchAll();
    }
  };

  const handleEditSlotClick = (slot: SlotWithCohorts) => {
    setEditingSlotId(slot.id);
    setSelectedKelompok(slot.cohorts?.nama_kelompok || "");
    setNewSlot({
      cohort_id: slot.cohort_id,
      date: slot.date,
      quota: slot.quota,
    });
    showToast("Mode ubah jadwal aktif", "info");
  };

  const handleUpdateSlot = async () => {
    if (
      !editingSlotId ||
      !newSlot.cohort_id ||
      !newSlot.date ||
      !selectedKelompok
    ) {
      setShowErrors(true);
      showToast("Mohon lengkapi semua field wajib", "error");
      return;
    }
    const { error } = await supabase
      .from("slots")
      .update({
        cohort_id: newSlot.cohort_id,
        date: newSlot.date,
        quota: newSlot.quota,
      })
      .eq("id", editingSlotId);
    if (error) {
      showToast(error.message, "error");
    } else {
      setEditingSlotId(null);
      setNewSlot({ ...EMPTY_SLOT });
      setShowErrors(false);
      showToast("Jadwal berhasil diubah");
      fetchAll();
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus jadwal ini? Semua reservasi terkait akan ikut terhapus.",
      )
    )
      return;
    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Jadwal berhasil dihapus");
      fetchAll();
    }
  };

  // -------------------------------------------------------------------------
  // Shared form fields
  // -------------------------------------------------------------------------

  const formFields = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <TextField
        select
        fullWidth
        label="Pilih Kelompok"
        margin="normal"
        slotProps={{ select: { native: true } }}
        value={selectedKelompok}
        error={showErrors && !selectedKelompok}
        helperText={
          showErrors && !selectedKelompok ? "Wajib pilih kelompok" : ""
        }
        onChange={(e) => {
          setSelectedKelompok(e.target.value);
          setNewSlot({ ...newSlot, cohort_id: "" });
        }}
      >
        <option value="" />
        {uniqueKelompok.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Pilih Event"
        margin="normal"
        disabled={!selectedKelompok}
        slotProps={{ select: { native: true } }}
        value={newSlot.cohort_id}
        error={showErrors && !newSlot.cohort_id}
        helperText={
          showErrors && !newSlot.cohort_id ? "Wajib pilih event" : ""
        }
        onChange={(e) => setNewSlot({ ...newSlot, cohort_id: e.target.value })}
      >
        <option value="" />
        {filteredCohortsForSlot.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </TextField>

      <TextField
        fullWidth
        type="date"
        label="Tanggal"
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
        value={newSlot.date}
        error={showErrors && !newSlot.date}
        helperText={showErrors && !newSlot.date ? "Wajib pilih tanggal" : ""}
        onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
      />

      <TextField
        fullWidth
        type="number"
        label="Kuota"
        margin="normal"
        value={newSlot.quota}
        error={showErrors && (isNaN(newSlot.quota) || newSlot.quota <= 0)}
        helperText={
          showErrors && (isNaN(newSlot.quota) || newSlot.quota <= 0)
            ? "Kuota minimal 1"
            : ""
        }
        onChange={(e) =>
          setNewSlot({ ...newSlot, quota: parseInt(e.target.value) })
        }
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {editingSlotId && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={cancelEdit}
            fullWidth
          >
            Batal
          </Button>
        )}
        <Button
          variant="contained"
          onClick={editingSlotId ? handleUpdateSlot : handleCreateSlot}
          fullWidth
        >
          {editingSlotId ? "Simpan Perubahan" : "Tambah"}
        </Button>
      </Stack>
    </Box>
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Grid container spacing={3}>
      {/* ----------------------------------------------------------------- */}
      {/* Left column — form                                                  */}
      {/* ----------------------------------------------------------------- */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editingSlotId
              ? "Ubah Jadwal Event/Wawancara"
              : "Tambah Jadwal Event/Wawancara"}
          </Typography>
        </Box>

        {/* Mobile: collapsible accordion */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Accordion className="refined-card">
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Typography sx={{ fontWeight: 700 }}>
                Form Input Jadwal
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>{formFields}</AccordionDetails>
          </Accordion>
        </Box>

        {/* Desktop: static paper */}
        <Paper
          className="refined-card"
          sx={{ p: 3, display: { xs: "none", md: "block" } }}
        >
          {formFields}
        </Paper>
      </Grid>

      {/* ----------------------------------------------------------------- */}
      {/* Right column — table                                                */}
      {/* ----------------------------------------------------------------- */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Box sx={{ mb: 2, px: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Jadwal Event/Wawancara
          </Typography>
        </Box>
        <TableContainer
          component={Paper}
          className="refined-card"
          sx={{ overflowX: "auto", maxWidth: "100%", display: "block" }}
        >
          <Table
            aria-label="Daftar Jadwal"
            sx={{ minWidth: { xs: 600, md: "100%" } }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Kelompok</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>Tanggal</TableCell>
                <TableCell>Kapasitas</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <TableBody>
                {slots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#d4af37", fontWeight: 600 }}
                      >
                        {s.cohorts?.nama_kelompok}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.cohorts?.title}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.date}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {s.count} / {s.quota}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        display="flex"
                        gap={0.5}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Tooltip title="Ubah Jadwal">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditSlotClick(s)}
                            sx={{
                              bgcolor: "rgba(212,175,55,0.15)",
                              borderRadius: "50%",
                              width: 32,
                              height: 32,
                              "&:hover": { bgcolor: "rgba(212,175,55,0.25)" },
                            }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Jadwal">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSlot(s.id)}
                            sx={{
                              bgcolor: "rgba(231,76,60,0.15)",
                              borderRadius: "50%",
                              width: 32,
                              height: 32,
                              "&:hover": { bgcolor: "rgba(231,76,60,0.25)" },
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
