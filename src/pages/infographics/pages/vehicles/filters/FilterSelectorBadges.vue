<template>
  <BadgesLinePopover v-model="model" :tag-to-text="labelFor">
    <div class="filter-popover">
      <header class="popover-heading">
        <h2>{{ title }}</h2>
        <span class="selected-count">{{ model.size ? `Выбрано ${model.size}` : allLabel }}</span>
      </header>

      <div class="options nice-scrollbar">
        <button class="option all" type="button" :class="{ selected: model.size === 0 }"
          :aria-pressed="model.size === 0" @click="model = new Set()">
          {{ allLabel }}
        </button>

        <section v-for="group in groups" :key="group.title" class="category">
          <h3>{{ group.title }}</h3>
          <div class="tiles">
            <button v-for="option in group.options" :key="option.value" class="option" type="button"
              :class="{ selected: model.has(option.value) }" :aria-pressed="model.has(option.value)"
              @click="toggle(option.value)">
              {{ option.label }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </BadgesLinePopover>
</template>

<script setup lang="ts" generic="T extends string">
import BadgesLinePopover from '@/shared/game/selectors/components/badges/BadgesLinePopover.vue'

const props = defineProps<{
  title: string
  allLabel: string
  groups: readonly { title: string, options: readonly { value: T, label: string }[] }[]
}>()

const model = defineModel<Set<T>>({ required: true })

function labelFor(value: T) {
  return props.groups.flatMap(group => group.options).find(option => option.value === value)?.label ?? value
}

function toggle(value: T) {
  const next = new Set(model.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  model.value = next
}
</script>

<style scoped lang="scss">
.filter-popover {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(560px, calc(100vw - 24px));
  max-height: min(640px, 70dvh);

  @media (max-width: 550px) {
    max-height: 50dvh;
  }
}

.popover-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}

.selected-count {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  white-space: nowrap;
}

.options {
  min-height: 0;
  overflow-y: auto;
  margin-right: 3px;
  padding: 16px 13px 16px 16px;

  &::-webkit-scrollbar-track {
    margin-block: 10px;
  }
}

.category {
  margin-top: 16px;

  &+.category {
    margin-top: 20px;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 500;
  }
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr));
  gap: 6px;
}

.option {
  position: relative;
  min-width: 0;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  text-align: left;
  font-size: 14px;
  line-height: 1.2;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--blue-thin-color);
    outline-offset: 2px;
  }

  &.selected {
    background: rgba(255, 255, 255, 0.1);

    &::before {
      content: '';
      position: absolute;
      top: 7px;
      bottom: 7px;
      left: 0;
      width: 3px;
      border-radius: 3px;
      background: var(--blue-thin-color);
    }
  }
}

.all {
  width: 100%;
}
</style>
