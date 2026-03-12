import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack } from '@mui/material';

export default function CountdownTimer({ 
    targetDate, 
    onFinish, 
    small = false,
    showTarget = false,
    targetLabel = "BATAS",
    align = "center"
}: { 
    targetDate: string, 
    onFinish: () => void,
    small?: boolean,
    showTarget?: boolean,
    targetLabel?: string,
    align?: "center" | "flex-start"
}) {
    const calculateTimeLeft = useCallback(() => {
        const difference = +new Date(targetDate) - +new Date();
        if (difference <= 0) {
            onFinish();
            return null;
        }

        return {
            H: Math.floor(difference / (1000 * 60 * 60 * 24)),
            J: Math.floor((difference / (1000 * 60 * 60)) % 24),
            M: Math.floor((difference / 1000 / 60) % 60),
            D: Math.floor((difference / 1000) % 60)
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

    const labelColor = targetLabel.toUpperCase().includes("DIBUKA") ? "#3498db" : (targetLabel.toUpperCase().includes("BATAS") || targetLabel.toUpperCase().includes("DITUTUP") ? "#e74c3c" : "inherit");

    const targetDateElement = showTarget && (
        <Box sx={{ mb: small ? 1 : 1.5, textAlign: align === "flex-start" ? "left" : "center" }}>
            <Typography 
                variant="caption" 
                sx={{ 
                    display: 'block', 
                    mb: 0.8,
                    opacity: 0.6, 
                    fontWeight: 900, 
                    fontSize: small ? '0.6rem' : '0.7rem',
                    color: labelColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    lineHeight: 1
                }}
            >
                {targetLabel}
            </Typography>
            <Typography 
                variant="body2" 
                sx={{ 
                    display: 'block', 
                    fontWeight: 900, 
                    fontSize: small ? '0.8rem' : '0.95rem',
                    color: labelColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1.1
                }}
            >
                {formattedTarget}
            </Typography>
        </Box>
    );

    if (small) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
                {targetDateElement}
                <Stack direction="row" spacing={1} alignItems="baseline" justifyContent={align === "flex-start" ? "flex-start" : "center"}>
                    {Object.entries(timeLeft).map(([label, value], index, arr) => (
                        <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#3498db', lineHeight: 1 }}>
                                {String(value).padStart(2, '0')}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, fontWeight: 900 }}>
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
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }}>
                {Object.entries(timeLeft).map(([label, value]) => (
                    <Box key={label} sx={{ textAlign: 'center', minWidth: 50 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1, color: '#3498db', mb: 0.5 }}>
                            {String(value).padStart(2, '0')}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 900 }}>
                            {label}
                        </Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}
