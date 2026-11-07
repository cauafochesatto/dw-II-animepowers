import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base` configurado para a raiz '/' para compatibilidade com Render Static Site
export default defineConfig(() => {
  return {
    plugins: [react()],
    base: '/',
  }
})
