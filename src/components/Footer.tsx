import { Box, Container, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 6, 
        mt: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        bgcolor: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="body2" 
          align="center" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.4)', 
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}
        >
          Subseksi Katekumen Dewasa - Paroki St. Petrus, Bandung
        </Typography>
      </Container>
    </Box>
  );
}
