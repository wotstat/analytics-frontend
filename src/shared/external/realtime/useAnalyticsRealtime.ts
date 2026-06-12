import { ANALYTICS_REALTIME_URL } from '@/shared/external/externalUrl'
import { useWebSocket, WebSocketStatus } from '@vueuse/core'
import { ref, ShallowRef, shallowRef, watch } from 'vue'

function numberProcessor(value: unknown) {
  return Number(value)
}

function jsonProcessor(value: unknown) {
  try {
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

type ChannelsTypes = {
  'time': number,
  'totalEvents': number,
  'comp7LastRecalculation': Record<string, { day: string, recalculation: string }> | null
}

const defaults = {
  'time': 0,
  'totalEvents': 0,
}

const processors = {
  'totalEvents': numberProcessor,
  'time': numberProcessor,
  'comp7LastRecalculation': jsonProcessor
}

type Channels = keyof ChannelsTypes;

type ChannelKey = Channels | string & {};


type Result<T> = { data: ShallowRef<T>, hasData: ShallowRef<boolean>, status: ShallowRef<WebSocketStatus> };

export function useAnalyticsRealtime<K extends Channels, T = ChannelsTypes[K]>(channel: K): Result<T>;
export function useAnalyticsRealtime<D>(channel: ChannelKey, defaultValue: D): Result<D>;
export function useAnalyticsRealtime<D>(channel: ChannelKey): Result<D | null>;
export function useAnalyticsRealtime<K extends ChannelKey, T = unknown>(channel: K, defaultValue?: T): Result<T | null> {

  const def = defaultValue ?? (defaults[channel as keyof typeof defaults] as T | null)
  const result = shallowRef<T | null>(def)
  const hasData = ref(false)

  const { data, status } = useWebSocket<T>(ANALYTICS_REALTIME_URL + '/' + channel, { autoReconnect: true })

  watch(data, (newData) => {
    if (newData === null || newData === undefined) result.value = def
    else {
      if (processors[channel as keyof typeof processors]) {
        const processor = processors[channel as keyof typeof processors] as (v: unknown) => T
        result.value = processor(newData)
      }
      else {
        result.value = newData as T
      }

      hasData.value = true
    }
  }, { immediate: true })

  return { data: result, hasData, status }
}