<template>
  <div class="debug-root">
    <nav class="nav">
      <RouterLink class="chip index" :class="{ active: isIndex }" to="/debug">Все фичи</RouterLink>

      <div class="group" v-for="group in debugGroups" :key="group.value">
        <span class="group-title">{{ group.title }}</span>

        <RouterLink class="chip" :class="{ active: route.path === page.path }" v-for="page in pagesByGroup(group.value)"
          :key="page.path" :to="page.path">
          {{ page.title }}
        </RouterLink>
      </div>
    </nav>

    <div class="content">
      <RouterView />
    </div>
  </div>
</template>


<script setup lang="ts">
import { useMeta } from '@/shared/composition/useMeta'
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { debugGroups, debugPages, type DebugGroup } from './routes'
import { useNoIndex } from './shared/useNoIndex'

const route = useRoute()

useMeta({ title: 'Debug — wotstat.info' })
useNoIndex()

const isIndex = computed(() => route.path.replace(/\/$/, '') === '/debug')

function pagesByGroup(group: DebugGroup) {
  return debugPages.filter(page => page.group === group)
}

</script>

<style lang="scss">
@use './shared/debug.scss';
</style>


<style scoped lang="scss">
@use '@/styles/mixins.scss' as *;

.debug-root {
  margin: 0 auto;
  padding: 1rem;
  max-width: 1600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5em 1em;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ffffff20;

  .group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;

    .group-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #ffffff86;
      margin-right: 0.2em;
    }
  }

  .chip {
    font-size: 13px;
    color: inherit;
    // border: 1px solid #ffffff20;
    border-radius: 999px;
    padding: 0.25em 0.7em;
    white-space: nowrap;

    &:hover {
      color: inherit;
      background: #ffffff12;
      border-color: #ffffff35;
    }

    &.active {
      color: white;
      background: #ffffff16;
    }

    &.index {
      font-weight: var(--medium-bold-weight, 600);
    }
  }
}
</style>
