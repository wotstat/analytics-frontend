<template>
  <label class="debug-control">
    <span class="debug-label">{{ label ?? 'placement' }}</span>

    <select v-model="placement">
      <option v-if="allowNone" :value="null">— нет —</option>
      <option v-for="variant in placementWithModifiersVariants" :key="variant" :value="variant">{{ variant }}</option>
    </select>
  </label>
</template>


<script setup lang="ts">
import { placementWithModifiersVariants, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'

defineProps<{
  label?: string
  allowNone?: boolean
}>()

// null допустим — иначе не выразить «параметр не задан».
const placement = defineModel<PlacementWithModifiers | null>({ required: true })

</script>
