<template>
  <img :src="icon" :alt="nation">
</template>


<script setup lang="ts">
import { computed } from 'vue';


type AllowedIcon = 'ussr' | 'china' | 'czech' | 'france' | 'germany' | 'italy' | 'japan' | 'poland' | 'sweden' | 'uk' | 'usa'

const props = defineProps<{
  nation: AllowedIcon | string,
}>()


const icons = import.meta.glob<{ default: string }>('./60x40/*.png', { eager: true })
const icon = computed(() => icons[`./60x40/${props.nation}.png`]?.default ?? '')

</script>


<style lang="scss" scoped></style>