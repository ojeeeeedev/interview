import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { ChevronDown, UserMinus, Edit2, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import type { AllowedNameExtended } from "../hooks/useAdminData";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  groupedNames: Record<string, AllowedNameExtended[]>;
  loading: boolean;
  selectedNameIds: string[];
  setSelectedNameIds: React.Dispatch<React.SetStateAction<string[]>>;
  pasteDialogOpen: boolean;
  setPasteDialogOpen: (v: boolean) => void;
  pasteTargetCohort: string;
  showToast: (
    message: string,
    severity?: "success" | "error" | "info" | "warning",
  ) => void;
  fetchAll: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParticipantTab({
  groupedNames,
  loading,
  selectedNameIds,
  setSelectedNameIds,
  pasteDialogOpen,
  setPasteDialogOpen,
  pasteTargetCohort,
  showToast,
  fetchAll,
}: Props) {
  const [pasteData, setPasteData] = useState("");
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState<{
    id: string;
    full_name: string;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  const toggleNameSelection = (id: string) => {
    setSelectedNameIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleCohortSelection = (cohortId: string, checked: boolean) => {
    const idsInCohort = (groupedNames[cohortId] || []).map((an) => an.id);
    if (checked) {
      setSelectedNameIds((prev) => [...new Set([...prev, ...idsInCohort])]);
    } else {
      setSelectedNameIds((prev) =>
        prev.filter((id) => !idsInCohort.includes(id)),
      );
    }
  };

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleBulkDeleteNames = async () => {
    if (selectedNameIds.length === 0) return;
    if (!confirm(`Hapus ${selectedNameIds.length} nama terpilih?`)) return;
    const { error } = await supabase
      .from("allowed_names")
      .delete()
      .in("id", selectedNameIds);
    if (error) {
      showToast(error.message, "error");
    } else {
      setSelectedNameIds([]);
      showToast("Daftar nama berhasil dihapus");
      fetchAll();
    }
  };

  const handleDeleteAllowedName = async (id: string) => {
    if (!confirm("Hapus nama ini?")) return;
    const { error } = await supabase
      .from("allowed_names")
      .delete()
      .eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Nama berhasil dihapus");
      fetchAll();
    }
  };

  const handleUpdateName = async () => {
    if (!editingName || !editingName.full_name.trim()) return;
    const { error } = await supabase
      .from("allowed_names")
      .update({ full_name: editingName.full_name.trim() })
      .eq("id", editingName.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      setEditNameDialogOpen(false);
      setEditingName(null);
      showToast("Nama berhasil diubah");
      fetchAll();
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.split(/\r?\n/).filter((row) => !!row.trim());
    const names = rows
      .map((row) => ({
        cohort_id: pasteTargetCohort,
        full_name: row.split("\t")[0].trim(),
      }))
      .filter((n) => !!n.full_name);
    const { error } = await supabase.from("allowed_names").insert(names);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(`${names.length} nama berhasil ditambahkan`);
      setPasteDialogOpen(false);
      setPasteData("");
      fetchAll();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Header row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        px={1}
      >
        <Typography
          sx={{ fontWeight: 700, fontSize: { xs: "0.9rem", sm: "1.25rem" } }}
        >
          {selectedNameIds.length > 0
            ? `${selectedNameIds.length} Dipilih`
            : "Kelola Peserta"}
        </Typography>
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<UserMinus size={16} />}
          disabled={selectedNameIds.length === 0}
          onClick={handleBulkDeleteNames}
          sx={{
            py: { xs: 0.5, sm: 1 },
            px: { xs: 1.5, sm: 2 },
            fontSize: { xs: "0.7rem", sm: "0.875rem" },
          }}
        >
          Hapus Terpilih
        </Button>
      </Box>

      {/* Loading skeleton */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((n) => (
            <Skeleton
              key={n}
              variant="rectangular"
              height={64}
              sx={{ borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)" }}
            />
          ))}
        </Stack>
      ) : (
        <>
          {Object.keys(groupedNames).length === 0 && (
            <Typography
              textAlign="center"
              color="textSecondary"
              py={4}
              sx={{ fontSize: "0.85rem" }}
            >
              Belum ada daftar nama.
            </Typography>
          )}

          {Object.entries(groupedNames).map(([cohortId, names]) => {
            const firstAllowedName = names[0];
            const cohortTitle =
              firstAllowedName?.cohorts?.title || "Tanpa Event";
            const namaKelompok =
              firstAllowedName?.cohorts?.nama_kelompok || "";

            return (
              <Accordion
                key={cohortId}
                className="refined-card"
                sx={{ mb: 1.5 }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown size={18} />}
                  sx={{ minHeight: { xs: 48, sm: 64 } }}
                >
                  <Box display="flex" alignItems="center" width="100%">
                    <Checkbox
                      size="small"
                      checked={names.every((n) =>
                        selectedNameIds.includes(n.id),
                      )}
                      indeterminate={
                        names.some((n) => selectedNameIds.includes(n.id)) &&
                        !names.every((n) => selectedNameIds.includes(n.id))
                      }
                      onChange={(e) =>
                        toggleCohortSelection(cohortId, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0.5 }}
                    />
                    <Box
                      sx={{
                        ml: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: { xs: 1, sm: 1.5 },
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 900,
                          color: "#d4af37",
                          fontSize: { xs: "0.7rem", sm: "0.85rem" },
                          letterSpacing: "1px",
                        }}
                      >
                        {namaKelompok.toUpperCase()}
                      </Typography>
                      <Typography
                        sx={{ opacity: 0.3, fontWeight: 300, fontSize: "0.8rem" }}
                      >
                        |
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "1rem" },
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {cohortTitle}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          opacity: 0.7,
                          fontSize: { xs: "0.65rem", sm: "0.8rem" },
                        }}
                      >
                        ({names.length})
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <Divider sx={{ mb: 1 }} />
                  <TableContainer
                    sx={{
                      overflowX: "auto",
                      maxWidth: "100%",
                      display: "block",
                    }}
                  >
                    <Table
                      aria-label="Daftar Nama Peserta Whitelist"
                      size="small"
                      sx={{ minWidth: 400 }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" sx={{ width: 40 }} />
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.75rem", sm: "0.85rem" },
                              width: "100%",
                            }}
                          >
                            Nama Lengkap
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.75rem", sm: "0.85rem" },
                              width: 100,
                            }}
                          />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {names.map((an) => (
                          <TableRow
                            key={an.id}
                            sx={{
                              "&:hover": {
                                bgcolor: "rgba(255,255,255,0.02)",
                              },
                            }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                size="small"
                                checked={selectedNameIds.includes(an.id)}
                                onChange={() => toggleNameSelection(an.id)}
                                sx={{ p: 0.5 }}
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.85rem" },
                                py: 0.5,
                                maxWidth: { xs: "130px", sm: "180px" },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                width: "100%",
                              }}
                            >
                              {an.full_name}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ py: 0.5, width: 100 }}
                            >
                              <Box
                                display="flex"
                                gap={0.5}
                                justifyContent="flex-end"
                                alignItems="center"
                              >
                                <Tooltip title="Ubah Nama">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setEditingName({
                                        id: an.id,
                                        full_name: an.full_name,
                                      });
                                      setEditNameDialogOpen(true);
                                    }}
                                    sx={{
                                      bgcolor: "rgba(212,175,55,0.15)",
                                      borderRadius: "50%",
                                      width: 28,
                                      height: 28,
                                      "&:hover": {
                                        bgcolor: "rgba(212,175,55,0.25)",
                                      },
                                    }}
                                  >
                                    <Edit2 size={12} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Hapus Nama">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDeleteAllowedName(an.id)
                                    }
                                    sx={{
                                      bgcolor: "rgba(231,76,60,0.1)",
                                      borderRadius: "50%",
                                      width: 24,
                                      height: 24,
                                      "&:hover": {
                                        bgcolor: "rgba(231,76,60,0.2)",
                                      },
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* Paste from Excel Dialog                                             */}
      {/* ----------------------------------------------------------------- */}
      <Dialog
        open={pasteDialogOpen}
        onClose={() => {
          setPasteDialogOpen(false);
          setPasteData("");
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "refined-card" }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Tambah Peserta</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Masukkan satu nama atau tempel daftar nama dari Excel. Pemisah antar
            nama adalah <strong>baris baru (Enter)</strong>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder={"Contoh:\nNama Lengkap 1\nNama Lengkap 2\nNama Lengkap 3"}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setPasteDialogOpen(false);
              setPasteData("");
            }}
            color="inherit"
          >
            Batal
          </Button>
          <Button
            onClick={handlePasteSubmit}
            variant="contained"
            disabled={!pasteData.trim()}
          >
            Simpan Daftar Nama
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Edit Name Dialog                                                    */}
      {/* ----------------------------------------------------------------- */}
      <Dialog
        open={editNameDialogOpen}
        onClose={() => setEditNameDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: "refined-card" }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Ubah Nama</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nama Lengkap"
            variant="outlined"
            margin="normal"
            value={editingName?.full_name || ""}
            onChange={(e) =>
              setEditingName((prev) =>
                prev ? { ...prev, full_name: e.target.value } : null,
              )
            }
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditNameDialogOpen(false)}
            color="inherit"
          >
            Batal
          </Button>
          <Button
            onClick={handleUpdateName}
            variant="contained"
            disabled={!editingName?.full_name.trim()}
          >
            Simpan Perubahan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
