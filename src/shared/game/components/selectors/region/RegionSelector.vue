<template>
  <OptionButtons
    :options="regions"
    :model-value
    :selected
    :allow-empty="false"
    class="mt-font"
    @update:model-value="emit('update:modelValue', $event)"
    @update:selected="emit('update:selected', $event)" />
</template>

<script setup lang="ts">
import { regions, type QueryRegion } from '@/shared/game/domain/region/regions'
import OptionButtons from '@/shared/uiKit/selection/OptionButtons.vue'

defineProps<{ modelValue?: QueryRegion, selected?: readonly QueryRegion[] }>()
const emit = defineEmits<{ 'update:modelValue': [QueryRegion], 'update:selected': [QueryRegion[]] }>()
</script>
