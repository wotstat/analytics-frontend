<template>
  <section class="debug-section" :id="anchor">
    <header class="head">
      <h2>
        <a :href="`#${anchor}`">{{ title }}</a>
      </h2>
      <p class="debug-hint" v-if="description">{{ description }}</p>
      <p class="debug-path" v-if="source">{{ source }}</p>
    </header>

    <div class="body">
      <slot></slot>
    </div>
  </section>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  source?: string
  id?: string
}>()

const anchor = computed(() => props.id ?? slugify(props.title))

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

</script>


<style scoped lang="scss">
.debug-section {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  scroll-margin-top: calc(var(--header-height, 0px) + 1rem);
  margin-bottom: 2em;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.3em;
  border-bottom: 1px solid #ffffff20;
  padding-bottom: 0.4em;

  h2 {
    font-size: 1.1em;
    line-height: 1.2;
    margin: 0;

    a {
      color: inherit;

      &:hover {
        color: var(--blue-thin-color);
      }
    }
  }
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}
</style>
