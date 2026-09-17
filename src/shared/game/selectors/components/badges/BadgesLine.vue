<template>
  <div class="badges">
    <Badge :text="tagToText?.(tag) ?? `${tag}`" :key="tagToKey?.(tag) ?? `${tag}`" closable v-for="tag in [...selected]"
      @close="onRemove(tag)" />
    <template v-if="showAddButton">
      <button class="select" @click="openSelect" v-if="selected.size == 0">
        <p>выбрать</p>
      </button>
      <button class="add" @click="openSelect" v-else>
        <PlusIcon class="plus-icon" />
      </button>
    </template>
  </div>
</template>


<script setup lang="ts" generic="T">
import Badge from './Badge.vue'
import PlusIcon from '@/assets/icons/plus-bold.svg'

const props = defineProps<{
  tagToText?: (tag: T) => string,
  tagToKey?: (tag: T) => string,
  showAddButton?: boolean
}>()

const selected = defineModel<Set<T>>({ default: () => new Set() })
const emit = defineEmits<{
  (e: 'openSelectModal'): void
}>()

function openSelect() {
  emit('openSelectModal')
}

function onRemove(tag: T) {
  selected.value.delete(tag)
}

</script>


<style lang="scss" scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;


  .select,
  .add {
    height: 24px;
    box-sizing: border-box;
    border-radius: 5px;
    color: rgba(255, 255, 255, 0.95);
    background-color: rgba(255, 255, 255, 0.1);
    transition: color 0.15s, background-color 0.15s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
  }

  .select {
    padding: 0 9px;
    line-height: 1;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .add {
    width: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .plus-icon {
      display: block;
      height: 12px;
      fill: currentColor;
    }
  }

}
</style>
