import { useState, useRef } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            navigate('/admin');
        } else {
            setError('Password salah! Silakan coba lagi.');
            passwordInputRef.current?.focus();
        }
    };

    return (
        <Container maxWidth="xs" sx={{ height: '80vh', display: 'flex', alignItems: 'center' }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.4 }}
                style={{ width: '100%' }}
            >
                <Paper className="refined-card" sx={{ p: 6, textAlign: 'center', width: '100%' }}>
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(52, 152, 219, 0.1)',
                            color: '#3498db'
                        }}>
                            <Lock size={32} />
                        </Box>
                    </Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>Admin Masuk</Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                        Sistem Wawancara - Akses Panel
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            type="password"
                            label="Kata Sandi"
                            variant="outlined"
                            inputRef={passwordInputRef}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 4 }}
                            autoFocus
                        />
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                size="large" 
                                type="submit"
                            >
                                Masuk
                            </Button>
                        </motion.div>
                    </form>
                </Paper>
            </motion.div>
        </Container>
    );
}
