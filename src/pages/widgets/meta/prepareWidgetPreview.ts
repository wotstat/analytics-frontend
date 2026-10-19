export type WidgetPreviewSize = {
  width: number
  height: number
  insets: { top: number, right: number, bottom: number, left: number }
}

type WidgetInfo = { name: string, description: string }

const isDimension = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 16_384

const isPreviewSize = (data: WidgetPreviewSize) => {
  if (!isDimension(data.width) || !isDimension(data.height) || !data.insets) return false

  const { top, right, bottom, left } = data.insets
  return [top, right, bottom, left].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    && isDimension(data.width + left + right) && isDimension(data.height + top + bottom)
}

export async function prepareWidgetPreview(
  iframe: HTMLIFrameElement,
  url: URL,
  signal: AbortSignal,
  resize: (size: WidgetPreviewSize) => Promise<void>,
  updateInfo: (info: WidgetInfo) => void,
) {
  const ready = Promise.withResolvers<void>()
  const timeout = AbortSignal.timeout(12_000)
  const lifecycle = AbortSignal.any([signal, timeout])
  let sequence = 0
  let failure: Error | undefined
  let pending: {
    id: number
    type: string
    resolve: (data: WidgetPreviewSize | void) => void
    reject: (error: unknown) => void
  } | undefined

  const fail = (error: Error) => {
    failure = error
    ready.reject(error)
    pending?.reject(error)
  }

  const onAbort = () => fail(lifecycle.reason)
  const onError = () => fail(new Error('Не удалось загрузить превью виджета'))
  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow || event.origin !== url.origin) return
    const data = event.data
    if (!data || typeof data !== 'object') return

    if (data.type === 'widget-preview-error') {
      fail(new Error(typeof data.message === 'string' ? data.message : 'Ошибка превью виджета'))
      return
    }

    if (data.type === 'widget-preview-ready') {
      if (typeof data.name === 'string' && typeof data.description === 'string') updateInfo(data)
      ready.resolve()
      return
    }

    if (!pending || data.requestId !== pending.id || data.type !== pending.type) return
    if (data.type === 'widget-preview-size' && !isPreviewSize(data)) {
      fail(new Error('Некорректный размер превью виджета'))
      return
    }

    pending.resolve(data.type === 'widget-preview-size' ? data : undefined)
  }

  function request(type: 'measure'): Promise<WidgetPreviewSize>
  function request(type: 'settle'): Promise<void>
  function request(type: 'measure' | 'settle'): Promise<WidgetPreviewSize | void> {
    if (failure) return Promise.reject(failure)

    const response = Promise.withResolvers<WidgetPreviewSize | void>()
    const id = ++sequence
    const responseType = type === 'measure' ? 'widget-preview-size' : 'widget-preview-settled'
    pending = { id, type: responseType, ...response }

    iframe.contentWindow!.postMessage({ type: `widget-preview-${type}`, requestId: id }, url.origin)
    return response.promise
  }

  window.addEventListener('message', onMessage)
  iframe.addEventListener('error', onError)
  lifecycle.addEventListener('abort', onAbort, { once: true })

  try {
    lifecycle.throwIfAborted()
    iframe.src = url.href
    await ready.promise

    let previous: number[] | undefined
    for (let iteration = 0; iteration < 5; iteration++) {
      const size = await request('measure')
      await resize(size)

      const { width, height, insets } = size
      const dimensions = [width, height, insets.top, insets.right, insets.bottom, insets.left]
      if (previous && previous.every((value, index) => Math.abs(value - dimensions[index]) <= 1)) break
      previous = dimensions
    }

    await request('settle')
    lifecycle.throwIfAborted()
  } finally {
    window.removeEventListener('message', onMessage)
    iframe.removeEventListener('error', onError)
    lifecycle.removeEventListener('abort', onAbort)
  }
}
