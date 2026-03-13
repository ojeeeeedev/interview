import { useState, useEffect, useCallback } from "react";
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
  small = false,
  align = "center",
  onStatusChange
}: Props) {
  const [now, setNow] = useState(new Date());

  // Colors
  const UPCOMING_COLOR = "#f39c12"; // Orange/Yellow
  const ACTIVE_COLOR = "#e74c3c";   // Red

  // Use a slower interval (1 minute) for general freshness, 
  // as the CountdownTimer handles precise second-by-second updates.
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  const handleTimerFinish = useCallback(() => {
    const nextNow = new Date();
    setNow(nextNow);
    if (onStatusChange) onStatusChange();
  }, [onStatusChange]);

  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;

  const isUpcoming = start && now < start;
  const isActive = (!start || now >= start) && end && now < end;
  const isEnded = end && now >= end;

  // If no registration rules defined, don't show status
  if (!isUpcoming && !isActive && !isEnded) return null;

  // Always show "SELESAI" if ended, regardless of admin status. 
  // Admin can still access the group via separate logic in parent.
  if (isEnded) {
    return (
      <Box sx={{ textAlign: align, py: small ? 0 : 2 }}>
        <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>
          PENDAFTARAN SELESAI
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.2)", opacity: 0.8 }}>
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
        width: '100%',
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
          onFinish={handleTimerFinish}
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
