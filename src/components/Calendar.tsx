import { Badge, Box, Paper } from '@mui/material';
import { StaticDatePicker, PickersDay } from '@mui/x-date-pickers';
import type { PickersDayProps } from '@mui/x-date-pickers';
import type { Slot } from '../types';
import { parseISO, startOfDay, format } from 'date-fns';
import { useMemo } from 'react';

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

  const slotMap = useMemo(() => {
    const map = new Map<string, Slot[]>();
    slots.forEach(s => {
      const existing = map.get(s.date) || [];
      map.set(s.date, [...existing, s]);
    });
    return map;
  }, [slots]);

  const renderDay = (props: PickersDayProps) => {
    const { day, ...other } = props;
    if (!day) return <PickersDay {...other} day={day} />;

    const dateStr = format(day, "yyyy-MM-dd");
    const daySlots = slotMap.get(dateStr) || [];

    let dotColor = "transparent";
    if (daySlots.length > 0) {
      const allFull = daySlots.every(s => s.count === s.quota);
      if (allFull) {
        dotColor = "#e74c3c";
      } else {
        const totalCount = daySlots.reduce((sum, s) => sum + s.count, 0);
        const totalQuota = daySlots.reduce((sum, s) => sum + s.quota, 0);
        const ratio = totalQuota > 0 ? totalCount / totalQuota : 0;
        if (ratio >= 0.8) {
          dotColor = "#f39c12";
        } else {
          dotColor = "#2ecc71";
        }
      }
    }

    return (
      <Badge
        key={day.toString()}
        overlap="circular"
        badgeContent={
          daySlots.length > 0 ? (
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
              backgroundColor: "#d4af37 !important",
              color: "#ffffff !important",
              boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)",
            },
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.05) !important",
            },
            "&.MuiPickersDay-today": {
              borderColor: "rgba(212, 175, 55, 0.5) !important",
            },
          }}
        />
      </Badge>
    );
  };

  const shouldDisableDate = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const daySlots = slotMap.get(dateStr) || [];
    if (daySlots.length === 0) return true;
    return daySlots.every(s => s.count >= s.quota);
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

      <Box sx={{ minHeight: "28px" }} />
    </Box>
  );
}
