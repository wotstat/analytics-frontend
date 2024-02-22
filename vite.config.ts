import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { plugin as mdPlugin, Mode } from "vite-plugin-markdown";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mdPlugin({
      mode: [Mode.VUE]
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
