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
            src: 'public/wordle192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'public/wordle512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: "public/screenshot-desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
            label: "Home screen showing wordle game"
          },
          {
            src: "public/screenshot-mobile.png",
            sizes: "1080x1920",
            type: "image/png",
            label: "Home screen showing wordle game with title"
          },
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
