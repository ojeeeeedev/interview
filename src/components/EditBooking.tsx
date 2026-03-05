import { useState } from 'react';
import { Box, Typography, Button, Paper, Alert, Divider } from '@mui/material';
import { supabase } from '../lib/supabase';
import type { Slot, Reservation } from '../types';
import Calendar from './Calendar';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface Props {
    reservation: Reservation & { slots: Slot };
    slots: Slot[];
    onDone: () => void;
}

export default function EditBooking({ reservation, slots, onDone }: Props) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(parseISO(reservation.slots.date));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = async () => {
        if (!selectedDate) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        if (dateStr === reservation.slots.date) {
            setError('Silakan pilih tanggal yang berbeda atau kembali.');
            return;
        }

        const newSlot = slots.find(s => s.date === dateStr);
        if (!newSlot) {
            setError('Tanggal yang dipilih tidak tersedia.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: rpcError } = await supabase.rpc('change_reservation', {
            p_access_code: reservation.access_code,
            p_new_slot_id: newSlot.id
        });

        if (rpcError) {
            setError(rpcError.message);
        } else {
            alert('Reservasi berhasil diperbarui!');
            onDone();
        }
        setLoading(false);
    };

    return (
        <Paper className="flat-card" elevation={0} sx={{ p: { xs: 4, md: 6 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>Ubah Reservasi</Typography>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 4, fontWeight: 500 }}>
                Selamat datang, {reservation.user_name}
            </Typography>
            <Divider sx={{ my: 4, borderColor: '#bdc3c7' }} />
            
            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

            <Box sx={{ mb: 6, p: 3, bgcolor: '#f8f9fa', borderRadius: '16px', border: '1px solid #ecf0f1' }}>
                <Typography variant="body1" color="textSecondary">Jadwal saat ini:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: '#3498db' }}>
                    {format(parseISO(reservation.slots.date), 'EEEE, d MMMM yyyy', { locale: id })}
                </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>Pilih Tanggal Baru</Typography>
            <Calendar 
                slots={slots} 
                onSelect={setSelectedDate} 
                selected={selectedDate} 
            />

            <Box mt={6} display="flex" gap={2} justifyContent="center" sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button variant="contained" color="secondary" onClick={onDone} fullWidth sx={{ py: 1.5 }}>Kembali</Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUpdate} 
                    disabled={loading || !selectedDate || format(selectedDate, 'yyyy-MM-dd') === reservation.slots.date}
                    fullWidth
                    sx={{ py: 1.5 }}
                >
                    {loading ? 'Memperbarui...' : 'Perbarui Jadwal'}
                </Button>
            </Box>
        </Paper>
    );
}
