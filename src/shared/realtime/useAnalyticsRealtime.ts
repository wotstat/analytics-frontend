import { ANALYTICS_REALTIME_URL } from '@/shared/utils/externalUrl'
import { useWebSocket } from '@vueuse/core'
import { ref, ShallowRef, shallowRef, watch } from 'vue'


type ChannelsTypes = {
  'time': number,
  'totalEvents': number,
}

const defaults = {
  'time': 0,
  'totalEvents': 0,
}

type Channels = keyof ChannelsTypes;

type ChannelKey = Channels | string & {};


type Result<T> = { data: ShallowRef<T>, hasData: ShallowRef<boolean> };

export function useAnalyticsRealtime<K extends Channels, T = ChannelsTypes[K]>(channel: K): Result<T>;
export function useAnalyticsRealtime<D>(channel: ChannelKey, defaultValue: D): Result<D>;
export function useAnalyticsRealtime<D>(channel: ChannelKey): Result<D | null>;
export function useAnalyticsRealtime<K extends ChannelKey, T = unknown>(channel: K, defaultValue?: T): Result<T | null> {

  const def = defaultValue ?? (defaults[channel as keyof typeof defaults] as T | null)
  const result = shallowRef<T | null>(def)
  const hasData = ref(false)

  const { data } = useWebSocket<T>(ANALYTICS_REALTIME_URL + '/' + channel, { autoReconnect: true })

  watch(data, (newData) => {
    if (newData === null || newData === undefined) result.value = def
    else {
      result.value = newData as T
      hasData.value = true
    }
  }, { immediate: true })

  return { data: result, hasData, }
}