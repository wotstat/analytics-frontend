export function createComparisonHistoryQueue() {
  const limit = 5
  const pending: (() => void)[] = []
  let active = 0

  function drain() {
    while (active < limit && pending.length) pending.shift()!()
  }

  function run<T>(request: () => Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      function cancel() {
        const index = pending.indexOf(start)
        if (index !== -1) pending.splice(index, 1)
        signal.removeEventListener('abort', cancel)
        reject(new DOMException('Query aborted', 'AbortError'))
      }

      function start() {
        signal.removeEventListener('abort', cancel)
        active++

        Promise.resolve().then(() => {
          signal.throwIfAborted()
          return request()
        }).then(resolve, reject).finally(() => {
          active--
          drain()
        })
      }

      if (signal.aborted) {
        cancel()
        return
      }

      signal.addEventListener('abort', cancel, { once: true })
      pending.push(start)
      drain()
    })
  }

  return { run }
}

export type ComparisonHistoryQueue = ReturnType<typeof createComparisonHistoryQueue>
