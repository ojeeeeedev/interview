import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

import { useAdminData } from "./hooks/useAdminData";
import CohortTab from "./tabs/CohortTab";
import SlotTab from "./tabs/SlotTab";
import ParticipantTab from "./tabs/ParticipantTab";
import RecapTab from "./tabs/RecapTab";

/**
 * Admin Panel Shell
 *
 * Thin orchestration layer: mounts the shared data hook, manages the active
 * tab, lifts paste-dialog state (opened from CohortTab's "Atur Peserta"
 * button), and renders the per-tab content with AnimatePresence transitions.
 */
export default function Admin() {
  const [tab, setTab] = useState(0);

  // Paste-dialog state is lifted here so CohortTab can trigger it
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteTargetCohort, setPasteTargetCohort] = useState("");
  const [selectedNameIds, setSelectedNameIds] = useState<string[]>([]);

  const {
    cohorts,
    slots,
    loading,
    showErrors,
    setShowErrors,
    snackbar,
    showToast,
    handleCloseSnackbar,
    fetchAll,
    groupedNames,
    reportData,
  } = useAdminData();

  const handleOpenParticipantDialog = (cohortId: string) => {
    setPasteTargetCohort(cohortId);
    setPasteDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header / Tab bar */}
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
                color: "#d4af37",
              },
            }}
          >
            <Tab label="Atur Event" />
            <Tab label="Atur Jadwal" />
            <Tab label="Atur Peserta" />
            <Tab label="Rekap" />
          </Tabs>
        </Box>

        {/* Tab panels with enter/exit animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 0 && (
              <CohortTab
                cohorts={cohorts}
                loading={loading}
                showErrors={showErrors}
                setShowErrors={setShowErrors}
                showToast={showToast}
                fetchAll={fetchAll}
                onOpenParticipantDialog={handleOpenParticipantDialog}
              />
            )}

            {tab === 1 && (
              <SlotTab
                cohorts={cohorts}
                slots={slots}
                loading={loading}
                showErrors={showErrors}
                setShowErrors={setShowErrors}
                showToast={showToast}
                fetchAll={fetchAll}
              />
            )}

            {tab === 2 && (
              <ParticipantTab
                groupedNames={groupedNames}
                loading={loading}
                selectedNameIds={selectedNameIds}
                setSelectedNameIds={setSelectedNameIds}
                pasteDialogOpen={pasteDialogOpen}
                setPasteDialogOpen={setPasteDialogOpen}
                pasteTargetCohort={pasteTargetCohort}
                showToast={showToast}
                fetchAll={fetchAll}
              />
            )}

            {tab === 3 && (
              <RecapTab
                reportData={reportData}
                loading={loading}
                showToast={showToast}
                fetchAll={fetchAll}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Global Snackbar */}
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
