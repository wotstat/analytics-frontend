if (import.meta.env.MODE == 'development' && import.meta.env.VITE_MODE_DEV_LOCAL === 'true' && !window.crypto.randomUUID) {
  console.warn('crypto.randomUUID is not supported in this browser, using fallback implementation')

  // @ts-ignore
  window.crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

if (import.meta.env.MODE == 'development' && import.meta.env.VITE_MODE_DEV_LOCAL === 'true' && !window.crypto.subtle) {
  console.warn('crypto.subtle is not supported in this browser, using SHA-256 fallback implementation')

  // Для ключей кеша нужен только digest('SHA-256'); остальные операции Web Crypto не реализуются.
  Object.defineProperty(window.crypto, 'subtle', {
    configurable: true,
    value: {
      async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name
        if (name.toUpperCase() !== 'SHA-256') throw new DOMException('Only SHA-256 is supported by the dev polyfill', 'NotSupportedError')

        // Web Crypto копирует входные данные до асинхронного вычисления.
        const bytes = (ArrayBuffer.isView(data)
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : new Uint8Array(data)).slice()
        const { sha256 } = await import('./sha256')
        return sha256(bytes).buffer
      },
    },
  })
}
