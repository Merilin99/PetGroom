import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Ό,τι ξεκινά με /api προωθείται στο backend - έτσι δεν χρειάζεται CORS στο development.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
