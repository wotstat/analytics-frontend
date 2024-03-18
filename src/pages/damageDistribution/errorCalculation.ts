
import CalcWorker from './calcWorker.ts?worker'
import { ComputedRef, Ref, ShallowRef, WatchSource, computed, ref, shallowRef, toValue, watch, watchEffect } from "vue";

type ErrorResult = number[][]

const cacheKey = (damage: number, step: number, shotCount: number, experimentsCount: number) => `${damage}-${step}-${shotCount}-${experimentsCount}`

const resultCache = new Map<string, ErrorResult>()


export function useErrorCalculation(damage: WatchSource<number>, shotCount: WatchSource<number>, intervals: WatchSource<[number, number][]>, experimentsCount: WatchSource<number>) {

  const currentResult = shallowRef<ErrorResult | null>(null)
  const calculationInProgress = ref(false)
  const progress = ref(0)
  const readyToCalculate = computed(() => !calculationInProgress.value && !currentResult.value)
  let skipAutoCalculation = false

  const worker = new CalcWorker()
  let workerBusy = false

  function getKey() {
    return cacheKey(toValue(damage), toValue(intervals).length, toValue(shotCount), toValue(experimentsCount))
  }

  worker.onmessage = (e) => {
    if (e.data === 'end') {
      workerBusy = false
      return
    }

    if (e.data.progress) {
      progress.value = e.data.progress
    }

    if (e.data.result && e.data.key) {
      calculationInProgress.value = false
      resultCache.set(e.data.key, e.data.result)
      currentResult.value = e.data.result
    }
  }

  watch([damage, intervals, shotCount, experimentsCount], () => {
    const key = getKey()
    currentResult.value = resultCache.get(key) ?? null

    progress.value = 0
    stopCalculation()
  })

  watch([damage, intervals], async ([dmg, intervals]) => {
    stopCalculation()
    if (intervals.length == 0) return
    const key = getKey()
    if (resultCache.has(key)) return
    const iterations = toValue(shotCount) * toValue(experimentsCount)
    if (iterations > 3000 * 10000) return
    if (skipAutoCalculation) return

    for (let i = 0; i < 100 && workerBusy; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    if (workerBusy) return

    startCalculation()
  })

  function startCalculation() {
    skipAutoCalculation = false
    calculationInProgress.value = true
    progress.value = 0
    workerBusy = true
    currentResult.value = null
    worker.postMessage({
      damage: toValue(damage),
      intervals: toValue(intervals),
      shotCount: toValue(shotCount),
      experimentsCount: toValue(experimentsCount),
      key: getKey()
    })
  }

  function stopCalculation() {
    if (!calculationInProgress.value) return
    worker.postMessage('cancel')
    calculationInProgress.value = false
  }

  function reset() {
    currentResult.value = null
    skipAutoCalculation = true
    resultCache.clear()
    // const key = getKey()

    // if (resultCache.has(key)) {
    //   resultCache.delete(key)
    // }
  }

  return {
    calculate: startCalculation,
    reset,
    result: currentResult,
    readyToCalculate,
    progress,
    cancel: stopCalculation
  }

}