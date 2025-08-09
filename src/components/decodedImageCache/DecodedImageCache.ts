

export class DecodedImageCache {

  private readonly countLimit: number

  private readonly cache: Map<string, { image: HTMLImageElement | Promise<HTMLImageElement>, lastUsage: number }> = new Map()
  private readonly errorCache: Map<string, string | undefined> = new Map()
  private readonly immediateEntries: Set<string> = new Set()

  constructor(protected options?: {
    countLimit?: number,
    fallbackUrl?: string,
  }) {
    this.countLimit = options?.countLimit ?? 5000

    if (options?.fallbackUrl) this.immediateEntries.add(options.fallbackUrl)
  }

  private add(url: string, image: HTMLImageElement) {
    if (this.cache.size >= this.countLimit) {
      const deleteCount = this.cache.size - this.countLimit + 1

      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastUsage - b[1].lastUsage)
        .filter(([key]) => !this.immediateEntries.has(key))
        .slice(0, deleteCount)

      for (const [key] of sortedEntries) this.cache.delete(key)
    }

    this.cache.set(url, { image, lastUsage: Date.now() })
  }

  get(url: string): HTMLImageElement | undefined {
    const cached = this.cache.get(url)
    if (!cached || cached.image instanceof Promise) return undefined

    cached.lastUsage = Date.now()
    return cached.image
  }

  getOrLoad(url: string, fallbackUrl?: string): Promise<HTMLImageElement> {
    const cached = this.get(url)
    if (cached) return Promise.resolve(cached)

    const cachedElement = this.cache.get(url)
    if (cachedElement && cachedElement.image instanceof Promise) {
      cachedElement.lastUsage = Date.now()
      return cachedElement.image
    }

    const errorFallback = this.errorCache.get(url)
    if (errorFallback) return this.getOrLoad(errorFallback)

    const image = new Image()
    image.src = url

    const result = new Promise<HTMLImageElement>((resolve, reject) => {
      image.decode()
        .then(() => {
          this.add(url, image)
          resolve(image)
        })
        .catch((e) => {
          const fallback = fallbackUrl ?? this.options?.fallbackUrl

          if (fallback) {
            this.errorCache.set(url, fallback)
            this.immediateEntries.add(fallback)
            this.getOrLoad(fallback).then(res => resolve(res))
          } else {
            this.add(url, image)
            resolve(image)
          }
        })
    })

    this.cache.set(url, { image: result, lastUsage: Date.now() })

    return result
  }

  clear() {
    this.cache.clear()
    this.errorCache.clear()
    this.immediateEntries.clear()
  }

  async prepare(urls: string[], batchSize = 10): Promise<void> {
    if (urls.length === 0) return

    const batches = Math.ceil(urls.length / batchSize)
    for (let i = 0; i < batches; i++) {
      const batch = urls.slice(i * batchSize, (i + 1) * batchSize)
      for (let index = 0; index < batch.length; index++) this.getOrLoad(batch[index])
      await new Promise(resolve => requestAnimationFrame(resolve))
    }

  }

}