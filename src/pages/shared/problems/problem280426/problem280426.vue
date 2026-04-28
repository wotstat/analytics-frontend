<template>

  <ModalWindow :title="'Недоступность серверов'" :display="visible" @close="visible = false">

    <template #header-content>

      <div class="info">
        <p>
          28 апреля 2026 года с 15:30 МСК сервер WotStat стал недоступен для запросов.
          <b>На данный момент причина не устранена. Идёт поиск решения.</b>
        </p>

        <br>

        <p><i>Дни лицензии мода на позиции будут компенсированы.</i></p>

        <br>

        <p>
          Вся актуальная информация о проблеме будет добавлена сюда по мере поступления.
        </p>
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