import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// `base` padrão '/' para compatibilidade com Render Static Site.
// Para publicar sob um prefixo (ex.: GitHub Pages em /dw-II-animepowers/)
// defina VITE_BASE_PATH no ambiente.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
  }
})
