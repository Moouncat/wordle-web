import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa' 

// https://vite.dev/config/
export default defineConfig({
  base: "/wordle-web/",
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      includeAssets: ['favicon.ico'],
      injectRegister: 'auto',
      manifest: {
        name: 'Wordle Web',
        short_name: 'Wordle',
        description: 'Web based wordle made in vue as PWA',
        theme_color: '#1666BA',
        icons: [
          {
            src: '/wordle192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/wordle512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
