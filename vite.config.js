import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Multi-page build: every existing URL of the live site keeps working
// (index.html, about.html, apply.html, gallery.html, calendar.html) and
// the AMS ships as its own single-page app at ams.html.
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        apply: resolve(__dirname, 'apply.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        calendar: resolve(__dirname, 'calendar.html'),
        ams: resolve(__dirname, 'ams.html'),
      },
    },
  },
});
