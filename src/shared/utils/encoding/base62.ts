import { invalid } from './compactBinary'

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const BITS_PER_DIGIT = Math.log2(62)
const NUMBER_DIGITS = 8 // 62 ** 8 помещается в безопасное целое JS.

function createPowers() {
  const powers = new Map<number, bigint>()
  return (length: number) => {
    let value = powers.get(length)
    if (value === undefined) {
      value = 62n ** BigInt(length)
      powers.set(length, value)
    }
    return value
  }
}

// Байты — одно big-endian число; каждый ведущий нулевой байт сохраняется символом '0'.
export function encodeBase62(bytes: Uint8Array): string {
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++
  if (zeros === bytes.length) return '0'.repeat(zeros)

  const power = createPowers()
  // Делим число пополам, чтобы длинные значения не обрабатывать по одному разряду BigInt.
  const encode = (value: bigint, length: number): string => {
    if (length <= NUMBER_DIGITS) {
      let number = Number(value)
      let result = ''
      for (let index = 0; index < length; index++) {
        result = ALPHABET[number % 62] + result
        number = Math.floor(number / 62)
      }
      return result
    }
    const right = Math.floor(length / 2)
    const divisor = power(right)
    return encode(value / divisor, length - right) + encode(value % divisor, right)
  }

  const hex = Array.from(bytes.subarray(zeros), byte => byte.toString(16).padStart(2, '0')).join('')
  const length = Math.ceil((bytes.length - zeros) * 8 / BITS_PER_DIGIT)
  return '0'.repeat(zeros) + encode(BigInt('0x' + hex), length).replace(/^0+/, '')
}

export function decodeBase62(raw: string, maxBytes = Number.MAX_SAFE_INTEGER): Uint8Array {
  if (raw.length > Math.ceil(maxBytes * 8 / BITS_PER_DIGIT) || !/^[0-9A-Za-z]*$/.test(raw)) return invalid()
  let zeros = 0
  while (zeros < raw.length && raw[zeros] === '0') zeros++
  if (zeros > maxBytes) return invalid()
  if (zeros === raw.length) return new Uint8Array(zeros)

  const power = createPowers()
  const decode = (start: number, end: number): bigint => {
    if (end - start <= NUMBER_DIGITS) {
      let number = 0
      for (let index = start; index < end; index++) number = number * 62 + ALPHABET.indexOf(raw[index])
      return BigInt(number)
    }
    const middle = Math.floor((start + end) / 2)
    return decode(start, middle) * power(end - middle) + decode(middle, end)
  }

  const hex = decode(zeros, raw.length).toString(16)
  const size = Math.ceil(hex.length / 2)
  if (zeros + size > maxBytes) return invalid()
  const padded = hex.padStart(size * 2, '0')
  const bytes = new Uint8Array(zeros + size)
  for (let index = 0; index < size; index++) bytes[zeros + index] = parseInt(padded.slice(index * 2, index * 2 + 2), 16)
  return bytes
}
