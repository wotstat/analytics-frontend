import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sys } from 'typescript'
import { normalizePath, type Plugin } from 'vite'
import { findMetaExports } from './findMetaExports.ts'

const moduleId = 'virtual:meta-definitions'
const resolvedModuleId = `\0${moduleId}`

export const metaDefinitionsPlugin = (projectRoot: string): Plugin => {
  const sourceRoot = normalizePath(resolve(projectRoot, 'src'))
  const isSourceFile = (file: string) => file.startsWith(`${sourceRoot}/`)
    && file.endsWith('.ts') && !file.endsWith('.d.ts')

  return {
    name: 'meta-definitions',
    configureServer: server => {
      server.watcher.add(sourceRoot)
    },
    resolveId: id => id === moduleId ? resolvedModuleId : undefined,
    load: async id => {
      if (id !== resolvedModuleId) return
      const files = sys.readDirectory(sourceRoot, ['.ts'], ['**/*.d.ts']).sort()
      const modules = await Promise.all(files.map(async file => ({
        file: normalizePath(file),
        exports: findMetaExports(file, await readFile(file, 'utf8'), sourceRoot),
      })))

      const imports: string[] = []
      const definitions: string[] = []
      for (const module of modules) {
        for (const name of module.exports) {
          const local = `definition${definitions.length}`
          imports.push(`import { ${JSON.stringify(name)} as ${local} } from ${JSON.stringify(module.file)}`)
          definitions.push(local)
        }
      }
      return `${imports.join('\n')}\nexport default [${definitions.join(', ')}]\n`
    },
    async hotUpdate({ type, file, read, modules, timestamp }) {
      if (!isSourceFile(file)) return
      const graph = this.environment.moduleGraph
      const catalog = graph.getModuleById(resolvedModuleId)
      if (!catalog) return

      const wasDefinition = [...catalog.importedModules].some(module => module.file === file)
      const hasDefinitions = type !== 'delete' && findMetaExports(file, await read(), sourceRoot).length > 0
      if (!wasDefinition && !hasDefinitions) return

      const invalidated = new Set<typeof catalog>()
      for (const module of [...modules, catalog])
        graph.invalidateModule(module, invalidated, timestamp, true)
      this.environment.hot.send({ type: 'full-reload' })
      return []
    },
  }
}
