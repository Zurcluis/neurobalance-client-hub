import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Chunks estáveis para cache: core React, gráficos e libs de
        // documentos (PDF/Excel). Separam xlsx de jspdf porque nunca são
        // necessários em simultâneo (import/parse vs. export).
        // Forma função + exclusão do preload-helper: com object-form o
        // helper do Vite era colocado num chunk manual, tornando-o
        // carregado no arranque (eager load de ~1 MB).
        manualChunks(id) {
          // O helper de preload tem de ficar num chunk estático (vendor);
          // se cair num chunk async, esse chunk passa a ser eager-loaded.
          if (id.includes('vite/preload-helper') || id.includes('vite/modulepreload-polyfill')) {
            return 'vendor';
          }
          if (!id.includes('node_modules')) return;
          // NOTA: recharts fica de fora — Rollup já gera chunks async próprios
          // para as páginas de gráficos; um chunk manual "charts" partilha
          // módulos com o entry (clsx/interop) e é içado para o arranque.
          if (/[\\/]node_modules[\\/](jspdf|jspdf-autotable|html2canvas|fflate)[\\/]/.test(id)) {
            return 'docs-pdf';
          }
          if (/[\\/]node_modules[\\/](xlsx|codepage)[\\/]/.test(id)) {
            return 'docs-sheets';
          }
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler|@remix-run)[\\/]/.test(id)) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
