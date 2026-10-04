export type ConcurrencyGroup = Pick<ReturnType<typeof createConcurrencyGroup>, 'run'>

export function createConcurrencyGroup(limit: number) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError('Concurrency limit must be a positive integer')
  }

  const pending: { order: number, start: () => void }[] = []
  let active = 0
  let nextOrder = 0

  function drain() {
    while (active < limit && pending.length) pending.shift()!.start()
  }

  function enqueue<T>(request: () => Promise<T>, signal: AbortSignal | undefined, order: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      function cancel() {
        const index = pending.indexOf(task)
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

      const task = { order, start }
      if (signal?.aborted) {
        cancel()
        return
      }

      signal?.addEventListener('abort', cancel, { once: true })
      const index = pending.findIndex(task => task.order > order)
      if (index === -1) pending.push(task)
      else pending.splice(index, 0, task)
      drain()
    })
  }

  function run<T>(request: () => Promise<T>, signal?: AbortSignal) {
    return enqueue(request, signal, nextOrder++)
  }

  function createOrderedGroup() {
    const order = nextOrder++
    return {
      run<T>(request: () => Promise<T>, signal?: AbortSignal) {
        return enqueue(request, signal, order)
      },
    }
  }

  return { run, createOrderedGroup }
}
