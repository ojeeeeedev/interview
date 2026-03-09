import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack } from '@mui/material';

export default function CountdownTimer({ 
    targetDate, 
    onFinish, 
    small = false,
    showTarget = false,
    targetLabel = "BATAS"
}: { 
    targetDate: string, 
    onFinish: () => void,
    small?: boolean,
    showTarget?: boolean,
    targetLabel?: string
}) {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) {
            onFinish();
            return null;
        }

        return {
            h: Math.floor(difference / (1000 * 60 * 60 * 24)),
            j: Math.floor((difference / (1000 * 60 * 60)) % 24),
            m: Math.floor((difference / 1000 / 60) % 60),
            d: Math.floor((difference / 1000) % 60)
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

    const formattedTarget = new Date(targetDate).toLocaleString("id-ID", { 
        day: 'numeric', 
        month: 'short', 
        year: small ? undefined : 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const targetDateElement = showTarget && (
        <Typography 
            variant="caption" 
            sx={{ 
                display: 'block', 
                mb: small ? 0.5 : 1, 
                opacity: 0.4, 
                fontWeight: 700, 
                fontSize: small ? '0.6rem' : '0.7rem',
                textAlign: small ? 'left' : 'center',
                color: targetLabel === "DIBUKA" ? "#3498db" : "inherit"
            }}
        >
            {targetLabel}: {formattedTarget}
        </Typography>
    );

    if (small) {
        return (
            <Box>
                {targetDateElement}
                <Stack direction="row" spacing={1} alignItems="baseline">
                    {Object.entries(timeLeft).map(([label, value], index, arr) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#3498db', lineHeight: 1 }}>
                                {String(value).padStart(2, '0')}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', textTransform: 'lowercase', opacity: 0.5, fontWeight: 700 }}>
                                {label}
                            </Typography>
                            {index < arr.length - 1 && (
                                <Typography variant="caption" sx={{ opacity: 0.2, mx: 0.2 }}>•</Typography>
                            )}
                        </Box>
                    ))}
                </Stack>
            </Box>
        );
    }

    return (
        <Box>
            {targetDateElement}
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
        </Box>
    );
}
