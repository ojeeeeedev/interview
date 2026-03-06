import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React Core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }
          // PDF, CSV and Image export tools
          if (id.includes('jspdf') || id.includes('papaparse') || id.includes('html-to-image')) {
            return 'export-tools';
          }
          // Large UI Library (MUI) and its core dependencies
          if (id.includes('@mui/material') || id.includes('@emotion') || id.includes('@mui/system')) {
            return 'vendor-mui';
          }
          // Other MUI specific extras
          if (id.includes('@mui/icons-material') || id.includes('@mui/x-date-pickers')) {
            return 'mui-extras';
          }
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // Framer motion
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800,
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', 'lucide-react'],
  }
})
