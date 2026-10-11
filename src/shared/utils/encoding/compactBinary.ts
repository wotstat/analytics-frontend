export type BinaryLimits = { maxBytes?: number, maxStringBytes?: number }

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

  constructor(private limits: BinaryLimits = {}) { }

  byte(value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 255) return invalid()
    if (this.bytes.length >= (this.limits.maxBytes ?? Number.MAX_SAFE_INTEGER)) return invalid()
    this.bytes.push(value)
  }

  raw(bytes: Uint8Array) {
    for (const byte of bytes) this.byte(byte)
  }

  uint(value: number) {
    if (!Number.isSafeInteger(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) invalid()
    do {
      const byte = value % 128
      value = Math.floor(value / 128)
      this.byte(byte | (value ? 128 : 0))
    } while (value)
  }

  // Семь бит маски в байте, старший бит — продолжение. Нулевой хвост не записывается.
  bitset(values: readonly boolean[]) {
    let end = values.length
    while (end && !values[end - 1]) end--
    for (let offset = 0; offset < Math.max(1, end); offset += 7) {
      let byte = 0
      for (let bit = 0; bit < 7 && offset + bit < end; bit++) {
        if (values[offset + bit]) byte |= 1 << bit
      }
      this.byte(byte | (offset + 7 < end ? 128 : 0))
    }
  }

  string(value: string) {
    const bytes = encoder.encode(value)
    if (bytes.length > (this.limits.maxStringBytes ?? Number.MAX_SAFE_INTEGER)) return invalid()
    this.uint(bytes.length)
    this.raw(bytes)
  }

  // Число + 1 либо ноль и строка UTF-8.
  atom(value: number | string) {
    if (typeof value === 'number') {
      if (value < 0) return invalid()
      return this.uint(value + 1)
    }
    this.uint(0)
    this.string(value)
  }

  list<T>(values: readonly T[], write: (value: T) => void, max = Number.MAX_SAFE_INTEGER) {
    if (values.length > max) return invalid()
    this.uint(values.length)
    for (const value of values) write(value)
  }

  finish() {
    return Uint8Array.from(this.bytes)
  }
}

export class Reader {
  private cursor = 0

  constructor(private bytes: Uint8Array, private limits: BinaryLimits = {}) {
    if (bytes.length > (limits.maxBytes ?? Number.MAX_SAFE_INTEGER)) invalid()
  }

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

  bitset(maxBits: number): boolean[] {
    if (!Number.isSafeInteger(maxBits) || maxBits < 0) return invalid()
    const values: boolean[] = []
    for (let offset = 0; offset < Math.max(1, maxBits); offset += 7) {
      const byte = this.byte()
      const size = Math.min(7, maxBits - offset)
      if ((byte & 127) >> size) return invalid()
      for (let bit = 0; bit < size; bit++) values.push(!!(byte & (1 << bit)))
      if (byte & 128) continue
      if (offset && !(byte & 127)) return invalid()
      return values
    }

    return invalid()
  }

  string(pattern?: RegExp) {
    const length = this.uint(this.limits.maxStringBytes)
    if (this.cursor + length > this.bytes.length) return invalid()
    const value = decoder.decode(this.bytes.subarray(this.cursor, this.cursor + length))
    this.cursor += length
    if (pattern && !pattern.test(value)) return invalid()
    return value
  }

  atom(max = Number.MAX_SAFE_INTEGER - 1): number | string {
    const code = this.uint(max + 1)
    return code ? code - 1 : this.string()
  }

  list<T>(read: () => T, max = Number.MAX_SAFE_INTEGER): T[] {
    return Array.from({ length: this.uint(max) }, read)
  }
}
