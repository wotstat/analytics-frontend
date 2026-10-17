import { write } from 'bun'
import { Buffer } from 'node:buffer'
import { zlibSync } from 'fflate'

// Запуск из этой папки: bun generateAuroraMist.ts
// Перезаписывает aurora-mist.png (1200×630) рядом со скриптом.

const cardWidth = 1200
const cardHeight = 630
const inset = 120
const sigma = 68
const opacity = .65
const ditherStrength = 1
const teal = { color: [59, 112, 124], x: 1, y: 0, rx: .8, ry: 1.15, stops: [[0, 166], [.25, 102], [.5, 46], [.75, 13], [1, 0]] }
const purple = { color: [115, 90, 149], x: .65, y: 1.1, rx: .75, ry: 1, stops: [[0, 140], [.25, 89], [.55, 38], [.8, 10], [1, 0]] }

const alphaAt = (distance: number, stops: number[][]) => {
  for (let i = 1; i < stops.length; i++) {
    const [end, endAlpha] = stops[i]
    if (distance > end) continue
    const [start, startAlpha] = stops[i - 1]
    return (startAlpha + (endAlpha - startAlpha) * (distance - start) / (end - start)) / 255
  }
  return 0
}

const blur = (source: Float64Array, target: Float64Array, width: number, height: number, radius: number, horizontal: boolean) => {
  const length = horizontal ? width : height
  const lines = horizontal ? height : width
  const stride = horizontal ? 4 : width * 4
  const divisor = radius * 2 + 1

  for (let line = 0; line < lines; line++) {
    const offset = horizontal ? line * width * 4 : line * 4
    for (let channel = 0; channel < 4; channel++) {
      let sum = 0
      for (let i = 0; i <= radius; i++) sum += source[offset + i * stride + channel]
      for (let i = 0; i < length; i++) {
        target[offset + i * stride + channel] = sum / divisor
        if (i >= radius) sum -= source[offset + (i - radius) * stride + channel]
        if (i + radius + 1 < length) sum += source[offset + (i + radius + 1) * stride + channel]
      }
    }
  }
}

const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

const chunk = (name: string, data: Uint8Array) => {
  const result = Buffer.alloc(data.length + 12)
  result.writeUInt32BE(data.length)
  result.write(name, 4, 4, 'ascii')
  result.set(data, 8)
  let crc = 0xffffffff
  for (let i = 4; i < result.length - 4; i++) crc = crcTable[(crc ^ result[i]) & 255] ^ (crc >>> 8)
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4)
  return result
}

const generate = async () => {
  const padding = Math.ceil(inset + sigma * 3)
  const width = cardWidth
  const height = cardHeight
  const fieldWidth = width + padding * 2
  const fieldHeight = height + padding * 2
  const source = new Float64Array(fieldWidth * fieldHeight * 4)
  const target = new Float64Array(source.length)
  const ellipseWidth = cardWidth + inset * 2
  const ellipseHeight = cardHeight + inset * 2

  for (let y = 0; y < fieldHeight; y++) {
    const py = y - padding + .5 + inset
    if (py < 0 || py >= ellipseHeight) continue
    for (let x = 0; x < fieldWidth; x++) {
      const px = x - padding + .5 + inset
      if (px < 0 || px >= ellipseWidth) continue
      const tealAlpha = alphaAt(Math.hypot((px - teal.x * ellipseWidth) / (teal.rx * ellipseWidth), (py - teal.y * ellipseHeight) / (teal.ry * ellipseHeight)), teal.stops)
      const purpleAlpha = alphaAt(Math.hypot((px - purple.x * ellipseWidth) / (purple.rx * ellipseWidth), (py - purple.y * ellipseHeight) / (purple.ry * ellipseHeight)), purple.stops) * (1 - tealAlpha)
      const offset = (y * fieldWidth + x) * 4
      for (let channel = 0; channel < 3; channel++) source[offset + channel] = teal.color[channel] * tealAlpha + purple.color[channel] * purpleAlpha
      source[offset + 3] = tealAlpha + purpleAlpha
    }
  }

  // Blur premultiplied RGBA in Float64, without intermediate 8-bit surfaces.
  const lower = 2 * Math.floor((Math.sqrt(4 * sigma ** 2 + 1) - 1) / 2) + 1
  const lowerCount = Math.round((12 * sigma ** 2 - 3 * lower ** 2 - 12 * lower - 9) / (-4 * lower - 4))
  for (let pass = 0; pass < 3; pass++) {
    const radius = ((pass < lowerCount ? lower : lower + 2) - 1) / 2
    blur(source, target, fieldWidth, fieldHeight, radius, true)
    blur(target, source, fieldWidth, fieldHeight, radius, false)
  }

  const rows = new Uint8Array((width * 3 + 1) * height)
  const angle = 125 * Math.PI / 180
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  const gradientLength = cardWidth * dx + cardHeight * dy
  const baseStart = [20, 27, 39]
  const baseEnd = [23, 29, 43]
  let random = 17
  const nextRandom = () => {
    random ^= random << 13
    random ^= random >>> 17
    random ^= random << 5
    return (random >>> 0) / 0x100000000
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = ((y + padding) * fieldWidth + x + padding) * 4
      const progress = Math.max(0, Math.min(1, .5 + ((x + .5 - cardWidth / 2) * dx + (y + .5 - cardHeight / 2) * dy) / gradientLength))
      // Zero-mean triangular dither is shared by RGB to avoid colored grain.
      const noise = (nextRandom() + nextRandom() - 1) * ditherStrength
      for (let channel = 0; channel < 3; channel++) {
        const base = baseStart[channel] + (baseEnd[channel] - baseStart[channel]) * progress
        const color = source[offset + channel] * opacity + base * (1 - source[offset + 3] * opacity)
        rows[y * (width * 3 + 1) + x * 3 + channel + 1] = Math.max(0, Math.min(255, Math.round(color + noise)))
      }
    }
  }

  // PNG's Sub filter changes compression only, preserving every dithered pixel.
  for (let y = 0; y < height; y++) {
    const start = y * (width * 3 + 1)
    rows[start] = 1
    for (let x = width * 3; x > 3; x--) rows[start + x] -= rows[start + x - 3]
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(rows, { level: 9 })),
    chunk('IEND', new Uint8Array()),
  ])
  const file = new URL('./aurora-mist.png', import.meta.url)
  await write(file, png)
  console.log(`${file.pathname}: ${width}×${height}, ${(png.length / 1024).toFixed(1)} KiB`)
}

await generate()
