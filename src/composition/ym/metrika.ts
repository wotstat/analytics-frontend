import { ref } from 'vue'

function loadScript(callback: () => void, err?: OnErrorEventHandler) {
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://mc.yandex.ru/metrika/tag.js'

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode!.insertBefore(script, firstScript)

  script.onload = callback
  if (err) script.onerror = err
}

export const isInit = ref(false)
export const metrikaId = Number.parseInt(import.meta.env.VITE_YM_ID)

export function setup(params: ym.InitParameters) {
  if (isInit.value) return console.warn('Metrika already initialized')

  console.log('Metrika initialized with ID:', metrikaId)

  // @ts-ignore
  window['ym'] = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments) }
  // @ts-ignore
  window['ym'].l = 1 * new Date()

  loadScript(async () => {
    ym(metrikaId, 'init', params)
    isInit.value = true
  })
}
