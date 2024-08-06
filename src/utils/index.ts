import { countLocalize } from "./i18n"


export function toRelative(arr: number[]) {
  const sum = arr.reduce((prev, cur) => prev + cur, 0)
  return arr.map(t => sum == 0 ? 0 : t / sum)
}

export function toPercent(value: { raw: unknown }[], digits: number = 0) {
  const scale = Math.pow(10, digits)
  return `${(Math.round((value[0].raw as number) * 100 * scale) / scale).toFixed(digits)}%`
}

export function whereSum(exp: string[], addWhere: boolean = true) {
  return exp.length > 0 ? (addWhere ? 'WHERE ' : '') + exp.join(' AND ') : ''
}

export function timeProcessor(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.round(time - minutes * 60)
  return [`${minutes}`, seconds.toString().padStart(2, '0')]
}

export const ms2sec = (ms: number) => (ms / 1000).toFixed();
export const sec2minsec = (sec: number) => timeProcessor(sec).join(':');
export const secProcessor = (count: number) => countLocalize(count, 'секунда', 'секунды', 'секунд');
export const sec2hour = (sec: number) => (sec / 60 / 60).toFixed(1);
export const hour2hour = (hour: number) => hour.toFixed(1);