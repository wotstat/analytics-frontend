import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { plugin as mdPlugin, Mode } from 'vite-plugin-markdown'
import svgLoader from 'vite-svg-loader'
import { alert } from '@mdit/plugin-alert'
import { attrs } from '@mdit/plugin-attrs'
import { align } from '@mdit/plugin-align'
import MarkdownIt from 'markdown-it'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'
import { metaDefinitionsPlugin } from './vitePlugins/metaDefinitions/metaDefinitions.ts'

const projectRoot = fileURLToPath(new URL('./', import.meta.url))
const common = {
  envDir: projectRoot,
  define: { 'import.meta.env.VITE_META_RENDERER': false },
  resolve: { alias: { '@': resolve(projectRoot, 'src') } }
}

const svgLoaderConfig: Parameters<typeof svgLoader>[0] = {
  svgoConfig: {
    plugins: ['removeDimensions']
  }
}

const mainConfig: UserConfig = {
  ...common,
  plugins: [
    metaDefinitionsPlugin(projectRoot),
    vue(),
    vueDevTools(),
    svgLoader(svgLoaderConfig),
    mdPlugin({
      mode: [Mode.VUE],
      markdownIt: new MarkdownIt({ html: true })
        .use(alert)
        .use(attrs)
        .use(align)
    }),
    visualizer({
      filename: 'bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ]
}

const metaRendererConfig: UserConfig = {
  ...common,
  define: { 'import.meta.env.VITE_META_RENDERER': true },
  root: resolve(projectRoot, 'src/meta/renderer'),
  publicDir: false,
  plugins: [metaDefinitionsPlugin(projectRoot), vue(), svgLoader(svgLoaderConfig)],
  build: {
    outDir: resolve(projectRoot, 'dist-meta/client'),
    emptyOutDir: true
  }
}

const metaServerConfig: UserConfig = {
  ...common,
  root: projectRoot,
  publicDir: false,
  plugins: [metaDefinitionsPlugin(projectRoot), {
    name: 'meta-server-components',
    load: id => id.endsWith('.vue') ? 'export default {}' : undefined,
  }],
  ssr: { noExternal: true },
  build: {
    ssr: resolve(projectRoot, 'src/meta/resolver.ts'),
    outDir: resolve(projectRoot, 'dist-meta'),
    emptyOutDir: false,
    rolldownOptions: {
      output: {
        format: 'esm',
        entryFileNames: 'server.mjs',
        codeSplitting: false
      }
    }
  }
}

export default defineConfig(() => {
  const target = process.env.BUILD_TARGET ?? 'main'
  if (target === 'main') return mainConfig
  if (target === 'meta-renderer') return metaRendererConfig
  if (target === 'meta-server') return metaServerConfig
  throw new Error(`Unknown BUILD_TARGET: ${target}`)
})
