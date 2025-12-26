import { defineConfig, loadEnv } from 'vite' // 👈 Import loadEnv
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 1. Load env file based on `mode` in the current directory
  // This reads your .env file and puts the values into `env`
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          // 👇 NOW IT IS SAFE: Uses the variable from .env
          target: env.VITE_API_URL, 
          changeOrigin: true,
          secure: false,
        },
        '/data': {
            target: env.VITE_API_URL,
            changeOrigin: true,
            secure: false,
        }
      },
    },
  }
})