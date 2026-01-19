<template>

  <ModalWindow :title="'Недоступность серверов'" :display="visible" @close="visible = false">

    <template #default>

      <div class="info">
        <p>
          19 января 2026 года с 16:00 МСК сервер WotStat стал недоступен из-за проблем в дата-центре. На данный момент
          проблема не устранена.
        </p>

        <br>

        <p>
          Выделенный сервер арендуется у компании Aeza и размещается в дата-центре Hetzner в Финляндии.
        </p>
        <br>
        <p>
          В этом разделе представлена хронология событий, связанных с инцидентом.
        </p>
      </div>

      <hr>

      <div class="events">
        <div class="event red">
          <div class="time">16:00 МСК</div>
          <div class="content">Обнаружена проблема</div>
        </div>

        <div class="event red">
          <div class="time">16:20 МСК</div>
          <div class="content">Попытка жесткой перезагрузки сервера не привела к успеху</div>
        </div>

        <div class="event orange">
          <div class="time">16:44 МСК</div>
          <div class="content">Обращение в поддержку дата-центра</div>
        </div>

        <div class="event orange">
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
        </div>

        <div class="event green">
          <div class="time">17:00 МСК</div>
          <div class="content">Восстановлена работа сайта в резервном режиме (с отображением этого сообщения)</div>
        </div>

        <div class="event blue">
          <div class="time">17:30 МСК</div>
          <div class="content">Вероятнее всего проблема связана с отвязкой IP-адреса от физического сервера. То есть сам
            сервер работает, но не доступен по сети</div>
        </div>

        <div class="event green">
          <div class="time">19:20 МСК</div>
          <div class="content">Добавлено информационное сообщение в мод позиций</div>
        </div>

        <div class="event orange">
          <div class="time">19:28 МСК</div>
          <div class="content">Обращение в поддержку дата-центра с уточнением статуса. <b>Пока ответа нет.</b></div>
        </div>

        <div class="event green">
          <div class="time">22:30 МСК</div>
          <div class="content">Добавлена страница с хронологией проблемы</div>
        </div>
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