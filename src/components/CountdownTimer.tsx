import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack } from '@mui/material';

export default function CountdownTimer({ targetDate, onFinish }: { targetDate: string, onFinish: () => void }) {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) {
            onFinish();
            return null;
        }

        return {
            hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
            jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
            menit: Math.floor((difference / 1000 / 60) % 60),
            detik: Math.floor((difference / 1000) % 60)
        };
    }, [targetDate, onFinish]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (!timeLeft) return null;

    return (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
            {Object.entries(timeLeft).map(([label, value]) => (
                <Box key={label} sx={{ textAlign: 'center', minWidth: 45 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1, color: '#3498db' }}>
                        {String(value).padStart(2, '0')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', textTransform: 'uppercase', opacity: 0.6 }}>
                        {label}
                    </Typography>
                </Box>
            ))}
        </Stack>
    );
}
