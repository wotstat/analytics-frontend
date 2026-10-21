export const loadWidgetPaths = async () => {
  const response = await fetch('https://widgets.wotstat.info/widget-catalog.json', {
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) throw new Error(`Sitemap widget catalog: HTTP ${response.status}`)

  const entries: unknown = await response.json()
  if (!Array.isArray(entries)) throw new Error('Sitemap: invalid widget catalog')

  const paths: string[] = []
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object'
      || typeof entry.route !== 'string' || !/^\/[a-z0-9/-]+$/.test(entry.route))
      throw new Error('Sitemap: invalid widget catalog route')

    paths.push(`/widgets${entry.route.replace(/\/+$/, '')}`)
  }
  return paths.sort()
}
