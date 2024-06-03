import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { plugin as mdPlugin, Mode } from "vite-plugin-markdown";
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader(),
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
