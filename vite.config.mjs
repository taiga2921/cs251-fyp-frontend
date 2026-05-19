import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

import {
  buildNavigateFallbackAllowlist,
  buildNavigateFallbackDenylist,
  buildRuntimeCaching
} from './pwa/workbox-runtime-caching.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, 'src');
const REACT_PKG = path.resolve(__dirname, 'node_modules/react');
const REACT_DOM_PKG = path.resolve(__dirname, 'node_modules/react-dom');
const CONFIG_CONTEXT_FILE = path.resolve(__dirname, 'src/contexts/ConfigContext.jsx');
const APP_CONFIG_FILE = path.resolve(__dirname, 'src/config.js');

/** Mirrors jsconfig `"baseUrl": "src"` when vite-jsconfig-paths skips ids with no importer (Vite 7 prod graph). */
function jsconfigSrcBaseUrlFallback() {
  const tryExtensions = ['', '.jsx', '.js', '.tsx', '.ts', '.mjs', '.scss', '.sass', '.css'];

  return {
    name: 'jsconfig-src-baseurl-fallback',
    enforce: 'pre',
    async resolveId(id, importer, options) {
      const bare = id.replace(/\?.*$/, '');
      if (!bare || bare.startsWith('.') || bare.startsWith('\0') || path.isAbsolute(bare)) {
        return;
      }

      if (
        bare === 'react' ||
        bare === 'react-dom' ||
        bare === 'scheduler' ||
        bare.startsWith('react/') ||
        bare.startsWith('react-dom/')
      ) {
        return undefined;
      }

      const resolutionImporter = importer ?? path.join(SRC_DIR, 'index.jsx');

      const resolved = await this.resolve(bare, resolutionImporter, { ...options, skipSelf: true }).catch(() => null);
      if (resolved?.id && !resolved.external) {
        return normalizePath(resolved.id);
      }

      const candidate = path.join(SRC_DIR, bare);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return normalizePath(candidate);
      }
      for (const ext of tryExtensions) {
        const withExt = candidate + ext;
        if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
          return normalizePath(withExt);
        }
      }
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        for (const ext of tryExtensions) {
          const indexFile = path.join(candidate, `index${ext}`);
          if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
            return normalizePath(indexFile);
          }
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const PORT = 3000;

  return {
    server: {
      open: true,
      port: PORT,
      host: true
    },
    build: {
      chunkSizeWarningLimit: 1600
    },
    preview: {
      open: true,
      host: true
    },
    optimizeDeps: {
      dedupe: ['react', 'react-dom'],
      include: ['react', 'react-dom', 'react/jsx-runtime']
    },
    define: {
      global: 'window'
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'scheduler'],
      alias: {
        react: REACT_PKG,
        'react-dom': REACT_DOM_PKG,
        'react/jsx-runtime': path.join(REACT_PKG, 'jsx-runtime.js'),
        'react/jsx-dev-runtime': path.join(REACT_PKG, 'jsx-dev-runtime.js'),
        'contexts/ConfigContext': CONFIG_CONTEXT_FILE,
        config: APP_CONFIG_FILE,
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs'
      }
    },
    base: API_URL,
    plugins: [
      jsconfigSrcBaseUrlFallback(),
      react(),
      jsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'AI Surveillance Patrol System',
          short_name: 'Surveillance',
          description: 'AI Surveillance Patrol System',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          theme_color: '#111827',
          background_color: '#ffffff',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // App shell offline fallback for SPA navigations (React Router basename = Vite `base`).
          navigateFallback: 'index.html',
          navigateFallbackDenylist: buildNavigateFallbackDenylist(API_BASE_URL),
          navigateFallbackAllowlist: buildNavigateFallbackAllowlist(API_URL),
          // POST/PUT/PATCH/DELETE are intentionally omitted — see pwa/workbox-runtime-caching.mjs.
          runtimeCaching: buildRuntimeCaching(API_BASE_URL),
          importScripts: ['push-handlers.js']
        }
      })
    ]
  };
});
