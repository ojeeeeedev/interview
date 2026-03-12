import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Divider,
  TableContainer,
  Stack,
  Snackbar,
  Alert,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  Trash2,
  Copy,
  UserPlus,
  ChevronDown,
  UserMinus,
  Edit2,
  FileDown,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Cohort, Slot } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const TableSkeleton = ({ cols }: { cols: number }) => (
  <TableBody>
    {[1, 2, 3, 4, 5].map((row) => (
      <TableRow key={row}>
        {[...Array(cols)].map((_, col) => (
          <TableCell key={col}>
            <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
);

interface ReservationExtended {
  id: string;
  user_name: string;
  access_code: string;
  created_at: string;
  slot_id: string;
  slots: {
    date: string;
    cohort_id: string;
    cohorts: {
      title: string;
      nama_kelompok: string;
    };
  };
}

interface AllowedNameExtended {
  id: string;
  full_name: string;
  cohort_id: string;
  cohorts: {
    title: string;
    nama_kelompok: string;
  };
}

interface SlotWithCohorts extends Slot {
    cohorts: {
        title: string;
        nama_kelompok: string;
    }
}

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

/**
 * Admin Panel Component
 * 
 * Comprehensive management dashboard for administrators.
 * Functions include:
 * 1. Event (Cohort) Creation & Modification
 * 2. Slot (Schedule) Management & Quota Settings
 * 3. Participant Whitelist (Allowed Names) Management
 * 4. Booking Recap & PDF Report Generation
 */
export default function Admin() {
  const [tab, setTab] = useState(0);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [slots, setSlots] = useState<SlotWithCohorts[]>([]);
  const [reservations, setReservations] = useState<ReservationExtended[]>([]);
  const [allowedNames, setAllowedNames] = useState<AllowedNameExtended[]>([]);
  const [selectedNameIds, setSelectedNameIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const [showErrors, setShowErrors] = useState(false);

  const showToast = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Helper to format date for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Form states
  const [newCohort, setNewCohort] = useState({
    title: "",
    description: "",
    slug: "",
    nama_kelompok: "",
    start_at: "",
    end_at: "",
  });
  const [editingCohortId, setEditingCohortId] = useState<string | null>(null);

  const generateSlug = (namaKelompok: string, title: string) => {
    return `${namaKelompok} ${title}`
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleCohortFieldChange = (field: keyof typeof newCohort, value: string) => {
    setNewCohort((prev) => {
      const updated = { ...prev, [field]: value };
      if (!editingCohortId && (field === "nama_kelompok" || field === "title")) {
        updated.slug = generateSlug(updated.nama_kelompok, updated.title);
      }
      return updated;
    });
  };

  const [newSlot, setNewSlot] = useState({
    cohort_id: "",
    date: "",
    quota: 10,
  });
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [selectedKelompok, setSelectedKelompok] = useState("");

  const uniqueKelompok = useMemo(() => {
    return Array.from(new Set(cohorts.map((c) => c.nama_kelompok))).sort();
  }, [cohorts]);

  const filteredCohortsForSlot = useMemo(() => {
    return cohorts.filter((c) => c.nama_kelompok === selectedKelompok);
  }, [cohorts, selectedKelompok]);

  // Paste from Excel states
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteTargetCohort, setPasteTargetCohort] = useState<string>("");
  const [pasteData, setPasteData] = useState("");

  // Edit Name states
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState<{
    id: string;
    full_name: string;
  } | null>(null);

  /**
   * Data Fetching
   * Concurrent fetch of all administrative data points from Supabase.
   */
  const fetchAll = useCallback(async () => {
    const [
        { data: c },
        { data: s },
        { data: r },
        { data: an }
    ] = await Promise.all([
        supabase.from("cohorts").select("*").order("created_at", { ascending: false }),
        supabase.from("slots").select("*, cohorts(title, nama_kelompok)").order("date", { ascending: true }),
        supabase.from("reservations").select("*, slots(date, cohort_id, cohorts(title, nama_kelompok))"),
        supabase.from("allowed_names").select("*, cohorts(title, nama_kelompok)")
    ]);

    if (c) setCohorts(c);
    if (s) setSlots(s as unknown as SlotWithCohorts[]);
    if (r) setReservations(r as unknown as ReservationExtended[]);
    if (an) setAllowedNames(an as unknown as AllowedNameExtended[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const groupedNames = useMemo(() => {
    const groups: Record<string, AllowedNameExtended[]> = {};
    allowedNames.forEach((an) => {
      const cohortTitle = an.cohorts?.title || "Tanpa Event";
      if (!groups[cohortTitle]) groups[cohortTitle] = [];
      groups[cohortTitle].push(an);
    });
    return groups;
  }, [allowedNames]);

  const reportData = useMemo(() => {
    const cohortMap: Record<string, { cohort: Cohort; slots: Record<string, { slot: Slot; reservations: ReservationExtended[] }> }> = {};

    cohorts.forEach(c => {
      cohortMap[c.id] = { cohort: c, slots: {} };
    });

    const slotLookup = new Map<string, SlotWithCohorts>();

    slots.forEach(s => {
      slotLookup.set(s.id, s);
      if (cohortMap[s.cohort_id]) {
        cohortMap[s.cohort_id].slots[s.id] = { slot: s, reservations: [] };
      }
    });

    reservations.forEach(r => {
      const slotObj = slotLookup.get(r.slot_id);
      if (slotObj && cohortMap[slotObj.cohort_id] && cohortMap[slotObj.cohort_id].slots[r.slot_id]) {
        cohortMap[slotObj.cohort_id].slots[r.slot_id].reservations.push(r);
      }
    });

    return cohortMap;
  }, [cohorts, slots, reservations]);
  /**
   * PDF Generation Utility
   * Uses jsPDF and autoTable to generate formatted reports for each cohort.
   */
  const downloadCohortPDF = (cohortId: string) => {
    const data = reportData[cohortId];
    if (!data) return;

    const { cohort, slots: cohortSlots } = data;
    const doc = new jsPDF();
    let currentY = 15;

    doc.setFontSize(20);
    doc.text("Laporan Reservasi Wawancara", 105, currentY, { align: "center" });
    currentY += 15;

    doc.setFontSize(16);
    doc.setTextColor(52, 152, 219);
    doc.text(`${cohort.nama_kelompok} - ${cohort.title}`, 14, currentY);
    currentY += 10;

    const sortedSlots = Object.values(cohortSlots).sort((a, b) => 
      a.slot.date.localeCompare(b.slot.date)
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
        .map(r => [
          r.user_name,
          r.access_code,
          new Date(r.created_at).toLocaleString("id-ID", {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Nama Peserta', 'Kode Akses', 'Waktu Daftar']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
    });

    if (!hasAnyData) {
      showToast("Tidak ada reservasi untuk cohort ini", "info");
      return;
    }

    doc.save(`rekap-${cohort.nama_kelompok}-${cohort.title}-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast(`Laporan ${cohort.nama_kelompok} berhasil diunduh`);
  };

  /**
   * Cohort Management Logic
   * Handles creation, updates, and deletion of event groups.
   */
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
      setNewCohort({
        title: "",
        description: "",
        slug: "",
        nama_kelompok: "",
        start_at: "",
        end_at: "",
      });
      setShowErrors(false);
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
      setNewCohort({
        title: "",
        description: "",
        slug: "",
        nama_kelompok: "",
        start_at: "",
        end_at: "",
      });
      setShowErrors(false);
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

  /**
   * Slot Management Logic
   * Handles scheduling specific interview dates and setting quotas.
   */
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
      setNewSlot({ ...newSlot, date: "" });
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
    if (!editingSlotId || !newSlot.cohort_id || !newSlot.date || !selectedKelompok) {
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
      setNewSlot({ cohort_id: "", date: "", quota: 10 });
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

  /**
   * Participant Management Logic
   * Includes bulk import from clipboard (Excel/Google Sheets) and individual edits.
   */
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

  /**
   * Reservation Management Logic
   * Handles deletion of individual bookings.
   */
  const handleDeleteReservation = async (id: string, slotId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus reservasi ini?")) return;

    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      await supabase.rpc("decrement_slot_count", { p_slot_id: slotId });
      showToast("Reservasi berhasil dihapus");
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

  const toggleNameSelection = (id: string) => {
    setSelectedNameIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleCohortSelection = (cohortTitle: string, checked: boolean) => {
    const idsInCohort = groupedNames[cohortTitle].map((an) => an.id);
    if (checked) {
      setSelectedNameIds((prev) => [...new Set([...prev, ...idsInCohort])]);
    } else {
      setSelectedNameIds((prev) =>
        prev.filter((id) => !idsInCohort.includes(id)),
      );
    }
  };

  const copyInviteLink = (slug: string) => {
    const url = `${window.location.origin}/cohort/${slug}`;
    navigator.clipboard.writeText(url);
    showToast("Tautan berhasil disalin ke clipboard");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          className="refined-card"
          sx={{
            p: { xs: 1, sm: 3 },
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: { xs: "nowrap", md: "wrap" },
            gap: 2,
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              display: { xs: "none", sm: "block" },
              whiteSpace: "nowrap",
            }}
          >
            Panel Admin
          </Typography>
          <Tabs
            value={tab}
            onChange={(_: React.SyntheticEvent, v: number) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 40,
              flexGrow: 1,
              maxWidth: "100%",
              "& .MuiTab-root": {
                py: 1,
                minHeight: 40,
                fontWeight: 700,
                fontSize: "1rem",
                whiteSpace: "nowrap",
              },
              "& .MuiTabs-scrollButtons": {
                "&.Mui-disabled": { opacity: 0.3 },
                color: "#3498db",
              },
            }}
          >
            <Tab label="Atur Event" />
            <Tab label="Atur Jadwal" />
            <Tab label="Atur Peserta" />
            <Tab label="Rekap" />
          </Tabs>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ mb: 2, px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {editingCohortId
                        ? "Ubah Event"
                        : "Tambah Event/Wawancara"}
                    </Typography>
                  </Box>
                  {/* Mobile Collapsible Form */}
                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <Accordion
                      className="refined-card"
                      defaultExpanded={!!editingCohortId}
                    >
                      <AccordionSummary expandIcon={<ChevronDown />}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {editingCohortId
                            ? "Form Perubahan"
                            : "Form Tambah Event"}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
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
                              showErrors && !newCohort.title
                                ? "Judul event wajib diisi"
                                : ""
                            }
                            onChange={(e) =>
                              handleCohortFieldChange("title", e.target.value)
                            }
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
                                sx: {
                                  cursor: editingCohortId
                                    ? "not-allowed"
                                    : "text",
                                },
                              },
                            }}
                            onChange={(e) =>
                              handleCohortFieldChange("slug", e.target.value)
                            }
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
                            onChange={(e) =>
                              handleCohortFieldChange("start_at", e.target.value)
                            }
                            helperText="Opsional: Kosongkan jika ingin langsung dibuka"
                          />
                          <TextField
                            fullWidth
                            type="datetime-local"
                            label="Waktu Tutup Pendaftaran"
                            margin="normal"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={newCohort.end_at}
                            onChange={(e) =>
                              handleCohortFieldChange("end_at", e.target.value)
                            }
                            helperText="Opsional: Kosongkan jika tidak ada batas waktu"
                          />
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            {editingCohortId && (
                              <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => {
                                  setEditingCohortId(null);
                                  setNewCohort({
                                    title: "",
                                    description: "",
                                    slug: "",
                                    nama_kelompok: "",
                                    start_at: "",
                                    end_at: "",
                                  });
                                }}
                                fullWidth
                              >
                                Batal
                              </Button>
                            )}
                            <Button
                              variant="contained"
                              onClick={
                                editingCohortId
                                  ? handleUpdateCohort
                                  : handleCreateCohort
                              }
                              fullWidth
                            >
                              {editingCohortId ? "Simpan Perubahan" : "Simpan"}
                            </Button>
                          </Stack>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>

                  {/* Desktop Standard Form */}
                  <Paper
                    className="refined-card"
                    sx={{ p: 3, display: { xs: "none", md: "block" } }}
                  >
                    <TextField
                      fullWidth
                      label="Nama Kelompok"
                      margin="normal"
                      placeholder="misal: Kelompok A"
                      value={newCohort.nama_kelompok}
                      onChange={(e) =>
                        handleCohortFieldChange("nama_kelompok", e.target.value)
                      }
                    />
                    <TextField
                      fullWidth
                      label="Judul Event/Wawancara"
                      margin="normal"
                      value={newCohort.title}
                      onChange={(e) =>
                        handleCohortFieldChange("title", e.target.value)
                      }
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
                          sx: {
                            cursor: editingCohortId ? "not-allowed" : "text",
                          },
                        },
                      }}
                      onChange={(e) =>
                        handleCohortFieldChange("slug", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleCohortFieldChange("start_at", e.target.value)
                      }
                      helperText="Opsional: Kosongkan jika ingin langsung dibuka"
                    />
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Waktu Tutup Pendaftaran"
                      margin="normal"
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={newCohort.end_at}
                      onChange={(e) =>
                        handleCohortFieldChange("end_at", e.target.value)
                      }
                      helperText="Opsional: Kosongkan jika tidak ada batas waktu"
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {editingCohortId && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={() => {
                            setEditingCohortId(null);
                            setNewCohort({
                              title: "",
                              description: "",
                              slug: "",
                              nama_kelompok: "",
                              start_at: "",
                              end_at: "",
                            });
                          }}
                          fullWidth
                        >
                          Batal
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        onClick={
                          editingCohortId
                            ? handleUpdateCohort
                            : handleCreateCohort
                        }
                        fullWidth
                      >
                        {editingCohortId ? "Simpan Perubahan" : "Simpan"}
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ mb: 2, px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Daftar Event
                    </Typography>
                  </Box>
                  <TableContainer
                    component={Paper}
                    className="refined-card"
                    sx={{
                      overflowX: "auto",
                      maxWidth: "100%",
                      display: "block",
                    }}
                  >
                    <Table sx={{ minWidth: { xs: 600, md: "100%" } }}>
                      <TableHead>
                      <TableRow>
                      <TableCell>Nama Kelompok</TableCell>
                      <TableCell>Event/Wawancara</TableCell>
                      <TableCell>Mulai</TableCell>
                      <TableCell>Akhir</TableCell>
                      <TableCell align="right"></TableCell>
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
                          <TableCell align="right">                                <Box
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
                                        bgcolor: "rgba(255, 255, 255, 0.05)",
                                        borderRadius: "50%",
                                        width: 28,
                                        height: 28,
                                        "&:hover": {
                                          bgcolor: "rgba(255, 255, 255, 0.1)",
                                        },
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
                                        bgcolor: "rgba(52, 152, 219, 0.15)",
                                        borderRadius: "50%",
                                        width: 28,
                                        height: 28,
                                        "&:hover": {
                                          bgcolor: "rgba(52, 152, 219, 0.25)",
                                        },
                                      }}
                                    >
                                      <Edit2 size={14} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Atur Peserta">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => {
                                        setPasteTargetCohort(c.id);
                                        setPasteDialogOpen(true);
                                      }}
                                      sx={{
                                        bgcolor: "rgba(46, 204, 113, 0.15)",
                                        borderRadius: "50%",
                                        width: 28,
                                        height: 28,
                                        color: "#2ecc71",
                                        "&:hover": {
                                          bgcolor: "rgba(46, 204, 113, 0.25)",
                                        },
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
                                        bgcolor: "rgba(231, 76, 60, 0.15)",
                                        borderRadius: "50%",
                                        width: 28,
                                        height: 28,
                                        "&:hover": {
                                          bgcolor: "rgba(231, 76, 60, 0.25)",
                                        },
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
            )}

            {tab === 1 && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ mb: 2, px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {editingSlotId ? "Ubah Jadwal Event/Wawancara" : "Tambah Jadwal Event/Wawancara"}
                    </Typography>
                  </Box>
                  {/* Mobile Collapsible Form */}
                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <Accordion className="refined-card">
                      <AccordionSummary expandIcon={<ChevronDown />}>
                        <Typography sx={{ fontWeight: 700 }}>
                          Form Input Jadwal
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
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
                              showErrors && !selectedKelompok
                                ? "Wajib pilih kelompok"
                                : ""
                            }
                            onChange={(e) => {
                              setSelectedKelompok(e.target.value);
                              setNewSlot({ ...newSlot, cohort_id: "" });
                            }}
                          >
                            <option value=""></option>
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
                              showErrors && !newSlot.cohort_id
                                ? "Wajib pilih event"
                                : ""
                            }
                            onChange={(e) =>
                              setNewSlot({
                                ...newSlot,
                                cohort_id: e.target.value,
                              })
                            }
                          >
                            <option value=""></option>
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
                            helperText={
                              showErrors && !newSlot.date
                                ? "Wajib pilih tanggal"
                                : ""
                            }
                            onChange={(e) =>
                              setNewSlot({ ...newSlot, date: e.target.value })
                            }
                          />
                          <TextField
                            fullWidth
                            type="number"
                            label="Kuota"
                            margin="normal"
                            value={newSlot.quota}
                            error={
                              showErrors &&
                              (isNaN(newSlot.quota) || newSlot.quota <= 0)
                            }
                            helperText={
                              showErrors &&
                              (isNaN(newSlot.quota) || newSlot.quota <= 0)
                                ? "Kuota minimal 1"
                                : ""
                            }
                            onChange={(e) =>
                              setNewSlot({
                                ...newSlot,
                                quota: parseInt(e.target.value),
                              })
                            }
                          />
                          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            {editingSlotId && (
                              <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => {
                                  setEditingSlotId(null);
                                  setNewSlot({ cohort_id: "", date: "", quota: 10 });
                                }}
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
                      </AccordionDetails>
                    </Accordion>
                  </Box>

                  {/* Desktop Standard Form */}
                  <Paper
                    className="refined-card"
                    sx={{ p: 3, display: { xs: "none", md: "block" } }}
                  >
                    <TextField
                      select
                      fullWidth
                      label="Pilih Kelompok"
                      margin="normal"
                      slotProps={{ select: { native: true } }}
                      value={selectedKelompok}
                      error={showErrors && !selectedKelompok}
                      helperText={
                        showErrors && !selectedKelompok
                          ? "Wajib pilih kelompok"
                          : ""
                      }
                      onChange={(e) => {
                        setSelectedKelompok(e.target.value);
                        setNewSlot({ ...newSlot, cohort_id: "" });
                      }}
                    >
                      <option value=""></option>
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
                        showErrors && !newSlot.cohort_id
                          ? "Wajib pilih event"
                          : ""
                      }
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, cohort_id: e.target.value })
                      }
                    >
                      <option value=""></option>
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
                      helperText={
                        showErrors && !newSlot.date ? "Wajib pilih tanggal" : ""
                      }
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, date: e.target.value })
                      }
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Kuota"
                      margin="normal"
                      value={newSlot.quota}
                      error={
                        showErrors &&
                        (isNaN(newSlot.quota) || newSlot.quota <= 0)
                      }
                      helperText={
                        showErrors &&
                        (isNaN(newSlot.quota) || newSlot.quota <= 0)
                          ? "Kuota minimal 1"
                          : ""
                      }
                      onChange={(e) =>
                        setNewSlot({
                          ...newSlot,
                          quota: parseInt(e.target.value),
                        })
                      }
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      {editingSlotId && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={() => {
                            setEditingSlotId(null);
                            setNewSlot({ cohort_id: "", date: "", quota: 10 });
                          }}
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
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ mb: 2, px: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Jadwal Event/Wawancara
                    </Typography>
                  </Box>
                  <TableContainer
                    component={Paper}
                    className="refined-card"
                    sx={{
                      overflowX: "auto",
                      maxWidth: "100%",
                      display: "block",
                    }}
                  >
                    <Table sx={{ minWidth: { xs: 600, md: "100%" } }}>
                      <TableHead>
                      <TableRow>
                      <TableCell>Kelompok</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Tanggal</TableCell>
                      <TableCell>Kapasitas</TableCell>
                      <TableCell align="right"></TableCell>
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
                              sx={{ color: "#3498db", fontWeight: 600 }}
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
                            <Box display="flex" gap={0.5} justifyContent="flex-end" alignItems="center">
                              <Tooltip title="Ubah Jadwal">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditSlotClick(s)}
                                  sx={{
                                    bgcolor: "rgba(52, 152, 219, 0.15)",
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    "&:hover": {
                                      bgcolor: "rgba(52, 152, 219, 0.25)",
                                    },
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
                                    bgcolor: "rgba(231, 76, 60, 0.15)",
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    "&:hover": {
                                      bgcolor: "rgba(231, 76, 60, 0.25)",
                                    },
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
                      )}                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}

            {tab === 2 && (
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                  px={1}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.9rem", sm: "1.25rem" },
                    }}
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

                {loading ? (
                  <Stack spacing={2}>
                    {[1, 2, 3].map(n => (
                      <Skeleton key={n} variant="rectangular" height={64} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
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

                    {Object.entries(groupedNames).map(([cohortTitle, names]) => {
                      const namaKelompok = names[0]?.cohorts?.nama_kelompok || "";
                      return (
                        <Accordion
                          key={cohortTitle}
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
                                  names.some((n) =>
                                    selectedNameIds.includes(n.id),
                                  ) &&
                                  !names.every((n) =>
                                    selectedNameIds.includes(n.id),
                                  )
                                }
                                onChange={(e) =>
                                  toggleCohortSelection(
                                    cohortTitle,
                                    e.target.checked,
                                  )
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
                                    color: "#3498db",
                                    fontSize: { xs: "0.7rem", sm: "0.85rem" },
                                    letterSpacing: "1px",
                                  }}
                                >
                                  {namaKelompok.toUpperCase()}
                                </Typography>
                                <Typography
                                  sx={{
                                    opacity: 0.3,
                                    fontWeight: 300,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  |
                                </Typography>
                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: { xs: "0.75rem", sm: "1rem" },
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
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
                              <Table size="small" sx={{ minWidth: 400 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell
                                      padding="checkbox"
                                      sx={{ width: 40 }}
                                    ></TableCell>
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
                                    ></TableCell>
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
                                          onChange={() =>
                                            toggleNameSelection(an.id)
                                          }
                                          sx={{ p: 0.5 }}
                                        />
                                      </TableCell>
                                      <TableCell
                                        sx={{
                                          fontSize: {
                                            xs: "0.75rem",
                                            sm: "0.85rem",
                                          },
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
                                                bgcolor: "rgba(52, 152, 219, 0.15)",
                                                borderRadius: "50%",
                                                width: 24,
                                                height: 24,
                                                "&:hover": {
                                                  bgcolor: "rgba(52, 152, 219, 0.25)",
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
                                                bgcolor: "rgba(231, 76, 60, 0.1)",
                                                borderRadius: "50%",
                                                width: 24,
                                                height: 24,
                                                "&:hover": {
                                                  bgcolor: "rgba(231, 76, 60, 0.2)",
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
              </Box>
            )}

            {tab === 3 && (
              <Box>
                <Box mb={3} px={1}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Rekapitulasi Reservasi</Typography>
                  <Typography variant="body2" color="textSecondary">Rekap daftar reservasi event/wawancara</Typography>
                </Box>

                <Stack spacing={2}>
                  {loading ? (
                    [1, 2, 3].map(n => (
                      <Skeleton key={n} variant="rectangular" height={80} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                    ))
                  ) : (
                    Object.values(reportData)
                      .sort((a, b) => a.cohort.nama_kelompok.localeCompare(b.cohort.nama_kelompok))
                      .map(({ cohort, slots: cohortSlots }) => {
                        const totalReservations = Object.values(cohortSlots).reduce((sum, s) => sum + s.reservations.length, 0);
                        if (totalReservations === 0) return null;

                        return (
                          <Accordion key={cohort.id} className="refined-card">
                            <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                              <Box display="flex" alignItems="center" gap={2} width="100%" pr={2}>
                                <Box sx={{ p: 1, bgcolor: 'rgba(52, 152, 219, 0.1)', borderRadius: 2, color: '#3498db', display: { xs: 'none', sm: 'block' } }}>
                                  <FileText size={20} />
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 900, color: '#3498db', letterSpacing: 1, display: 'block' }}>
                                    {cohort.nama_kelompok.toUpperCase()}
                                  </Typography>
                                  <Typography sx={{ fontWeight: 800 }}>{cohort.title}</Typography>
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
                                      borderRadius: 2, 
                                      fontWeight: 700,
                                      py: 0.5,
                                      px: 1.5,
                                      borderColor: 'rgba(52, 152, 219, 0.4)',
                                      color: '#3498db',
                                      '&:hover': {
                                        borderColor: '#3498db',
                                        bgcolor: 'rgba(52, 152, 219, 0.1)'
                                      }
                                    }}
                                  >
                                    PDF
                                  </Button>
                                  <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block', fontSize: '0.65rem' }}>TOTAL RESERVASI</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#2ecc71', lineHeight: 1 }}>{totalReservations}</Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: 3 }}>
                              <Divider sx={{ mb: 2, opacity: 0.1 }} />

                              <Stack spacing={3}>
                                {Object.values(cohortSlots)
                                  .sort((a, b) => a.slot.date.localeCompare(b.slot.date))
                                  .map(({ slot, reservations: slotReservations }) => (
                                    <Box key={slot.id} sx={{ pl: { xs: 1, md: 2 }, borderLeft: '2px solid rgba(255,255,255,0.05)' }}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                        <Typography sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                                          {new Date(slot.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 600, px: 1.2, py: 0.3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                                          {slotReservations.length} Orang
                                        </Typography>
                                      </Box>
                                      
                                      {slotReservations.length > 0 ? (
                                        <TableContainer>
                                          <Table size="small">
                                            <TableHead>
                                              <TableRow>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>No</TableCell>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Nama</TableCell>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Waktu Daftar</TableCell>
                                                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Kode</TableCell>
                                                <TableCell align="right"></TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {slotReservations
                                                .sort((a, b) => a.user_name.localeCompare(b.user_name))
                                                .map((r, idx) => (
                                                  <TableRow key={r.id} sx={{ '& td': { py: 1 } }}>
                                                    <TableCell sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{idx + 1}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>{r.user_name}</TableCell>
                                                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                      {new Date(r.created_at).toLocaleString("id-ID", {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
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
                                                          onClick={() => handleDeleteReservation(r.id, r.slot_id)}
                                                          sx={{ 
                                                            bgcolor: 'rgba(231, 76, 60, 0.1)',
                                                            '&:hover': { bgcolor: 'rgba(231, 76, 60, 0.2)' }
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
                                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', pl: 1 }}>Belum ada pendaftar</Typography>
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
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Paste from Excel Dialog */}
      <Dialog
        open={pasteDialogOpen}
        onClose={() => setPasteDialogOpen(false)}
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
            placeholder="Contoh:
Nama Lengkap 1
Nama Lengkap 2
Nama Lengkap 3"
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPasteDialogOpen(false)} color="inherit">
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

      {/* Edit Name Dialog */}
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
          <Button onClick={() => setEditNameDialogOpen(false)} color="inherit">
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 600, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
