import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    // basicSsl() // Generates and uses a local SSL certificate automatically
  ],
  server: {
    host: true, // Exposes the server to your local network (0.0.0.0)
    port: 5173,
    allowedHosts: true,
  }
});
