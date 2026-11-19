import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Configuração do Vite - plugin do React e porta de desenvolvimento */
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});