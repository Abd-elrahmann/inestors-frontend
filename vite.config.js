import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🚀 إعدادات Vite محسّنة للأداء العالي
export default defineConfig({
  plugins: [react({
    // ⚡ تحسين React Fast Refresh
    fastRefresh: true
  })],
  
  server: {
    port: 3000,
    host: true,
    // 🔥 تحسين HMR
    hmr: {
      overlay: false,
      port: 3001
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // ⚡ تحسين البروكسي
        timeout: 10000
      }
    }
  },

  // 🎯 تحسين البناء
  build: {
    target: 'esnext',
    minify: 'terser',
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
    // 🚀 تحسين الضغط
    cssCodeSplit: true,
    sourcemap: false
  },
  
  // 📦 تحسين التبعيات
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
      'date-fns'
    ],
    // ⚡ تحسين الكاش
    force: false
  },
  
  // 🔧 إعدادات إضافية للأداء
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext',
    minify: true
  },
  
  // 🎨 تحسين CSS
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  }
})
