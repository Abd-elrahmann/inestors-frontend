import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    fastRefresh: true
  })],
  
  server: {
    port: 3000,
    host: true,
  },

  build: {
    target: 'esnext',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'axios']
        }
      }
    },
    chunkSizeWarningLimit: 2000,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-icons/md',
      '@mui/material',
      '@mui/x-data-grid',
      '@mui/icons-material',
      'chart.js',
      'react-chartjs-2',
      'lodash',
      'date-fns',
    ],
    force: false
  },
  
})
