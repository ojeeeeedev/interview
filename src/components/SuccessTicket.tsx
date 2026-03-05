import { Box, Typography, Button, Paper, Fade } from '@mui/material';
import { Download, CheckCircle } from 'lucide-react';

interface Props {
    code: string;
    onDone: () => void;
}

export default function SuccessTicket({ code, onDone }: Props) {
    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([`Tiket Reservasi\nKode Akses: ${code}\nMohon simpan kode ini untuk mengubah jadwal Anda.`], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `tiket-wawancara-${code}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Fade in={true} timeout={1000}>
                <Paper className="refined-card" sx={{ 
                    p: { xs: 4, md: 8 }, 
                    textAlign: 'center', 
                    maxWidth: 500, 
                    width: '100%',
                    bgcolor: '#1a1a1a !important' // Slightly lighter grey for focus
                }}>
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
                        mb: 6,
                        border: '1px dashed rgba(255, 255, 255, 0.3)'
                    }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: 8, color: '#ffffff', m: 0 }}>
                            {code}
                        </Typography>
                    </Box>

                    <Box display="flex" flexDirection="column" gap={2}>
                        <Button variant="contained" color="primary" startIcon={<Download />} onClick={handleDownload} fullWidth size="large" sx={{ py: 2 }}>
                            Unduh Tiket (TXT)
                        </Button>
                        <Button variant="text" onClick={onDone} fullWidth sx={{ color: '#ffffff', fontWeight: 700 }}>
                            Selesai & Kembali
                        </Button>
                    </Box>
                </Paper>
            </Fade>
        </Box>
    );
}
