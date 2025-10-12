import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production for security
    // Manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-admin'],
          ui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-mention'],
        },
      },
    },
  },
});
