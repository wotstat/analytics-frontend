import { createHash } from 'node:crypto'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const files: Record<string, string> = {}
for (const root of ['dist', 'dist-meta']) await collect(root)

const ordered = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
const id = createHash('sha256')
  .update(Object.entries(ordered).map(([path, hash]) => `${path}\0${hash}\n`).join(''))
  .digest('hex').slice(0, 24)

await Bun.write('dist-meta/release.json', JSON.stringify({ schema: 1, id, files: ordered }, null, 2) + '\n')
console.log(`Frontend release: ${id}`)

async function collect(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (path === 'dist-meta/release.json') continue
    if (entry.isDirectory()) await collect(path)
    else if (entry.isFile()) files[path] = createHash('sha256').update(await Bun.file(path).bytes()).digest('hex')
    else throw new Error(`Unexpected release entry: ${path}`)
  }
}
