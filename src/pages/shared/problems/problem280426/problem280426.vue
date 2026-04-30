<template>

  <ModalWindow :title="'Недоступность серверов'" :display="visible" @close="visible = false">

    <template #header-content>

      <div class="info">
        <p>
          28 апреля 2026 года с 15:30 МСК сервер WotStat стал недоступен.
          <br>
          <br>
          <b>На данный момент проблема устранена.</b>
        </p>
        <p>
          Дело было в проблемах с сетью в дата-центе. (сервер работал, но у него не было доступа в интернет)
        </p>

        <br>

        <p><i>Было компенсировано четыре дня лицензии пользователям мода на позиции.</i></p>

        <br>
      </div>

    </template>

    <template #default>
      <div class="events">
        <div class="event red">
          <div class="time">15:30 МСК</div>
          <div class="content">Обнаружена проблема</div>
        </div>

        <div class="event orange">
          <div class="time">16:01 МСК</div>
          <div class="content">Обращение в поддержку дата-центра</div>
        </div>


        <div class="event orange">
          <div class="time">22:56 МСК</div>
          <div class="content">Решение всё ещё не найдено, вероятнее всего недоступность IP адреса (внутри сети
            дата-центра нет интернета у сервера)</div>
        </div>

        <div class="event red">
          <div class="time">14:22 МСК</div>
          <div class="content">Поддержка перезапустила сервер и признала что сейчас очень высокая нагрузка поддержки,
            из-за чего долгие ответы. Перезагрузка не помогла. Продолжаю ждать решения от дата-центра</div>
        </div>

        <div class="event blue">
          <div class="time">18:59 МСК</div>
          <div class="content">Связался менеджер хостинга</div>
        </div>

        <div class="event green">
          <div class="time">20:38 МСК</div>
          <div class="content">Доступность сервера восстановлена</div>
        </div>


        <!-- <div class="event orange">
          <div class="time">16:45 МСК</div>
          <div class="content">
            Ответ от поддержки дата-центра:
            <blockquote>
              Здравствуйте.
              В данный момент имеются затруднения с доступностью выделенных серверов.
              Наши специалисты уже занимаются этим вопросом на данный момент. Как появится новая информация мы вас
              уведомим. Приносим свои извинения за неудобства.
            </blockquote>

            Утилита traceroute показывает, что запрос прерывается на blocked.hetzner.com.
          </div>
        </div> -->
      </div>
    </template>

  </ModalWindow>
</template>


<script setup lang="ts">
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
const props = defineProps<{}>()
const visible = defineModel<boolean>({ default: false })
</script>


<style lang="scss" scoped>
.info {
  padding: 0 15px;
  padding-bottom: 10px;
}

.event {
  display: flex;
  flex-direction: row;
  margin-bottom: 1em;
  gap: 1em;
  border-left: 3px solid red;

  &.red {
    border-color: red;
  }

  &.orange {
    border-color: orange;
  }

  &.green {
    border-color: rgb(67, 206, 67);
  }

  &.blue {
    border-color: deepskyblue;
  }

  .time {
    font-weight: bold;
    text-wrap: nowrap;
    white-space: pre;
    margin-left: 1em;
    font-variant-numeric: tabular-nums;
  }

  .content {
    flex-grow: 1;

    blockquote {
      margin: 0.5em 0;
      padding-left: 1em;
      border-left: 3px solid rgba(255, 255, 255, 0.2);
    }
  }
}
</style>