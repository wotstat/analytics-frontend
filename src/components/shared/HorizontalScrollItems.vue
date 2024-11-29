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

      // table {
      //   width: 100%;

      //   th {
      //     text-align: left;
      //     font-weight: 300;
      //     margin-left: 5px;
      //     color: #bababa;
      //   }

      //   td {
      //     text-align: right;
      //   }
      // }

      &.selected {
        border: 2px solid #fffbe7;
        filter: drop-shadow(0 0 3px #d66d08);
      }

      // .tank-name {
      //   font-weight: bold;
      //   text-align: center;
      //   white-space: nowrap;
      //   overflow: hidden;
      //   text-overflow: ellipsis;
      //   margin-top: -10px;
      //   margin-bottom: 5px;
      //   width: 150px;

      //   &.skeleton {
      //     width: 100%;
      //     height: 25px;
      //     margin-top: 0;
      //     border-radius: 5px;
      //     @include text-skeleton(#8181813e, #aaaaaa3e)
      //   }
      // }

      // img, .img, .img.skeleton {
      //   width: 150px;
      //   aspect-ratio: 16/10;
      //   margin: 7px 0;
      //   pointer-events: none;
      //   user-select: none;

      //   text-align: center;
      //   line-height: 100%;
      //   font-size: 3em;
      //   color: #bababa97;
      //   font-size: 10px;

      //   &.flex {
      //     justify-content: center;
      //     align-items: center;
      //   }

      //   span {
      //     filter: drop-shadow(0px 4px 6px black);
      //   }

      //   &.skeleton {
      //     border-radius: 5px;
      //     border: none;
      //     outline: none;
      //     @include text-skeleton(#8181813e, #aaaaaa3e)
      //   }
      // }
    }
  }
}
</style>