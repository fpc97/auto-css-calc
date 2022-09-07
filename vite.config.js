import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: '/calc-generator/',
  plugins: [
    VitePWA({ registerType: 'autoUpdate' })
  ]
})