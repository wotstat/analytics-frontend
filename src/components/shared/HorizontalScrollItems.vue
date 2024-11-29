<template>
  <div class="items-scroll">
    <div class="items-list">
      <div class="card" v-for="item in items" @click="e => onClick(e, item.key)"
        :class="selectable && selected?.includes(item.key) ? 'selected' : ''">
        <slot :item="item"></slot>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts" generic="T extends { key: string }">
const props = defineProps<{
  items: T[],
  selectable?: boolean
}>()

const selected = defineModel<string[]>('selected')

function onClick(e: MouseEvent, tag: string) {
  if (!props.selectable) return;
  const currentTanks = selected.value || [];
  if (currentTanks.includes(tag)) {
    selected.value = currentTanks.filter(t => t !== tag);
  } else if (e.ctrlKey || e.metaKey) {
    selected.value = [...currentTanks, tag];
    // const target = { ...route.query, tank: [...currentTanks, tag].join(',') };
    // router.push({ query: target });
  } else {
    selected.value = [tag];
    // router.push({ query: { ...route.query, tank: tag } });
  }
}
</script>


<style lang="scss" scoped>
@use '/src/styles/textColors.scss' as *;
@use '/src/styles/table.scss' as *;
@use '/src/styles/variables.scss' as *;

.items-scroll {
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: $background-secondary;
    box-shadow: 0 1px 2px 0px rgb(0, 0, 0, 0.1);
    border-radius: 10px;
    cursor: pointer;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #464646;
  }

  .items-list {
    display: flex;
    gap: 10px;
    padding: 10px;

    .card {
      cursor: pointer;
      border: 2px solid transparent;

      &.selected {
        border: 2px solid #fffbe7;
        filter: drop-shadow(0 0 3px #d66d08);
      }
    }
  }
}
</style>