import { useState, useEffect, useMemo } from 'react';
import { 
    Container, Typography, Paper, TextField, Button, Grid, Table, TableBody, 
    TableCell, TableHead, TableRow, IconButton, Tabs, Tab, Box, Dialog, 
    DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, 
    AccordionDetails, Checkbox, Divider
} from '@mui/material';
import { Trash2, Copy, ArrowLeft, ClipboardList, ChevronDown, UserMinus, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Cohort, Slot } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
    const [tab, setTab] = useState(0);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [allowedNames, setAllowedNames] = useState<any[]>([]);
    const [selectedNameIds, setSelectedNameIds] = useState<string[]>([]);

    // Form states
    const [newCohort, setNewCohort] = useState({ title: '', description: '', slug: '', nama_kelompok: '' });
    const [newSlot, setNewSlot] = useState({ cohort_id: '', date: '', quota: 10 });
    
    // Paste from Excel states
    const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
    const [pasteTargetCohort, setPasteTargetCohort] = useState<string>('');
    const [pasteData, setPasteData] = useState('');

    // Edit Name states
    const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
    const [editingName, setEditingName] = useState<{ id: string, full_name: string } | null>(null);

    const fetchAll = async () => {
        const { data: c } = await supabase.from('cohorts').select('*');
        const { data: s } = await supabase.from('slots').select('*, cohorts(title)');
        const { data: r } = await supabase.from('reservations').select('*, slots(date, cohorts(title))');
        const { data: an } = await supabase.from('allowed_names').select('*, cohorts(title)');
        
        if (c) setCohorts(c);
        if (s) setSlots(s as any);
        if (r) setReservations(r as any);
        if (an) setAllowedNames(an as any);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const groupedNames = useMemo(() => {
        const groups: Record<string, any[]> = {};
        allowedNames.forEach(an => {
            const cohortTitle = an.cohorts?.title || 'Tanpa Gelombang';
            if (!groups[cohortTitle]) groups[cohortTitle] = [];
            groups[cohortTitle].push(an);
        });
        return groups;
    }, [allowedNames]);

    const handleCreateCohort = async () => {
        if (!newCohort.title || !newCohort.slug || !newCohort.nama_kelompok) return;
        const { error } = await supabase.from('cohorts').insert([{
            title: newCohort.title,
            description: newCohort.description,
            unique_slug: newCohort.slug,
            nama_kelompok: newCohort.nama_kelompok
        }]);
        if (error) alert(error.message);
        else {
            setNewCohort({ title: '', description: '', slug: '', nama_kelompok: '' });
            fetchAll();
        }
    };

    const handleCreateSlot = async () => {
        if (!newSlot.cohort_id || !newSlot.date) return;
        const { error } = await supabase.from('slots').insert([{
            cohort_id: newSlot.cohort_id,
            date: newSlot.date,
            quota: newSlot.quota
        }]);
        if (error) alert(error.message);
        else {
            setNewSlot({ ...newSlot, date: '' });
            fetchAll();
        }
    };

    const handlePasteSubmit = async () => {
        if (!pasteData.trim()) return;
        
        const rows = pasteData.split(/\r?\n/).filter(row => !!row.trim());
        const names = rows.map(row => ({
            cohort_id: pasteTargetCohort,
            full_name: row.split('\t')[0].trim()
        })).filter(n => !!n.full_name);

        const { error } = await supabase.from('allowed_names').insert(names);
        if (error) alert(error.message);
        else {
            alert(`Berhasil menambahkan ${names.length} nama!`);
            setPasteDialogOpen(false);
            setPasteData('');
            fetchAll();
        }
    };

    const handleUpdateName = async () => {
        if (!editingName || !editingName.full_name.trim()) return;
        
        const { error } = await supabase
            .from('allowed_names')
            .update({ full_name: editingName.full_name.trim() })
            .eq('id', editingName.id);

        if (error) alert(error.message);
        else {
            setEditNameDialogOpen(false);
            setEditingName(null);
            fetchAll();
        }
    };

    const handleDeleteReservation = async (id: string, slotId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus reservasi ini?')) return;
        
        const { error } = await supabase.from('reservations').delete().eq('id', id);
        if (!error) {
            await supabase.rpc('decrement_slot_count', { p_slot_id: slotId });
            fetchAll();
        }
    };

    const handleDeleteAllowedName = async (id: string) => {
        if (!confirm('Hapus nama ini?')) return;
        const { error } = await supabase.from('allowed_names').delete().eq('id', id);
        if (!error) fetchAll();
    };

    const handleBulkDeleteNames = async () => {
        if (selectedNameIds.length === 0) return;
        if (!confirm(`Hapus ${selectedNameIds.length} nama terpilih?`)) return;

        const { error } = await supabase.from('allowed_names').delete().in('id', selectedNameIds);
        if (error) alert(error.message);
        else {
            setSelectedNameIds([]);
            fetchAll();
        }
    };

    const toggleNameSelection = (id: string) => {
        setSelectedNameIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleCohortSelection = (cohortTitle: string, checked: boolean) => {
        const idsInCohort = groupedNames[cohortTitle].map(an => an.id);
        if (checked) {
            setSelectedNameIds(prev => [...new Set([...prev, ...idsInCohort])]);
        } else {
            setSelectedNameIds(prev => prev.filter(id => !idsInCohort.includes(id)));
        }
    };

    const copyInviteLink = (slug: string) => {
        const url = `${window.location.origin}/cohort/${slug}`;
        navigator.clipboard.writeText(url);
        alert('Link undangan berhasil disalin!');
    };

    return (
        <Container maxWidth="lg" sx={{ py: 12 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Box className="refined-card" sx={{ p: 4, mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>Panel Admin</Typography>
                    <Tabs value={tab} onChange={(_: any, v: number) => setTab(v)} sx={{ mb: 4 }}>
                        <Tab label="Gelombang" />
                        <Tab label="Jadwal" />
                        <Tab label="Reservasi" />
                        <Tab label="Daftar Nama" />
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
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper className="refined-card" sx={{ p: 3 }}>
                                        <Typography variant="h6" gutterBottom>Buat Gelombang</Typography>
                                        <TextField 
                                            fullWidth 
                                            label="Nama Kelompok" 
                                            margin="normal" 
                                            placeholder="misal: Kelompok A"
                                            value={newCohort.nama_kelompok} 
                                            onChange={(e: any) => setNewCohort({...newCohort, nama_kelompok: e.target.value})} 
                                        />
                                        <TextField fullWidth label="Judul Gelombang" margin="normal" value={newCohort.title} onChange={(e: any) => setNewCohort({...newCohort, title: e.target.value})} />
                                        <TextField fullWidth label="Deskripsi" margin="normal" multiline rows={2} value={newCohort.description} onChange={(e: any) => setNewCohort({...newCohort, description: e.target.value})} />
                                        <TextField fullWidth label="Slug Unik" margin="normal" value={newCohort.slug} onChange={(e: any) => setNewCohort({...newCohort, slug: e.target.value})} />
                                        <Button variant="contained" sx={{ mt: 2 }} onClick={handleCreateCohort} fullWidth>Simpan</Button>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Table component={Paper} className="refined-card">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Kelompok</TableCell>
                                                <TableCell>Judul</TableCell>
                                                <TableCell>Aksi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {cohorts.map(c => (
                                                <TableRow key={c.id}>
                                                    <TableCell>{c.nama_kelompok}</TableCell>
                                                    <TableCell>{c.title}</TableCell>
                                                    <TableCell>
                                                        <Box display="flex" gap={1}>
                                                            <Button size="small" startIcon={<Copy />} onClick={() => copyInviteLink(c.unique_slug)}>Link</Button>
                                                            <Button size="small" startIcon={<ClipboardList />} variant="outlined" color="primary" onClick={() => {
                                                                setPasteTargetCohort(c.id);
                                                                setPasteDialogOpen(true);
                                                            }}>
                                                                Excel
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Grid>
                            </Grid>
                        )}

                        {tab === 1 && (
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Paper className="refined-card" sx={{ p: 3 }}>
                                        <Typography variant="h6" gutterBottom>Tambah Jadwal</Typography>
                                        <TextField 
                                            select 
                                            fullWidth 
                                            label="Gelombang" 
                                            margin="normal" 
                                            slotProps={{ select: { native: true } }}
                                            value={newSlot.cohort_id}
                                            onChange={(e: any) => setNewSlot({...newSlot, cohort_id: e.target.value})}
                                        >
                                            <option value=""></option>
                                            {cohorts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </TextField>
                                        <TextField fullWidth type="date" label="Tanggal" margin="normal" slotProps={{ inputLabel: { shrink: true } }} value={newSlot.date} onChange={(e: any) => setNewSlot({...newSlot, date: e.target.value})} />
                                        <TextField fullWidth type="number" label="Kuota" margin="normal" value={newSlot.quota} onChange={(e: any) => setNewSlot({...newSlot, quota: parseInt(e.target.value)})} />
                                        <Button variant="contained" sx={{ mt: 2 }} onClick={handleCreateSlot} fullWidth>Tambah</Button>
                                    </Paper>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Table component={Paper} className="refined-card">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Gelombang</TableCell>
                                                <TableCell>Tanggal</TableCell>
                                                <TableCell>Kapasitas</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {slots.map(s => (
                                                <TableRow key={s.id}>
                                                    <TableCell>{(s as any).cohorts?.title}</TableCell>
                                                    <TableCell>{s.date}</TableCell>
                                                    <TableCell>{s.count} / {s.quota}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Grid>
                            </Grid>
                        )}

                        {tab === 2 && (
                            <Table component={Paper} className="refined-card">
                                <TableHead>
                                            <TableRow>
                                                <TableCell>Nama</TableCell>
                                                <TableCell>Gelombang</TableCell>
                                                <TableCell>Tanggal</TableCell>
                                                <TableCell>Kode</TableCell>
                                                <TableCell>Aksi</TableCell>
                                            </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reservations.map(r => (
                                        <TableRow key={r.id}>
                                            <TableCell>{r.user_name}</TableCell>
                                            <TableCell>{r.slots?.cohorts?.title}</TableCell>
                                            <TableCell>{r.slots?.date}</TableCell>
                                            <TableCell><code>{r.access_code}</code></TableCell>
                                            <TableCell>
                                                <IconButton color="error" onClick={() => handleDeleteReservation(r.id, r.slot_id)}><Trash2 size={20} /></IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {tab === 3 && (
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} px={2}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {selectedNameIds.length > 0 ? `${selectedNameIds.length} Nama Dipilih` : 'Kelola Daftar Nama'}
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        color="error" 
                                        startIcon={<UserMinus size={18} />}
                                        disabled={selectedNameIds.length === 0}
                                        onClick={handleBulkDeleteNames}
                                    >
                                        Hapus Terpilih
                                    </Button>
                                </Box>

                                {Object.keys(groupedNames).length === 0 && (
                                    <Typography textAlign="center" color="textSecondary" py={4}>Belum ada daftar nama.</Typography>
                                )}

                                {Object.entries(groupedNames).map(([cohortTitle, names]) => (
                                    <Accordion key={cohortTitle} className="refined-card" sx={{ mb: 2 }}>
                                        <AccordionSummary expandIcon={<ChevronDown />}>
                                            <Box display="flex" alignItems="center" width="100%">
                                                <Checkbox 
                                                    size="small"
                                                    checked={names.every(n => selectedNameIds.includes(n.id))}
                                                    indeterminate={names.some(n => selectedNameIds.includes(n.id)) && !names.every(n => selectedNameIds.includes(n.id))}
                                                    onChange={(e) => toggleCohortSelection(cohortTitle, e.target.checked)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Typography sx={{ fontWeight: 700, ml: 1 }}>{cohortTitle}</Typography>
                                                <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>({names.length} Nama)</Typography>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                            <Divider sx={{ mb: 1 }} />
                                            <Table size="small">
                                                <TableBody>
                                                    {names.map(an => (
                                                        <TableRow key={an.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                                            <TableCell padding="checkbox">
                                                                <Checkbox 
                                                                    size="small" 
                                                                    checked={selectedNameIds.includes(an.id)}
                                                                    onChange={() => toggleNameSelection(an.id)}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{an.full_name}</TableCell>
                                                            <TableCell align="right">
                                                                <IconButton size="small" color="primary" sx={{ mr: 1 }} onClick={() => {
                                                                    setEditingName({ id: an.id, full_name: an.full_name });
                                                                    setEditNameDialogOpen(true);
                                                                }}>
                                                                    <Edit2 size={16} />
                                                                </IconButton>
                                                                <IconButton size="small" color="error" onClick={() => handleDeleteAllowedName(an.id)}>
                                                                    <Trash2 size={16} />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
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
                PaperProps={{ className: 'refined-card' }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Paste Nama dari Excel</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Copy kolom nama di Excel, lalu paste di bawah ini.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        variant="outlined"
                        placeholder="Paste di sini..."
                        value={pasteData}
                        onChange={(e) => setPasteData(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setPasteDialogOpen(false)} color="inherit">Batal</Button>
                    <Button 
                        onClick={handlePasteSubmit} 
                        variant="contained" 
                        disabled={!pasteData.trim()}
                    >
                        Tambah Nama
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Name Dialog */}
            <Dialog 
                open={editNameDialogOpen} 
                onClose={() => setEditNameDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ className: 'refined-card' }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Ubah Nama</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nama Lengkap"
                        variant="outlined"
                        margin="normal"
                        value={editingName?.full_name || ''}
                        onChange={(e) => setEditingName(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setEditNameDialogOpen(false)} color="inherit">Batal</Button>
                    <Button 
                        onClick={handleUpdateName} 
                        variant="contained" 
                        disabled={!editingName?.full_name.trim()}
                    >
                        Simpan Perubahan
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
