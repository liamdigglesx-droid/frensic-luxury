import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (id.includes('@radix-ui')) return 'radix';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@paystack')) return 'paystack';
          if (id.includes('@base44')) return 'base44';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('date-fns')) return 'date';
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    ...(process.env.VERCEL || process.env.NODE_ENV === 'production' ? [] : [base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    })]),
    react(),
    {
      name: 'spa-route-fallbacks',
      apply: 'build',
      closeBundle() {
        if (process.env.VERCEL) return
        copyFileSync('dist/index.html', 'dist/404.html')
        writeFileSync('dist/.htaccess', `<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteBase /\nRewriteRule ^index\\.html$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]\n</IfModule>\n`)
      }
    },
  ]
});
