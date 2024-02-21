import { useWebWorker } from "@vueuse/core";
import { ComputedRef, Ref, ShallowRef, WatchSource, computed, ref, shallowRef, toValue, watch, watchEffect } from "vue";

type ErrorResult = number[][]

const cacheKey = (damage: number, step: number, shotCount: number, experimentsCount: number) => `${damage}-${step}-${shotCount}-${experimentsCount}`

const resultCache = new Map<string, ErrorResult>()


export function useErrorCalculation(damage: WatchSource<number>, shotCount: WatchSource<number>, intervals: WatchSource<[number, number][]>, experimentsCount: WatchSource<number>) {

  const currentResult = shallowRef<ErrorResult | null>(null)
  const calculationInProgress = ref(false)
  const progress = ref(0)
  const readyToCalculate = computed(() => !calculationInProgress.value && !currentResult.value)

  const worker = useWebWorker<{ result?: ErrorResult, progress: number }>(new URL('./calcWorker.ts', import.meta.url).toString(), {
    type: 'module',
  })


  watch(() => worker.data.value?.progress, (v) => progress.value = v)
  watch(() => worker.data.value?.result, (res) => {
    if (!res) return

    calculationInProgress.value = false
    const key = cacheKey(toValue(damage), toValue(intervals).length, toValue(shotCount), toValue(experimentsCount))
    resultCache.set(key, res)
    currentResult.value = res
  })


  watch([damage, intervals, shotCount, experimentsCount], ([damage, intervals, shotCount, experimentsCount]) => {
    const key = cacheKey(damage, intervals.length, shotCount, experimentsCount)
    currentResult.value = resultCache.get(key) ?? null

    progress.value = 0
    stopCalculation()
  })

  function startCalculation() {
    calculationInProgress.value = true
    currentResult.value = null
    worker.post({
      damage: toValue(damage),
      intervals: toValue(intervals),
      shotCount: toValue(shotCount),
      experimentsCount: toValue(experimentsCount)
    })
  }

  function stopCalculation() {
    if (!calculationInProgress.value) return
    worker.post('cancel')
    calculationInProgress.value = false
  }

  return {
    calculate: startCalculation,
    result: currentResult,
    readyToCalculate,
    progress
  }

}