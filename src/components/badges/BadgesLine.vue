<template>
  <div class="badges">
    <Badge :text="tagToText?.(tag) ?? tag" :key="tag" closable v-for="tag in [...selected]" @close="onRemove(tag)" />
    <button class="select" @click="openSelect" v-if="selected.size == 0">
      <p>выбрать</p>
    </button>
    <button class="add" @click="openSelect" v-else>
      <PlusIcon class="plus-icon" />
    </button>
  </div>
</template>


<script setup lang="ts">
import Badge from '@/components/badges/Badge.vue'
import PlusIcon from '@/assets/icons/plus-bold.svg'

const props = defineProps<{
  tagToText?: (tag: string) => string
}>()

const selected = defineModel<Set<string>>({ default: new Set() })
const emit = defineEmits<{
  (e: 'openSelectModal'): void
}>()

function openSelect() {
  emit('openSelectModal')
}

function onRemove(tag: string) {
  selected.value.delete(tag)
}

</script>


<style lang="scss" scoped>
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2em;


  .select,
  .add {
    height: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    transition: background-color 0.2s;
    border-radius: 1em;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .select {
    padding: 2px 8px;
    line-height: 1;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
  }

  .add {
    width: 20px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .plus-icon {
      display: block;
      height: 11px;
      fill: currentColor;
    }
  }

}
</style>