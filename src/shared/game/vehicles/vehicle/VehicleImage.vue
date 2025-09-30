<template>
  <FallbackImg :src="targetUrl" :fallback="fallbackUrl" :style :loading />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FallbackImg from '@/shared/uiKit/fallbackImg/FallbackImg.vue'
import { vehicleFallbackUrl, vehicleUrl } from './utils'
import { GameVendor } from '../../wot'

const props = defineProps<{
  tag: string,
  size?: 'small' | 'preview' | 'shop'
  game?: GameVendor
  loading?: 'lazy' | 'eager'
}>()


const targetUrl = ref(vehicleUrl(props.tag, props.size, props.game))

watch(() => [props.tag, props.size, props.game], () => {
  targetUrl.value = vehicleUrl(props.tag, props.size, props.game)
})

const fallbackUrl = computed(() => vehicleFallbackUrl(props.size))

const style = computed(() => {
  if (props.size != 'small') return {}


  function getOffset() {
    switch (props.tag) {
      case 'ussr:R46_KV-13_SH':
      case 'usa:A72_T25_2_SH':
      case 'uk:GB107_Cavalier_SH':
      case 'sweden:S14_Ikv_103_SH':
      case 'poland:Pl17_DS_PZlnz_SH':
      case 'germany:G24_VK3002DB_SH':
      case 'france:F43_AMC_35_SH':
      case 'china:Ch24_Type64_SH':
        return -35
      default: return 0
    }
  }

  const offset = getOffset()
  if (offset == 0) return {}
  return {
    transform: `translateX(${offset}%)`,
    zIndex: -1
  }

})
</script>
