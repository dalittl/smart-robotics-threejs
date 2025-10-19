import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy local /robot.glb requests to the public R2 URL to avoid CORS during dev
    proxy: {
      // when the browser requests http://localhost:5173/robot.glb it'll be proxied
      // to your R2 bucket and returned as if it's same-origin
      '/robot.glb': {
        target: 'https://pub-63db098fc98c4445b67e76b821321f72.r2.dev',
        changeOrigin: true,
        secure: true,
        // keep the path as-is
        rewrite: (path) => path,
      },
    },
  },
})
