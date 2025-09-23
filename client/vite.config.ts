import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production',
  },
  server: {
    host: mode === 'production' ? '0.0.0.0' : 'localhost',
    port: 5173,
  },
  preview: {
    host: mode === 'production' ? '0.0.0.0' : 'localhost',
    port: 5173,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}))
