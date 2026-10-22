import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// `base` precisa bater com o caminho em que o site é publicado.
// Padrão mantém o histórico (/poderesanime/); para publicar em outro prefixo
// defina VITE_BASE_PATH no ambiente, ex.: VITE_BASE_PATH=/dw-II-animepowers/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/poderesanime/',
  }
})
