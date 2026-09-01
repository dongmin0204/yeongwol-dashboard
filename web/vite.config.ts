import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Vercel은 루트 도메인, GitHub Pages는 /yeongwol-dashboard/ 하위 경로
  base: process.env.VERCEL ? '/' : '/yeongwol-dashboard/',
  plugins: [react()],
})
