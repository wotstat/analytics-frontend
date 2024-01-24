<template>
  <div class="header">
    <router-link to="/statistics">Исходные данные</router-link>
    <router-link to="/statistics/summary">Сводка</router-link>
    <router-link to="/statistics">Аналитика</router-link>
  </div>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;

  a {
    color: #333;
    text-decoration: none;

    &:hover {
      color: #000;
    }
  }
}
</style>
