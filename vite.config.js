import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],
  base: './',
  build: {
    // Single-file mode: inline everything into index.html
    cssCodeSplit: false,
    assetsInlineLimit: Infinity,
    rollupOptions: {
      output: {
        // Single file — no chunks
        inlineDynamicImports: true,
      },
    },
  },
})
