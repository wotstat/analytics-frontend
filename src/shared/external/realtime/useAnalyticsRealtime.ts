import { ANALYTICS_REALTIME_URL } from '@/shared/external/externalUrl'
import { useIntervalFn, useWebSocket, WebSocketStatus } from '@vueuse/core'
import { MaybeRefOrGetter, ref, ShallowRef, shallowRef, toValue, watch } from 'vue'

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

export type ChannelsTypes = {
  'time': number,
  'totalEvents': number,
  'comp7LastRecalculation': Record<string, { day: string, recalculation: string }> | null
  'battleResult': { id: string, battleMode: string, playerName: string, region: string }[]
  'comp7Info': { id: string, playerName: string, region: string, rating: number }[]
}

const defaults = {
  'time': 0,
  'totalEvents': 0,
}

const processors = {
  'time': numberProcessor,
  'totalEvents': numberProcessor,
  'comp7LastRecalculation': jsonProcessor,
  'battleResult': jsonProcessor,
  'comp7Info': jsonProcessor,
}

type Channels = keyof ChannelsTypes;

type ChannelKey = Channels | string & {};


type Result<T> = { data: ShallowRef<T>, hasData: ShallowRef<boolean>, status: ShallowRef<WebSocketStatus> };


function getChannelPath(channel: MaybeRefOrGetter<ChannelKey>) {
  const channelValue = toValue(channel)
  return String(channelValue).split('?')[0] as ChannelKey
}

export function useAnalyticsRealtime<K extends Channels, D = ChannelsTypes[K]>(channel: MaybeRefOrGetter<K>): Result<D>;
export function useAnalyticsRealtime<D>(channel: MaybeRefOrGetter<ChannelKey>, defaultValue: D, onDataChange?: (data: D) => void): Result<D>;
export function useAnalyticsRealtime<D>(channel: MaybeRefOrGetter<ChannelKey>): Result<D | null>;
export function useAnalyticsRealtime<K extends ChannelKey, D = unknown>(
  channel: MaybeRefOrGetter<K>,
  defaultValue?: D,
  onDataChange?: (data: D) => void): Result<D | null> {

  const def = defaultValue ?? (defaults[getChannelPath(channel) as keyof typeof defaults] as D | null)
  const result = shallowRef<D | null>(def)
  const hasData = ref(false)

  let lastMessageChannel: string | null = null

  const { data, status } = useWebSocket<D>(() => ANALYTICS_REALTIME_URL + '/' + toValue(channel), {
    autoReconnect: true,
    onMessage: () => lastMessageChannel = toValue(channel),
    heartbeat: {
      scheduler: cb => useIntervalFn(cb, 5000),
    }
  })

  watch(() => toValue(channel), () => {
    result.value = def
  })

  watch(() => [toValue(data), toValue(channel)], ([newData, newChannel]) => {
    if (newData === 'pong') return

    if (newData === null || newData === undefined || lastMessageChannel !== newChannel) {
      result.value = def
      hasData.value = false
    }
    else {
      const channelPath = getChannelPath(channel)
      if (processors[channelPath as keyof typeof processors]) {
        const processor = processors[channelPath as keyof typeof processors] as (v: unknown) => D
        result.value = processor(newData)
      }
      else {
        result.value = newData as D
      }

      hasData.value = true
    }
  }, { immediate: true })

  watch(result, (newResult) => {
    if (newResult !== null && newResult !== undefined) {
      onDataChange?.(newResult)
    }
  })

  return { data: result, hasData, status }
}
