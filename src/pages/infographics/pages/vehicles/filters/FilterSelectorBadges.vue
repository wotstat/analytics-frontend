<template>
  <BadgesLinePopover v-model="model" :tag-to-text="labelFor">
    <div class="options deep-nice-scrollbar">
      <label class="option all">
        <input type="checkbox" :checked="model.size === 0" @change="model = new Set()">
        {{ allLabel }}
      </label>
      <label v-for="option in options" :key="option.value" class="option">
        <input type="checkbox" :checked="model.has(option.value)" @change="toggle(option.value)">
        {{ option.label }}
      </label>
    </div>
  </BadgesLinePopover>
</template>

<script setup lang="ts" generic="T extends string">
import BadgesLinePopover from '@/shared/game/selectors/components/badges/BadgesLinePopover.vue'

const props = defineProps<{
  allLabel: string
  options: readonly { value: T, label: string }[]
}>()

const model = defineModel<Set<T>>({ required: true })

function labelFor(value: T) {
  return props.options.find(option => option.value === value)?.label ?? value
}

function toggle(value: T) {
  const next = new Set(model.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  model.value = next
}
</script>

<style scoped lang="scss">
.options {
  padding: 6px;
  max-width: min(360px, calc(100vw - 40px));
  max-height: min(360px, 60dvh);
  overflow-y: auto;
  font-size: 14px;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  input {
    margin: 0;
    accent-color: var(--blue-color);
  }
}

.all {
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 9px;
}
</style>
