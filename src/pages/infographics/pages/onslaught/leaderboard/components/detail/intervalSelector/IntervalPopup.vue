<template>
  <div class="interval-popup-container">
    <header>
      <h1>Интервал графика</h1>

      <SearchLine v-model="currentSearch" autofocus />
    </header>

    <div class="content">
      <div class="separator"></div>

      <div class="table-container nice-scrollbar">
        <!-- <TableView ref="table" :delegate /> -->
        <div class="content">
          <div class="section">
            <h5>Особенные</h5>
            <div class="items">
              <div class="item">Весь сезон</div>
              <div class="item">Эта неделя</div>
              <div class="item">Сегодня</div>
              <div class="item">Вчера</div>
            </div>
          </div>

          <div class="section">
            <h5>Недели</h5>
            <div class="items">
              <div class="item">Неделя 1</div>
              <div class="item">Неделя 2</div>
              <div class="item">Неделя 3</div>
            </div>
          </div>

          <div class="section">
            <h5>Дни</h5>
            <div class="items">
              <div class="item">День 1</div>
              <div class="item">День 2</div>
              <div class="item">День 3</div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-list" v-if="false">
        <h5>Ничего не найдено</h5>
        <button @click="currentSearch = ''">Очистить фильтр</button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import { ref } from 'vue'

const props = defineProps<{}>()


const currentSearch = ref('')
</script>


<style lang="scss" scoped>
.interval-popup-container {
  padding: 10px;
  padding-bottom: 0;

  header {
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 180px;

    h1 {
      font-size: 1em;
      margin: 0;
      margin-bottom: 10px;
    }
  }

  .content {
    position: relative;

    .separator {
      height: 1px;
      background-color: rgba(255, 255, 255, 0.1);
      margin: 0px -15px;
    }

    .table-container {
      height: 300px;
      overflow-y: auto;
      margin-right: -7px;

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.05);
      }

      &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &::-webkit-scrollbar-track {
        margin-block-end: 10px;
        margin-block-start: 35px;
      }
    }

    .empty-list {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      h5 {
        margin: 0;
        font-size: 1em;
        margin-top: -0.5em;
      }

      button {
        background-color: transparent;

        color: var(--blue-thin-color);
        font-size: 0.9em;
        border: none;
        transition: color 0.2s;

        &:hover {
          color: var(--blue-thin-color-hover);
        }
      }
    }
  }
}
</style>