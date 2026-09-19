
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clamp255(value: number): number {
  return clamp(value, 0, 255)
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export type RGBA = { r: number, g: number, b: number, a: number };
export type HSLA = { h: number, s: number, l: number, a: number };

export class ColorHSVA {

  constructor(
    public h: number,
    public s: number,
    public v: number,
    public a: number = 1
  ) { }

  setHsva(h: number, s: number, v: number, a: number = 1): void {
    this.h = h
    this.s = s
    this.v = v
    this.a = a
  }

  toHsla() {
    return {
      h: this.h,
      s: this.s,
      l: (2 - this.s) * this.v / 2,
      a: this.a
    }
  }

  setRgba(r: number, g: number, b: number, a: number = 1): void {
    r /= 255; g /= 255; b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    this.v = max
    this.a = a

    if (max === 0) {
      this.s = 0
      this.h = 0
      return
    }

    this.s = delta / max

    if (delta === 0) {
      this.h = 0
      return
    }

    if (max === r) {
      this.h = ((g - b) / delta + (g < b ? 6 : 0)) * 60
    } else if (max === g) {
      this.h = ((b - r) / delta + 2) * 60
    } else {
      this.h = ((r - g) / delta + 4) * 60
    }
  }

  parseRgba(r: string, g: string, b: string, a: string): void {
    const rNum = clamp255(parseFloat(r))
    const gNum = clamp255(parseFloat(g))
    const bNum = clamp255(parseFloat(b))
    const aNum = clamp01(parseFloat(a))

    this.setRgba(rNum, gNum, bNum, aNum)
  }

  setHsla(h: number, s: number, l: number, a: number = 1): void {
    this.h = clamp(h, 0, 360)
    this.s = clamp01(s)
    this.a = clamp01(a)
    this.v = (2 - this.s) * l / 2
  }

  parseHsla(h: string, s: string, l: string, a: string): void {
    const hNum = clamp(parseFloat(h), 0, 360)
    const sNum = clamp01(parseFloat(s) / 100)
    const lNum = clamp01(parseFloat(l) / 100)
    const aNum = clamp01(parseFloat(a))

    console.log(`Parsed HSLA: h=${hNum}, s=${sNum}, l=${lNum}, a=${aNum}`)


    this.setHsla(hNum, sNum, lNum, aNum)
  }

  setHex(hex: string): void {
    hex = hex.trim().replace(/^#/, '').toLowerCase()

    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('') + 'ff'
    }

    if (hex.length === 6) {
      hex += 'ff'
    }

    if (hex.length !== 8) {
      throw new Error(`Invalid hex color: ${hex}`)
    }

    const bigint = parseInt(hex, 16)
    const r = (bigint >> 24) & 255
    const g = (bigint >> 16) & 255
    const b = (bigint >> 8) & 255
    const a = (bigint & 255) / 255

    this.setRgba(r, g, b, a)
  }

  paseHex(hex: string): void {
    hex = hex.trim().replace(/^#/, '').toLowerCase()

    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('') + 'ff'
    }

    if (hex.length === 6) {
      hex += 'ff'
    }

    if (hex.length === 8) this.setHex(hex)
  }

  toRgba(): { r: number, g: number, b: number, a: number } {
    const c = this.v * this.s
    const x = c * (1 - Math.abs(((this.h / 60) % 2) - 1))
    const m = this.v - c

    let r: number, g: number, b: number

    if (this.h < 60) {
      r = c; g = x; b = 0
    } else if (this.h < 120) {
      r = x; g = c; b = 0
    } else if (this.h < 180) {
      r = 0; g = c; b = x
    } else if (this.h < 240) {
      r = 0; g = x; b = c
    } else if (this.h < 300) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
      a: this.a
    }
  }

  toHex(): string {
    const { r, g, b, a } = this.toRgba()
    const hex = r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0') +
      Math.round(a * 255).toString(16).padStart(2, '0')
    return hex
  }

  parseFormat(format: 'hex' | 'rgba' | 'hsla', value: string | RGBA | HSLA) {
    const v = value as any

    try {
      if (format == 'hex') this.setHex(v)
      else if (format == 'rgba') this.setRgba(v.r, v.g, v.b, v.a)
      else if (format == 'hsla') this.setHsla(v.h, v.s, v.l, v.a)
      else console.error(`Unsupported color format: ${format}`)
    } catch (error) {
      console.error(`Error parsing color in format ${format}:`, error)
    }
  }

  toFormat(format: 'hex' | 'rgba' | 'hsla'): string | RGBA | HSLA {
    if (format === 'hex') return this.toHex()
    if (format === 'rgba') return this.toRgba()
    if (format === 'hsla') return this.toHsla()
    console.error(`Unsupported color format: ${format}`)

    return { h: 0, s: 0, l: 0, a: 1 } as HSLA // Default return value
  }

  get cssString(): string {
    const l = (2 - this.s) * this.v / 2
    return `hsla(${this.h}, ${this.s * 100}%, ${l * 100}%, ${this.a})`
  }

  get cssOpaqueString(): string {
    const l = (2 - this.s) * this.v / 2
    return `hsl(${this.h}, ${this.s * 100}%, ${l * 100}%)`
  }
}