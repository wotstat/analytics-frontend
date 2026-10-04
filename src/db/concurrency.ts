export type ConcurrencyGroup = ReturnType<typeof createConcurrencyGroup>

export function createConcurrencyGroup(limit: number) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Concurrency limit must be a positive integer')
  }

  const pending: (() => void)[] = []
  let active = 0

  function drain() {
    while (active < limit && pending.length) pending.shift()!()
  }

  function run<T>(request: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      function cancel() {
        const index = pending.indexOf(start)
        if (index !== -1) pending.splice(index, 1)
        signal?.removeEventListener('abort', cancel)
        reject(signal?.reason ?? new DOMException('Query aborted', 'AbortError'))
      }

      function start() {
        signal?.removeEventListener('abort', cancel)
        active++

        Promise.resolve().then(async () => {
          try {
            signal?.throwIfAborted()
            return await request()
          } finally {
            active--
            drain()
          }
        }).then(resolve, reject)
      }

      if (signal?.aborted) {
        cancel()
        return
      }

      signal?.addEventListener('abort', cancel, { once: true })
      pending.push(start)
      drain()
    })
  }

  return { run }
}
