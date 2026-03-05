import { Badge, Box, Paper, Typography, ThemeProvider, createTheme } from '@mui/material';
import { StaticDatePicker, PickersDay } from '@mui/x-date-pickers';
import type { PickersDayProps } from '@mui/x-date-pickers';
import type { Slot } from '../types';
import { parseISO, startOfDay, format } from 'date-fns';
import { useMemo } from 'react';

// Create a local light theme for the calendar widget only
const lightCalendarTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3498db',
        },
        text: {
            primary: '#2c3e50',
            secondary: '#7f8c8d',
        }
    }
});

interface Props {
    slots: Slot[];
    onSelect: (date: Date | null) => void;
    selected: Date | null;
}

export default function Calendar({ slots, onSelect, selected }: Props) {
    const { minDate, maxDate } = useMemo(() => {
        if (slots.length === 0) return { minDate: undefined, maxDate: undefined };
        const dates = slots.map(s => parseISO(s.date).getTime());
        return {
            minDate: startOfDay(new Date(Math.min(...dates))),
            maxDate: startOfDay(new Date(Math.max(...dates)))
        };
    }, [slots]);

    const getStatusColor = (slot: Slot) => {
        const ratio = slot.count / slot.quota;
        if (slot.count === slot.quota) return '#e74c3c';
        if (ratio >= 0.8) return '#f39c12';
        return '#2ecc71';
    };

    const selectionInfo = useMemo(() => {
        if (!selected) return null;
        const dateStr = format(selected, 'yyyy-MM-dd');
        return slots.find(s => s.date === dateStr);
    }, [selected, slots]);

    const renderDay = (props: PickersDayProps) => {
        const { day, ...other } = props;
        if (!day) return <PickersDay {...other} day={day} />;

        const dateStr = format(day as any, 'yyyy-MM-dd');
        const slot = slots.find(s => s.date === dateStr);

        let dotColor = 'transparent';
        if (slot) {
            dotColor = getStatusColor(slot);
        }

        return (
            <Badge
                key={(day as any).toString()}
                overlap="circular"
                badgeContent={slot ? <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: dotColor,
                    boxShadow: `0 0 8px ${dotColor}`
                }} /> : undefined}
                sx={{
                    '& .MuiBadge-badge': { bottom: 8 }
                }}
            >
                <PickersDay {...other} day={day} sx={{
                    fontWeight: 700,
                    borderRadius: '8px !important',
                    '&.Mui-selected': {
                        backgroundColor: '#3498db !important',
                        color: '#ffffff !important'
                    }
                }} />
            </Badge>
        );
    };

    const shouldDisableDate = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const slot = slots.find(s => s.date === dateStr);
        return !slot || slot.count >= slot.quota;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1.5 }}>
            <ThemeProvider theme={lightCalendarTheme}>
                <Paper elevation={0} sx={{ 
                    p: 0.5,
                    borderRadius: '12px',
                    background: '#ffffff', // Solid white
                    border: '1px solid #bdc3c7',
                    width: '100%', // Match namefield container
                    display: 'flex',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    // Force all text to be dark inside this specific container
                    '& *': { color: '#2c3e50 !important' },
                    // Exception for white text on selected blue background
                    '& .Mui-selected, & .Mui-selected *': { color: '#ffffff !important' },
                    // Exception for disabled dates (muted grey)
                    '& .Mui-disabled, & .Mui-disabled *': { color: '#bdc3c7 !important' }
                }}>
                    <StaticDatePicker
                        displayStaticWrapperAs="desktop"
                        value={selected}
                        onChange={(newValue: Date | null) => onSelect(newValue)}
                        slots={{ day: renderDay }}
                        shouldDisableDate={shouldDisableDate}
                        minDate={minDate}
                        maxDate={maxDate}
                        sx={{
                            bgcolor: 'transparent',
                            width: '100%',
                            '& .MuiPickersLayout-root': { 
                                bgcolor: 'transparent', 
                                minWidth: 'auto',
                                width: '100%',
                                maxWidth: '100%' 
                            },
                            '& .MuiPickersLayout-contentWrapper': { 
                                bgcolor: 'transparent',
                                width: '100%',
                                maxWidth: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            },
                            '& .MuiDateCalendar-root': { 
                                bgcolor: 'transparent', 
                                width: '100%',
                                maxWidth: { xs: '260px', sm: '300px' }, // Slightly smaller to prevent scroll
                                height: 'auto',
                                minHeight: { xs: '260px', sm: '300px' }
                            },
                            '& .MuiPickersDay-root': {
                                width: { xs: 30, sm: 36 },
                                height: { xs: 30, sm: 36 },
                                fontSize: '0.75rem',
                                margin: '1px' // Reduce horizontal gap
                            },
                            '& .MuiDayCalendar-header': {
                                '& .MuiTypography-root': {
                                    width: { xs: 30, sm: 36 },
                                    fontSize: '0.7rem'
                                }
                            },
                            '& .MuiPickersLayout-actionBar': { display: 'none' },
                            '& .MuiPickersToolbar-root': { display: 'none' }
                        }}
                    />
                </Paper>
            </ThemeProvider>

            {/* Selection Prompt remains white for the black background */}
            <Box sx={{ minHeight: '28px' }}>
                {selectionInfo && (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.05)', 
                        px: 2, 
                        py: 0.5, 
                        borderRadius: '50px',
                        border: `1px solid ${getStatusColor(selectionInfo)}80` 
                    }}>
                        <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: getStatusColor(selectionInfo),
                            boxShadow: `0 0 8px ${getStatusColor(selectionInfo)}`
                        }} />
                        <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Tersedia: {selectionInfo.quota - selectionInfo.count} slot tersisa
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
