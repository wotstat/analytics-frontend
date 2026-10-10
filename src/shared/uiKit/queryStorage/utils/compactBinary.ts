export const MAX_BYTES = 256 * 1024

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

export function invalid(): never {
  throw new Error('Invalid compact value')
}

export function compactMask<T>(values: readonly T[], options: readonly T[]): number {
  if (options.length > 31) throw new Error('Bitmask dictionary exceeds 31 values')
  return values.reduce((bits, value) => {
    const index = options.indexOf(value)
    if (index < 0) throw new Error('Unknown bitmask value')
    return bits | (1 << index)
  }, 0)
}

export function expandMask<T>(bits: number, options: readonly T[]): T[] {
  if (!Number.isInteger(bits) || bits < 0 || bits >= 2 ** options.length) throw new Error('Invalid bitmask')
  return options.filter((_, index) => bits & (1 << index))
}

// Компактные целые — unsigned LEB128, строки — длина UTF-8 и байты.
export class Writer {
  private bytes: number[] = []

  byte(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 255) return invalid()
    this.bytes.push(value)
  }

  uint(value: number) {
    if (!Number.isSafeInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) invalid()
    do {
      const byte = value % 128
      value = Math.floor(value / 128)
      this.byte(byte | (value ? 128 : 0))
    } while (value)
  }

  string(value: string) {
    const bytes = encoder.encode(value)
    if (bytes.length > 256) return invalid()
    this.uint(bytes.length)
    for (const byte of bytes) this.byte(byte)
  }

  finish() {
    if (this.bytes.length > MAX_BYTES) return invalid()
    return Uint8Array.from(this.bytes)
  }
}

export class Reader {
  private cursor = 0

  constructor(private bytes: Uint8Array) { }

  get done() { return this.cursor === this.bytes.length }

  byte() {
    if (this.done) return invalid()
    return this.bytes[this.cursor++]
  }

  uint(max = Number.MAX_SAFE_INTEGER): number {
    let value = 0
    for (let shift = 0; shift <= 49; shift += 7) {
      const byte = this.byte()
      value += (byte & 127) * 2 ** shift

      if (byte & 128) continue
      if (!Number.isSafeInteger(value) || value > max || (shift && !byte)) return invalid()
      return value
    }

    return invalid()
  }

  string(pattern?: RegExp) {
    const length = this.uint(256)
    if (this.cursor + length > this.bytes.length) return invalid()
    const value = decoder.decode(this.bytes.subarray(this.cursor, this.cursor + length))
    this.cursor += length
    if (pattern && !pattern.test(value)) return invalid()
    return value
  }
}
