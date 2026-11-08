import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HFLS 「보조 계산기」 탭에 넣기 위해 /tools/pump/ 경로로 빌드
// 다시 빌드: npm ci && npm run build → dist/ 내용을 ../../public/tools/pump/ 에 복사
export default defineConfig({
  base: '/tools/pump/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
