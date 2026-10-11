import { deflateSync, Inflate } from 'fflate'
import { invalid } from './compactBinary'

export function deflate(bytes: Uint8Array): Uint8Array {
  return deflateSync(bytes, { level: 9 })
}

export function inflate(bytes: Uint8Array, maxBytes: number): Uint8Array {
  if (!bytes.length) return invalid()
  const chunks: Uint8Array[] = []
  let length = 0
  const inflater = new Inflate(chunk => {
    length += chunk.length
    if (length > maxBytes) invalid()
    chunks.push(chunk)
  })

  // Проверяем предел по мере распаковки, до создания итогового буфера.
  for (let start = 0; start < bytes.length; start += 256) {
    inflater.push(bytes.subarray(start, start + 256), start + 256 >= bytes.length)
  }

  const result = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}
