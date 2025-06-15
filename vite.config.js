import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.dfs.land',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
      }
    }
  },
  base: '/cat/', // 与仓库名一致，用于 GitHub Pages
}) 