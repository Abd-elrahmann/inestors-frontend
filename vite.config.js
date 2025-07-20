import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    fastRefresh: true
  })],
  
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false,
      port: 3001
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        timeout: 10000
      }
    }
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
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/x-data-grid', '@mui/icons-material'],
          charts: ['chart.js', 'react-chartjs-2'],
          icons: ['react-icons/md'],
          utils: ['lodash', 'date-fns'],
          api: ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false
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

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext',
    minify: true
  },

  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  }
})
