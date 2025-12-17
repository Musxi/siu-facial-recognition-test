import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Fix: Increase chunk size limit to suppress warning for large libraries like Recharts
    // 修复：提高分块大小限制，消除 Recharts 等大库的警告
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        // Optimization: Split code into separate files for better caching
        // 优化：将代码拆分为独立文件以获得更好的缓存效果
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'utils': ['uuid']
        }
      }
    }
  }
});