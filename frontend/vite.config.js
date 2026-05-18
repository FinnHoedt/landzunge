import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        dispatches: 'dispatches.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://backend:3000',
    },
    watch: {
      usePolling: true,
    },
  },
})
