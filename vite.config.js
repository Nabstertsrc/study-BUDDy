import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/study-BUDDy/',
  logLevel: 'error',
  // Inject keys directly for stability — ensures they survive deployment where .env loading might be inconsistent
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://bejdomlxsaqoxzwlbloe.supabase.co"),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlamRvbWx4c2Fxb3h6d2xibG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Nzk0NTIsImV4cCI6MjA3ODU1NTQ1Mn0.f0X9LCHhAnn8NsoMbl9Y6E9QVD3zhFCKrfCQ-QbZgBQ"),
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify("AIzaSyA3yJJAN99Qe2XdbGfG5_bjFaroR6gyYps"),
    'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify("bookster-f0347.firebaseapp.com"),
    'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify("https://bookster-f0347.firebaseio.com"),
    'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify("bookster-f0347"),
    'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify("bookster-f0347.firebasestorage.app"),
    'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify("75991163074"),
    'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify("1:75991163074:web:616131ab29753bf13c5b5b"),
  },
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});