import { Reader, Writer, invalid } from '@/shared/utils/encoding/compactBinary'
import { comparisonColor, comparisonPalette } from '../palette'

type EncodedColor = { kind: 0 } | { kind: 1, value: number } | { kind: 2 | 3, value: string }

// 0 — цвет по позиции, 1 — индекс палитры, 2/3 — RGB/RGBA.
export function compactColor(color: number | string, index: number): EncodedColor {
  if (typeof color === 'number') {
    if (!Number.isInteger(color) || color < 0 || color > 65535) return invalid()
    return color === index ? { kind: 0 } : { kind: 1, value: color }
  }

  if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)) return invalid()
  const hex = color.toLowerCase()
  const normalized = hex.length === 9 && hex.endsWith('ff') ? hex.slice(0, 7) : hex
  if (normalized === comparisonColor(index)) return { kind: 0 }
  const paletteIndex = comparisonPalette.findIndex(value => value === normalized)
  if (paletteIndex >= 0) return { kind: 1, value: paletteIndex }
  return { kind: normalized.length === 9 ? 3 : 2, value: normalized }
}

export function writeColor(output: Writer, color: EncodedColor, inlineKind: boolean) {
  if (!color.kind) return
  if (color.kind === 1) return output.uint(color.value + (inlineKind ? 0 : 2))
  // У категории младшие биты extras заняты выборкой, поэтому тип остаётся в отдельном коде.
  if (!inlineKind) output.byte(color.kind - 2)
  for (const hex of color.value.slice(1).match(/../g)!) output.byte(parseInt(hex, 16))
}

export function readColor(input: Reader, kind?: number): number | string {
  if (kind === undefined) {
    const code = input.uint(65537)
    if (code > 1) return code - 2
    kind = code + 2
  }
  if (kind === 1) return input.uint(65535)
  if (kind !== 2 && kind !== 3) return invalid()
  return '#' + Array.from({ length: kind + 1 }, () => input.byte().toString(16).padStart(2, '0')).join('')
}
