import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative : l'app fonctionne aussi bien à la racine d'un domaine
// que dans un sous-dossier (ex. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
});
