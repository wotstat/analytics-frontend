import { computed, ref, watch, type Ref } from 'vue'
import { GameVendor } from '@/shared/game/wot'
import { ArenaOption } from './useArenaOptions'

// Управляемый выбор game+tag+gameplay, синхронизированный со списком доступных арен из useArenaOptions.
export function usePickedArena(arenaList: Ref<ArenaOption[]>, defaultTag?: string) {
  const selectedKey = ref('')

  watch(arenaList, (list) => {
    if (selectedKey.value && list.some(a => `${a.game}:${a.tag}` === selectedKey.value)) return
    const preferred = defaultTag ? list.find(a => a.tag === defaultTag) : undefined
    const fallback = preferred ?? list[0]
    if (fallback) selectedKey.value = `${fallback.game}:${fallback.tag}`
  }, { immediate: true })

  const game = computed<GameVendor>(() => (selectedKey.value.split(':')[0] as GameVendor) || 'mt')
  const tag = computed(() => selectedKey.value.split(':').slice(1).join(':') || '01_karelia')

  const gameplays = computed(() => arenaList.value.find(a => `${a.game}:${a.tag}` === selectedKey.value)?.gameplays ?? ['ctf'])

  const gameplay = ref('ctf')
  watch(gameplays, (list) => {
    if (!list.includes(gameplay.value)) gameplay.value = list[0] ?? 'ctf'
  }, { immediate: true })

  return { selectedKey, game, tag, gameplays, gameplay }
}
