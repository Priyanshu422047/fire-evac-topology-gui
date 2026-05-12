import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listens on all local IPs (equivalent to 0.0.0.0)
    strictPort: true, // Prevents Vite from silently switching to 5174 if 5173 is busy. This prevents HMR mismatch!
    // Narrow what chokidar watches so random touches under the repo don’t trigger HMR.
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/dist-ssr/**',
      ],
    },
    // file changes and triggers full HMR reloads (feels like the page "refreshing").
    hmr: false,
  },
})
