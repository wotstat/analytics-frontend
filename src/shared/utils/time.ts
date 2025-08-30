import { countLocalize } from '../i18n/i18n'

export function timeProcessor(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.round(time - minutes * 60)
  return [`${minutes}`, seconds.toString().padStart(2, '0')]
}

export const ms2sec = (ms: number) => (ms / 1000).toFixed()
export const sec2minsec = (sec: number) => timeProcessor(sec).join(':')
export const secLabel = (count: number) => countLocalize(count, 'секунда', 'секунды', 'секунд')
export const ms2secLabel = (count: number) => countLocalize(count / 1000, 'секунда', 'секунды', 'секунд')
export const sec2hour = (sec: number) => (sec / 60 / 60).toFixed(1)
export const hour2hour = (hour: number) => hour.toFixed(1)