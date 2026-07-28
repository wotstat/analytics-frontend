<template>
  <div class="debug-index">
    <header class="head">
      <h1>Технические фичи</h1>
      <p class="description">
        Песочница компонентов проекта: на каждой странице собраны варианты применения, которые можно потыкать руками.
        Страница открыта, но ссылок на неё с сайта нет и в поисковый индекс она не отдаётся.
      </p>
    </header>

    <section class="group" v-for="group in debugGroups" :key="group.value">
      <h2>{{ group.title }}</h2>

      <div class="cards">
        <RouterLink class="page-card" v-for="page in pagesByGroup(group.value)" :key="page.path" :to="page.path">
          <span class="title">{{ page.title }}</span>
          <span class="description">{{ page.description }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>


<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { debugGroups, debugPages, type DebugGroup } from './routes'

function pagesByGroup(group: DebugGroup) {
  return debugPages.filter(page => page.group === group)
}

</script>


<style scoped lang="scss">
.debug-index {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.5em;

  h1 {
    font-size: 1.8em;
    line-height: 1.2;
    margin: 0;
  }

  .description {
    font-size: 14px;
    color: #ffffffb5;
    max-width: 80ch;
    line-height: 1.5;
  }
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  margin-bottom: 2em;

  h2 {
    font-size: 1.1em;
    margin: 0;
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75em;
}

.page-card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  color: inherit;
  background: #ffffff0a;
  border-radius: 10px;
  padding: 0.8em 1em;

  &:hover {
    color: inherit;
    background: #ffffff17;
  }

  .title {
    font-weight: var(--medium-bold-weight, 600);
  }

  .description {
    font-size: 12px;
    color: #ffffffb5;
    line-height: 1.45;
  }
}
</style>
