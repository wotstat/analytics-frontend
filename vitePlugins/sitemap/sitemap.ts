import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import type { Plugin } from 'vite'
import { loadWidgetPaths } from './widgetPaths.ts'

const unwrapExpression = (expression: ts.Expression): ts.Expression => {
  while (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
    || ts.isTypeAssertionExpression(expression) || ts.isSatisfiesExpression(expression)) {
    expression = expression.expression
  }
  return expression
}

const getProperty = (object: ts.ObjectLiteralExpression, name: string) => {
  for (const property of object.properties) {
    if (ts.isPropertyAssignment(property)
      && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
      && property.name.text === name) return property.initializer
  }
}

const collectPaths = (expression: ts.Expression, paths: Set<string>, parent = '') => {
  const routes = unwrapExpression(expression)
  if (!ts.isArrayLiteralExpression(routes)) throw new Error('Sitemap: routes and children must be literal arrays')

  for (const entry of routes.elements) {
    const route = unwrapExpression(entry)
    if (!ts.isObjectLiteralExpression(route)) throw new Error('Sitemap: routes must be literal objects')

    const meta = getProperty(route, 'meta')
    if (meta && ts.isObjectLiteralExpression(meta)
      && getProperty(meta, 'sitemap')?.kind === ts.SyntaxKind.FalseKeyword) continue

    const path = getProperty(route, 'path')
    if (!path || !ts.isStringLiteralLike(path)) throw new Error('Sitemap: route path must be a string literal')

    const fullPath = path.text.startsWith('/') ? path.text : `${parent.replace(/\/$/, '')}/${path.text}`
    // Optional parameters have a concrete URL with no value, e.g. /widgets/:widget* → /widgets.
    const staticPath = fullPath.replace(/\/:[a-zA-Z0-9_]+[?*](?=\/|$)/g, '')
    if (!/[:*()]/.test(staticPath) && !getProperty(route, 'redirect'))
      paths.add(staticPath.replace(/\/+$/, '') || '/')

    const children = getProperty(route, 'children')
    if (children) collectPaths(children, paths, fullPath)
  }
}

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

export const sitemapPlugin = (projectRoot: string, origin: string): Plugin => ({
  name: 'sitemap',
  apply: 'build',
  async buildStart() {
    const file = resolve(projectRoot, 'src/routes.ts')
    this.addWatchFile(file)

    const ast = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)
    const declaration = ast.statements
      .flatMap(statement => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [])
      .find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === 'routes')
    if (!declaration?.initializer) throw new Error('Sitemap: routes array not found in src/routes.ts')

    const paths = new Set<string>()
    collectPaths(declaration.initializer, paths)

    if (paths.has('/widgets')) {
      for (const path of await loadWidgetPaths()) paths.add(path)
    }

    const urls = [...paths].map(path => {
      const url = escapeXml(new URL(path, origin).href)
      return `  <url>\n    <loc>${url}</loc>\n  </url>`
    })

    const source = '<?xml version="1.0" encoding="UTF-8"?>\n'
      + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + urls.join('\n') + '\n</urlset>\n'

    for (const fileName of ['sitemap.xml', 'sitemap-google.xml'])
      this.emitFile({ type: 'asset', fileName, source })
  },
})
