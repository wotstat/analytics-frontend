<template>
  <FallbackImg :src="targetUrl" :fallback="fallbackUrl" :style :loading />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FallbackImg from '../fallbackImg/FallbackImg.vue';
import { STATIC_URL } from '@/utils/externalUrl';

const props = defineProps<{
  tag: string,
  size?: 'small' | 'preview' | 'shop'
  loading?: 'lazy' | 'eager'
}>();

function getTargetTag() {
  const name = props.tag.split(':').at(-1)?.toLowerCase();
  switch (props.size ?? 'preview') {
    case 'small': return `${STATIC_URL}/mt/latest/vehicles/small/${name}.webp`;
    case 'preview': return `${STATIC_URL}/mt/latest/vehicles/preview/${name}.webp`;
    case 'shop': return `${STATIC_URL}/mt/latest/vehicles/shop/${name}.webp`;
  }
}

const targetUrl = ref(getTargetTag());

watch(() => [props.tag, props.size], () => {
  targetUrl.value = getTargetTag();
});

const fallbackUrl = computed(() => {
  switch (props.size ?? 'preview') {
    case 'small': return `${STATIC_URL}/mt/latest/vehicles/small/no-image.webp`;
    case 'preview': return `${STATIC_URL}/mt/latest/vehicles/preview/no-image.webp`;
    case 'shop': return `${STATIC_URL}/mt/latest/vehicles/preview/no-image.webp`;
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
