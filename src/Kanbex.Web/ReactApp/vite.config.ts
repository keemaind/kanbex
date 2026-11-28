import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import ViteDotNetPlugin from 'vite-dotnet'

// Каноничная версия программы — <Version> в корневом Directory.Build.props
// (его же подхватывает MSBuild). Значение парсится и вшивается в бандл.
const buildProps = readFileSync(new URL('../../../Directory.Build.props', import.meta.url), 'utf-8')
const programVersion = /<Version>([^<]+)<\/Version>/.exec(buildProps)?.[1] ?? '0.0.0'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    ViteDotNetPlugin('src/main.tsx', 'root'),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(programVersion),
  },
  server: {
    // При открытии приложения на Vite (5173) запросы `/api/*` и аватары
    // `/uploads/*` должны попадать в ASP.NET Core. На хосте 5130 прокси
    // не используется.
    proxy: {
      '/api': {
        target: 'http://localhost:5130',
        changeOrigin: false,
      },
      '/uploads': {
        target: 'http://localhost:5130',
        changeOrigin: false,
      },
    },
  },
})
