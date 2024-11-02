<template>
  <div class="popup-container">
    <p>Виджет отображает среднее количество очков за серию для всех совзводных, а так же персональные результаты за
      прошлый бой</p>
    <p>Игровые ники загрузятся после завершения первого боя</p>
    <div class="preview">
      <img src="@/assets/widgets/screenPart.png" alt="">
      <div class="widget-container">
        <ChuckNorris class="widget" />
      </div>
    </div>

    <template v-if="params.player">
      <p>Добавьте источник <b>"браузер"</b> в OBS и вставьте туда следующую ссылку:</p>
      <br>
      <div class="url">
        {{ getWidgetUrl() }}
      </div>
      <br>
      <button @click="copyWidgetLink">Скопировать</button>
      <br>
      <br>
      <i>Ссылку можно показывать кому угодно, ничего секретного в ней нет</i>
    </template>
    <p v-else><b>Необходимо в фильтрах указать ник игрока (шестерёнка рядом с заголовком)</b></p>
  </div>
</template>

<script setup lang="ts">
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import ChuckNorris from './ChuckNorris.vue';

const params = useQueryStatParams()

function getWidgetUrl() {
  return window.location.origin + '/widget/chuck-norris' + window.location.search
}

function copyWidgetLink() {
  navigator.clipboard.writeText(getWidgetUrl())
}

</script>

<style lang="scss" scoped>
.popup-container {
  max-width: 700px;

  .preview {
    position: relative;
    width: 100%;
    overflow: hidden;
    margin: 20px 0;

    img {
      width: 100%;
      border-radius: 10px;
    }

    .widget-container {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;

      display: flex;
      justify-content: center;
      align-items: center;

      .widget {
        font-size: 5.2px;

        &.solo {
          font-size: 8px;
        }

        max-width: 400px;
        box-sizing: border-box;
      }
    }
  }

  .url {
    background-color: #1a1a1a;
    border-radius: 10px;
    padding: 10px;
    overflow: auto;
    // white-space: nowrap;
  }
}
</style>