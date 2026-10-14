import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {                                    // ← new
    proxy: {                                   // ← new
      '/api': 'http://localhost:8000'          // ← new
    }                                          // ← new
  }                                            // ← new
})