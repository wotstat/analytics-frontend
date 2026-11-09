declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

export function setup(measurementId?: string) {
  if (!measurementId || initialized) return

  const dataLayer = window.dataLayer ??= []
  window.gtag ??= function () { dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
  initialized = true
}
