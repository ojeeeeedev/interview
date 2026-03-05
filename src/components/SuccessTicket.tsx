import { useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Fade, Snackbar, Alert, Stack } from '@mui/material';
import { CheckCircle, Copy, Image as ImageIcon, FileText } from 'lucide-react';
import { toPng } from 'html-to-image';

interface Props {
    code: string;
    onDone: () => void;
}

export default function SuccessTicket({ code, onDone }: Props) {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setSnackbar({ open: true, message: 'Kode berhasil disalin ke clipboard!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Gagal menyalin kode.', severity: 'error' });
        }
    };

    const handleDownloadTxt = () => {
        const element = document.createElement("a");
        const file = new Blob([`Tiket Reservasi\nKode Akses: ${code}\nMohon simpan kode ini untuk mengubah jadwal Anda.`], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `tiket-wawancara-${code}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    const handleDownloadImage = async () => {
        if (ticketRef.current === null) return;
        
        try {
            const dataUrl = await toPng(ticketRef.current, { cacheBust: true, backgroundColor: '#1a1a1a' });
            const link = document.createElement('a');
            link.download = `tiket-interview-${code}.png`;
            link.href = dataUrl;
            link.click();
            setSnackbar({ open: true, message: 'Gambar tiket berhasil diunduh!', severity: 'success' });
        } catch (err) {
            console.error('oops, something went wrong!', err);
            setSnackbar({ open: true, message: 'Gagal mengunduh gambar tiket.', severity: 'error' });
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Fade in={true} timeout={1000}>
                <Box sx={{ maxWidth: 500, width: '100%', px: 2 }}>
                    {/* Capturable Ticket Area */}
                    <Paper 
                        ref={ticketRef}
                        className="refined-card" 
                        sx={{ 
                            p: { xs: 4, md: 6 }, 
                            textAlign: 'center', 
                            width: '100%',
                            bgcolor: '#1a1a1a !important',
                            mb: 4
                        }}
                    >
                        <CheckCircle size={80} color="#2ecc71" style={{ marginBottom: 32 }} />
                        <Typography variant="h3" gutterBottom sx={{ color: '#ffffff', fontWeight: 800 }}>Berhasil!</Typography>
                        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 6, fontSize: '1.1rem', fontWeight: 500 }}>
                            Jadwal wawancara Anda telah diamankan. Simpan kode akses Anda dengan baik.
                        </Typography>
                        
                        <Box sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.05)', 
                            py: 3, 
                            px: 6,
                            borderRadius: '8px',
                            display: 'inline-block',
                            mb: 2,
                            border: '1px dashed rgba(255, 255, 255, 0.3)'
                        }}>
                            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 8, color: '#ffffff', m: 0 }}>
                                {code}
                            </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#7f8c8d', display: 'block', mb: 4 }}>
                            RESERVASI.SYSTEM
                        </Typography>
                    </Paper>

                    {/* Action Buttons */}
                    <Stack spacing={2}>
                        <Button 
                            variant="contained" 
                            color="info" 
                            startIcon={<Copy size={20} />} 
                            onClick={handleCopyCode} 
                            fullWidth 
                            size="large"
                            sx={{ py: 1.5, bgcolor: '#34495e', '&:hover': { bgcolor: '#2c3e50' } }}
                        >
                            Salin Kode
                        </Button>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<ImageIcon size={20} />} 
                                onClick={handleDownloadImage} 
                                fullWidth 
                                size="large"
                                sx={{ py: 1.5, bgcolor: '#2ecc71', '&:hover': { bgcolor: '#27ae60' } }}
                            >
                                Unduh Gambar (PNG)
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                startIcon={<FileText size={20} />} 
                                onClick={handleDownloadTxt} 
                                fullWidth 
                                size="large"
                                sx={{ py: 1.5, bgcolor: '#2980b9', '&:hover': { bgcolor: '#3498db' } }}
                            >
                                Unduh TXT
                            </Button>
                        </Box>

                        <Button 
                            variant="text" 
                            onClick={onDone} 
                            fullWidth 
                            sx={{ color: '#ffffff', fontWeight: 700, mt: 2 }}
                        >
                            Selesai & Kembali
                        </Button>
                    </Stack>
                </Box>
            </Fade>

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={3000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
