import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ViteDotNetPlugin from 'vite-dotnet'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    ViteDotNetPlugin('src/main.tsx', 'root'),
  ],
  server: {
    // При открытии приложения на Vite (5173) запросы `/api/*` должны попадать
    // в ASP.NET Core. На хосте 5130 прокси не используется.
    proxy: {
      '/api': {
        target: 'http://localhost:5130',
        changeOrigin: false,
      },
    },
  },
})
