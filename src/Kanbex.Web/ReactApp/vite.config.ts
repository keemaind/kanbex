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
})
