import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import CountdownTimer from "./CountdownTimer";

interface Props {
  startAt: string | null;
  endAt: string | null;
  isAdmin?: boolean;
  small?: boolean;
  align?: "center" | "flex-start";
  onStatusChange?: () => void;
}

export default function RegistrationStatus({
  startAt,
  endAt,
  isAdmin = false,
  small = false,
  align = "center",
  onStatusChange
}: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const nextNow = new Date();
      setNow(nextNow);
      
      // If we just crossed a boundary, trigger parent refresh
      if (onStatusChange) {
          const start = startAt ? new Date(startAt) : null;
          const end = endAt ? new Date(endAt) : null;
          
          if ((start && Math.abs(nextNow.getTime() - start.getTime()) < 1000) || 
              (end && Math.abs(nextNow.getTime() - end.getTime()) < 1000)) {
              onStatusChange();
          }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startAt, endAt, onStatusChange]);

  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;

  const isUpcoming = start && now < start;
  const isActive = (!start || now >= start) && end && now < end;
  const isEnded = end && now >= end;

  if (!isUpcoming && !isActive && !isEnded) return null;

  // Colors
  const UPCOMING_COLOR = "#f39c12"; // Orange/Yellow
  const ACTIVE_COLOR = "#e74c3c";   // Red
  const ENDED_COLOR = "rgba(255,255,255,0.2)";

  if (isEnded && !isAdmin) {
    return (
      <Box sx={{ textAlign: align, py: small ? 0 : 2 }}>
        <Typography variant="subtitle2" sx={{ color: ENDED_COLOR, fontWeight: 700 }}>
          PENDAFTARAN SELESAI
        </Typography>
        <Typography variant="caption" sx={{ color: ENDED_COLOR, opacity: 0.8 }}>
          Terima kasih atas partisipasi Anda
        </Typography>
      </Box>
    );
  }

  const targetDate = isUpcoming ? startAt! : endAt!;
  const label = isUpcoming ? "PENDAFTARAN DIBUKA PADA" : "PENDAFTARAN DITUTUP PADA";
  const color = isUpcoming ? UPCOMING_COLOR : ACTIVE_COLOR;

  return (
    <Box 
      sx={{ 
        width: align === 'center' ? '100%' : 'auto',
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        mt: small ? 2 : 0
      }}
    >
      <Box 
        sx={{ 
          px: small ? 2 : 3,
          py: small ? 1.5 : 2,
          borderRadius: "12px", 
          bgcolor: `${color}08`, // 8% opacity
          border: `1px solid ${color}20`, // 20% opacity
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.5s ease'
        }}
      >
        <CountdownTimer
          targetDate={targetDate}
          onFinish={() => setNow(new Date())}
          small={small}
          showTarget
          targetLabel={label}
          align="center"
          color={color}
        />
      </Box>
    </Box>
  );
}
