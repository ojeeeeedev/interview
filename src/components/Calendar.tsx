import { Badge, Box, Paper, Typography } from '@mui/material';
import { StaticDatePicker, PickersDay } from '@mui/x-date-pickers';
import type { PickersDayProps } from '@mui/x-date-pickers';
import type { Slot } from '../types';
import { parseISO, startOfDay, format } from 'date-fns';
import { useMemo } from 'react';

// Use current app theme instead of local light theme
interface Props {
  slots: Slot[];
  onSelect: (date: Date | null) => void;
  selected: Date | null;
}

export default function Calendar({ slots, onSelect, selected }: Props) {
  const { minDate, maxDate } = useMemo(() => {
    if (slots.length === 0) return { minDate: undefined, maxDate: undefined };
    const dates = slots.map((s) => parseISO(s.date).getTime());
    return {
      minDate: startOfDay(new Date(Math.min(...dates))),
      maxDate: startOfDay(new Date(Math.max(...dates))),
    };
  }, [slots]);

  const getStatusColor = (slot: Slot) => {
    const ratio = slot.count / slot.quota;
    if (slot.count === slot.quota) return "#e74c3c";
    if (ratio >= 0.8) return "#f39c12";
    return "#2ecc71";
  };

  const selectionInfo = useMemo(() => {
    if (!selected) return null;
    const dateStr = format(selected, "yyyy-MM-dd");
    return slots.find((s) => s.date === dateStr);
  }, [selected, slots]);

  const renderDay = (props: PickersDayProps) => {
    const { day, ...other } = props;
    if (!day) return <PickersDay {...other} day={day} />;

    const dateStr = format(day as any, "yyyy-MM-dd");
    const slot = slots.find((s) => s.date === dateStr);

    let dotColor = "transparent";
    if (slot) {
      dotColor = getStatusColor(slot);
    }

    return (
      <Badge
        key={(day as any).toString()}
        overlap="circular"
        badgeContent={
          slot ? (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: dotColor,
                boxShadow: `0 0 8px ${dotColor}`,
              }}
            />
          ) : undefined
        }
        sx={{
          "& .MuiBadge-badge": { bottom: 6 },
        }}
      >
        <PickersDay
          {...other}
          day={day}
          sx={{
            fontWeight: 700,
            borderRadius: "10px !important",
            "&.Mui-selected": {
              backgroundColor: "#3498db !important",
              color: "#ffffff !important",
              boxShadow: "0 0 20px rgba(52, 152, 219, 0.4)",
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05) !important",
            },
            "&.MuiPickersDay-today": {
              borderColor: "rgba(52, 152, 219, 0.5) !important",
            },
          }}
        />
      </Badge>
    );
  };

  const shouldDisableDate = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const slot = slots.find((s) => s.date === dateStr);
    return !slot || slot.count >= slot.quota;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        gap: 1.5,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.02) !important",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
          backdropFilter: "blur(4px)",
        }}
      >
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={selected}
          onChange={(newValue: Date | null) => onSelect(newValue)}
          slots={{ day: renderDay }}
          shouldDisableDate={shouldDisableDate}
          minDate={minDate}
          maxDate={maxDate}
          sx={{
            bgcolor: "transparent",
            width: "100%",
            "& .MuiPickersLayout-root": {
              bgcolor: "transparent",
              minWidth: "auto",
              width: "100%",
              maxWidth: "100%",
              flexDirection: "column",
            },
            "& .MuiPickersLayout-contentWrapper": {
              bgcolor: "transparent",
              width: "100%",
              maxWidth: "100%",
              display: "flex",
              justifyContent: "center",
            },
            "& .MuiDateCalendar-root": {
              bgcolor: "transparent",
              width: "100%",
              maxWidth: { xs: "280px", sm: "320px" },
              height: "auto",
              minHeight: { xs: "280px", sm: "320px" },
            },
            "& .MuiPickersDay-root": {
              width: { xs: 32, sm: 38 },
              height: { xs: 32, sm: 38 },
              fontSize: "0.85rem",
              color: "#ffffff",
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.15)",
              },
            },
            "& .MuiDayCalendar-weekDayLabel": {
              width: { xs: 32, sm: 38 },
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "rgba(255, 255, 255, 0.4)",
            },
            "& .MuiPickersCalendarHeader-root": {
              px: 3,
              pt: 2,
              mb: 0,
              color: "#ffffff",
              "& .MuiTypography-root": { fontWeight: 800 },
              "& .MuiIconButton-root": { color: "#ffffff" },
            },
            "& .MuiPickersLayout-actionBar": { display: "none" },
            "& .MuiPickersToolbar-root": { display: "none" },
          }}
        />
      </Paper>

      <Box sx={{ minHeight: "28px" }}>
        {selectionInfo && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              bgcolor: "rgba(52, 152, 219, 0.1)",
              px: 2.5,
              py: 0.75,
              borderRadius: "50px",
              border: `1px solid rgba(52, 152, 219, 0.3)`,
              animation: "fadeIn 0.3s ease",
              "@keyframes fadeIn": {
                from: { opacity: 0, transform: "translateY(5px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: getStatusColor(selectionInfo),
                boxShadow: `0 0 8px ${getStatusColor(selectionInfo)}`,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              {selectionInfo.quota - selectionInfo.count} slot tersedia
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
