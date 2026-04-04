import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Repo kökündeki .env + build ortamındaki process.env (Render/Vercel panelindeki VITE_* dahil)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), 'VITE_');
  
  return {
    plugins: [react()],
    envDir: '../',
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      // Make environment variables available in the client-side code
      'import.meta.env': {
        ...env,
        VITE_FIREBASE_API_KEY: JSON.stringify(env.VITE_FIREBASE_API_KEY),
        VITE_FIREBASE_AUTH_DOMAIN: JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
        VITE_FIREBASE_PROJECT_ID: JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
        VITE_FIREBASE_STORAGE_BUCKET: JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
        VITE_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
        VITE_FIREBASE_APP_ID: JSON.stringify(env.VITE_FIREBASE_APP_ID),
        VITE_API_BASE_URL: JSON.stringify(env.VITE_API_BASE_URL ?? ''),
      },
    },
  };
});
