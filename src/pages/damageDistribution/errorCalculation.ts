
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

  const worker = new CalcWorker()

  worker.onmessage = (e) => {
    if (e.data.progress) {
      progress.value = e.data.progress
    }

    if (e.data.result) {
      calculationInProgress.value = false
      const key = cacheKey(toValue(damage), toValue(intervals).length, toValue(shotCount), toValue(experimentsCount))
      resultCache.set(key, e.data.result)
      currentResult.value = e.data.result
    }
  }

  watch([damage, intervals, shotCount, experimentsCount], ([damage, intervals, shotCount, experimentsCount]) => {
    const key = cacheKey(damage, intervals.length, shotCount, experimentsCount)
    currentResult.value = resultCache.get(key) ?? null

    progress.value = 0
    stopCalculation()
  })

  function startCalculation() {
    calculationInProgress.value = true
    currentResult.value = null
    worker.postMessage({
      damage: toValue(damage),
      intervals: toValue(intervals),
      shotCount: toValue(shotCount),
      experimentsCount: toValue(experimentsCount)
    })
  }

  function stopCalculation() {
    if (!calculationInProgress.value) return
    worker.postMessage('cancel')
    calculationInProgress.value = false
  }

  return {
    calculate: startCalculation,
    result: currentResult,
    readyToCalculate,
    progress
  }

}