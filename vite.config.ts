
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Provide fallbacks for process.env to work with Vite
    'import.meta.env.VITE_DB_API_URL': JSON.stringify(process.env.VITE_DB_API_URL || 'http://localhost:3001/api'),
    'import.meta.env.VITE_USE_REAL_API': JSON.stringify(process.env.VITE_USE_REAL_API || false),
  },
}));
