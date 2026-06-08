import { useState } from "react";
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
import { ChevronDown, Copy, Edit2, UserPlus, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { Cohort } from "../../../types";
import { formatDateForInput, generateSlug } from "../../../lib/utils";
import TableSkeleton from "../components/TableSkeleton";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  cohorts: Cohort[];
  loading: boolean;
  showErrors: boolean;
  setShowErrors: (v: boolean) => void;
  showToast: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  fetchAll: () => Promise<void>;
  /** Called when the "Atur Peserta" icon is clicked; opens paste dialog in parent */
  onOpenParticipantDialog: (cohortId: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_COHORT = {
  title: "",
  description: "",
  slug: "",
  nama_kelompok: "",
  start_at: "",
  end_at: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CohortTab({
  cohorts,
  loading,
  showErrors,
  setShowErrors,
  showToast,
  fetchAll,
  onOpenParticipantDialog,
}: Props) {
  const [newCohort, setNewCohort] = useState(EMPTY_COHORT);
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCohortFieldChange = (
    field: keyof typeof newCohort,
    value: string,
  ) => {
    setNewCohort((prev) => {
      const updated = { ...prev, [field]: value };
      if (
        !editingCohortId &&
        (field === "nama_kelompok" || field === "title")
      ) {
        updated.slug = generateSlug(updated.nama_kelompok, updated.title);
      }
      return updated;
    });
  };

  const resetForm = () => {
    setNewCohort(EMPTY_COHORT);
    setShowErrors(false);
  };

  const cancelEdit = () => {
    setEditingCohortId(null);
    resetForm();
  };

  const handleCreateCohort = async () => {
    if (!newCohort.title || !newCohort.slug || !newCohort.nama_kelompok) {
      setShowErrors(true);
      showToast("Mohon lengkapi semua field wajib", "error");
      return;
    }
    const { error } = await supabase.from("cohorts").insert([
      {
        title: newCohort.title,
        description: newCohort.description,
        unique_slug: newCohort.slug,
        nama_kelompok: newCohort.nama_kelompok,
        start_at: newCohort.start_at
          ? new Date(newCohort.start_at).toISOString()
          : null,
        end_at: newCohort.end_at
          ? new Date(newCohort.end_at).toISOString()
          : null,
      },
    ]);
    if (error) {
      showToast(error.message, "error");
    } else {
      resetForm();
      showToast("Event berhasil dibuat");
      fetchAll();
    }
  };

  const handleUpdateCohort = async () => {
    if (
      !editingCohortId ||
      !newCohort.title ||
      !newCohort.slug ||
      !newCohort.nama_kelompok
    ) {
      setShowErrors(true);
      showToast("Mohon lengkapi semua field wajib", "error");
      return;
    }
    const { error } = await supabase
      .from("cohorts")
      .update({
        title: newCohort.title,
        description: newCohort.description,
        unique_slug: newCohort.slug,
        nama_kelompok: newCohort.nama_kelompok,
        start_at: newCohort.start_at
          ? new Date(newCohort.start_at).toISOString()
          : null,
        end_at: newCohort.end_at
          ? new Date(newCohort.end_at).toISOString()
          : null,
      })
      .eq("id", editingCohortId);
    if (error) {
      showToast(error.message, "error");
    } else {
      setEditingCohortId(null);
      resetForm();
      showToast("Perubahan event berhasil disimpan");
      fetchAll();
    }
  };

  const handleEditCohortClick = (cohort: Cohort) => {
    setEditingCohortId(cohort.id);
    setNewCohort({
      title: cohort.title,
      description: cohort.description || "",
      slug: cohort.unique_slug,
      nama_kelompok: cohort.nama_kelompok,
      start_at: formatDateForInput(cohort.start_at),
      end_at: formatDateForInput(cohort.end_at),
    });
    showToast("Mode ubah aktif", "info");
  };

  const handleDeleteCohort = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus event ini? Semua jadwal, reservasi, dan daftar nama terkait akan ikut terhapus.",
      )
    )
      return;
    const { error } = await supabase.from("cohorts").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Event berhasil dihapus");
      fetchAll();
    }
  };

  const copyInviteLink = (slug: string) => {
    const url = `${window.location.origin}/cohort/${slug}`;
    navigator.clipboard.writeText(url);
    showToast("Tautan berhasil disalin ke clipboard");
  };

  // -------------------------------------------------------------------------
  // Shared form fields (rendered in both mobile accordion and desktop paper)
  // -------------------------------------------------------------------------

  const formFields = (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <TextField
        fullWidth
        label="Nama Kelompok"
        margin="normal"
        placeholder="misal: Kelompok A"
        value={newCohort.nama_kelompok}
        error={showErrors && !newCohort.nama_kelompok}
        helperText={
          showErrors && !newCohort.nama_kelompok
            ? "Nama kelompok wajib diisi"
            : ""
        }
        onChange={(e) =>
          handleCohortFieldChange("nama_kelompok", e.target.value)
        }
      />
      <TextField
        fullWidth
        label="Judul Event/Wawancara"
        margin="normal"
        value={newCohort.title}
        error={showErrors && !newCohort.title}
        helperText={
          showErrors && !newCohort.title ? "Judul event wajib diisi" : ""
        }
        onChange={(e) => handleCohortFieldChange("title", e.target.value)}
      />
      <TextField
        fullWidth
        label="Deskripsi (Opsional)"
        margin="normal"
        multiline
        rows={2}
        value={newCohort.description}
        onChange={(e) =>
          handleCohortFieldChange("description", e.target.value)
        }
      />
      <TextField
        fullWidth
        label="Tautan Formulir"
        margin="normal"
        value={newCohort.slug}
        disabled={!!editingCohortId}
        slotProps={{
          input: {
            readOnly: !!editingCohortId,
            sx: { cursor: editingCohortId ? "not-allowed" : "text" },
          },
        }}
        onChange={(e) => handleCohortFieldChange("slug", e.target.value)}
        helperText={
          editingCohortId
            ? "Hati-hati mengubah tautan yang sudah disebar"
            : "Dibuat otomatis oleh sistem"
        }
      />
      <TextField
        fullWidth
        type="datetime-local"
        label="Waktu Mulai Pendaftaran"
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
        value={newCohort.start_at}
        onChange={(e) => handleCohortFieldChange("start_at", e.target.value)}
        helperText="Opsional: Kosongkan jika ingin langsung dibuka"
      />
      <TextField
        fullWidth
        type="datetime-local"
        label="Waktu Tutup Pendaftaran"
        margin="normal"
        slotProps={{ inputLabel: { shrink: true } }}
        value={newCohort.end_at}
        onChange={(e) => handleCohortFieldChange("end_at", e.target.value)}
        helperText="Opsional: Kosongkan jika tidak ada batas waktu"
      />
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        {editingCohortId && (
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
          onClick={editingCohortId ? handleUpdateCohort : handleCreateCohort}
          fullWidth
        >
          {editingCohortId ? "Simpan Perubahan" : "Simpan"}
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
            {editingCohortId ? "Ubah Event" : "Tambah Event/Wawancara"}
          </Typography>
        </Box>

        {/* Mobile: collapsible accordion */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          <Accordion
            className="refined-card"
            defaultExpanded={!!editingCohortId}
          >
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Typography sx={{ fontWeight: 700 }}>
                {editingCohortId ? "Form Perubahan" : "Form Tambah Event"}
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
            Daftar Event
          </Typography>
        </Box>
        <TableContainer
          component={Paper}
          className="refined-card"
          sx={{ overflowX: "auto", maxWidth: "100%", display: "block" }}
        >
          <Table
            aria-label="Daftar Event"
            sx={{ minWidth: { xs: 600, md: "100%" } }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Nama Kelompok</TableCell>
                <TableCell>Event/Wawancara</TableCell>
                <TableCell>Mulai</TableCell>
                <TableCell>Akhir</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <TableBody>
                {cohorts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {c.nama_kelompok}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {c.title}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {c.start_at
                        ? new Date(c.start_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Langsung"}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {c.end_at
                        ? new Date(c.end_at).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Tidak Ada"}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        display="flex"
                        gap={0.5}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Tooltip title="Salin Link Daftar">
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => copyInviteLink(c.unique_slug)}
                            sx={{
                              bgcolor: "rgba(255,255,255,0.05)",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                            }}
                          >
                            <Copy size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ubah Event">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditCohortClick(c)}
                            sx={{
                              bgcolor: "rgba(212,175,55,0.15)",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              "&:hover": { bgcolor: "rgba(212,175,55,0.25)" },
                            }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Atur Peserta">
                          <IconButton
                            size="small"
                            onClick={() => onOpenParticipantDialog(c.id)}
                            sx={{
                              bgcolor: "rgba(46,204,113,0.15)",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              color: "#2ecc71",
                              "&:hover": { bgcolor: "rgba(46,204,113,0.25)" },
                            }}
                          >
                            <UserPlus size={14} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Event">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteCohort(c.id)}
                            sx={{
                              bgcolor: "rgba(231,76,60,0.15)",
                              borderRadius: "50%",
                              width: 28,
                              height: 28,
                              "&:hover": { bgcolor: "rgba(231,76,60,0.25)" },
                            }}
                          >
                            <Trash2 size={14} />
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
