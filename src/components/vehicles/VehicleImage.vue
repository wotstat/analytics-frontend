<template>
  <FallbackImg
    :src="targetUrl"
    :fallback="fallbackUrl"
    :style
    :loading
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FallbackImg from '../fallbackImg/FallbackImg.vue';
import { STATIC_URL } from '@/utils/externalUrl';

const props = defineProps<{
  tag: string,
  size?: 'small' | 'preview' | 'shop'
  loading?: 'lazy' | 'eager'
}>();

const targetUrl = computed(() => {
  const name = props.tag.replace(':', '-');
  switch (props.size ?? 'preview') {
    case 'small': return `${STATIC_URL}/vehicles/small/${name}.png`;
    case 'preview': return `${STATIC_URL}/vehicles/preview/${name}.png`;
    case 'shop': return `${STATIC_URL}/vehicles/shop/${name}.png`;
  }
})

const fallbackUrl = computed(() => {
  switch (props.size ?? 'preview') {
    case 'small': return `${STATIC_URL}/vehicles/small/noImage.png`;
    case 'preview': return `${STATIC_URL}/vehicles/preview/noImage.png`;
    case 'shop': return `${STATIC_URL}/vehicles/preview/noImage.png`;
  }
})

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

  const offset = getOffset();
  if (offset == 0) return {}
  return {
    transform: `translateX(${offset}%)`,
    zIndex: -1
  }

})
</script>
