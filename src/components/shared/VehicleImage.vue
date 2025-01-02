<template>
  <FallbackImg :src="targetUrl" :fallback="fallbackUrl" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FallbackImg from '../FallbackImg.vue';

const staticUrl = import.meta.env.VITE_STATIC_URL;

const props = defineProps<{
  tag: string,
  size?: 'small' | 'preview' | 'shop'
}>();

const targetUrl = computed(() => {
  const name = props.tag.replace(':', '-');
  switch (props.size ?? 'preview') {
    case 'small': return `${staticUrl}/vehicles/small/${name}.png`;
    case 'preview': return `${staticUrl}/vehicles/preview/${name}.png`;
    case 'shop': return `${staticUrl}/vehicles/shop/${name}.png`;
  }
})

const fallbackUrl = computed(() => {
  switch (props.size ?? 'preview') {
    case 'small': return `${staticUrl}/vehicles/small/noImage.png`;
    case 'preview': return `${staticUrl}/vehicles/preview/noImage.png`;
    case 'shop': return `${staticUrl}/vehicles/shop/noImage.png`;
  }
})
</script>