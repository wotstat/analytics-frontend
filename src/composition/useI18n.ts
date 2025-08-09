
type Locale<K extends string> = Record<K, string>
type I18n<L extends string, K extends string> = Record<L, Locale<K>>

const fallbackMapper = {
  'be': 'ru',
} as const

function getLocale<L extends string, K extends string>(i18n: I18n<L, K>, language: string | undefined) {
  if (language) {
    if (language in i18n) return i18n[language as L]
    if (language in fallbackMapper) {
      const target = fallbackMapper[language as keyof typeof fallbackMapper]
      if (target in i18n) return i18n[target as L]
    }
  }

  if ('en' in i18n) return i18n['en' as L]
  if ('ru' in i18n) return i18n['ru' as L]
  return i18n[Object.keys(i18n)[0] as L]
}

export function useI18n<L extends string, K extends string>(i18n: I18n<L, K>, fallback?: L) {
  return {
    t: (key: K | string & {}, locale?: L) => {
      const language = locale ?? fallback
      const localeData = getLocale(i18n, language)
      return localeData[key as K] ?? key
    }
  }
}