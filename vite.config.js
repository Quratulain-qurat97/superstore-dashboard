import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' makes every asset path relative, so the built app also works when it is
// opened from disk (file://) inside a future Electron or Tauri window.
export default defineConfig({
  base: './',
  plugins: [react()],
});
