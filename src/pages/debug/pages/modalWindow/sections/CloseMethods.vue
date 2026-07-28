<template>
  <DebugSection title="Способы закрытия" id="close-methods"
    description="Крестик, клик по фону и Escape ведут в один generic-эмит close без указания причины. Причину ниже вычисляет сама страница эвристикой снаружи компонента — это не часть публичного API."
    source="src/shared/ui/modalWindow/ModalWindowContent.vue">

    <div class="debug-row">
      <button class="debug-btn" @click="open">Открыть</button>
      <span class="debug-hint">Закрой крестиком, кликом по тёмному фону и клавишей Escape — по очереди.</span>
    </div>

    <ModalWindow title="Закрой меня любым способом" :display="display" @close="handleClose">
      <p>Клик по этой карточке закрывать не должен — только клик по затемнённому фону вокруг.</p>
      <button class="debug-btn" @click="push('клик внутри карточки — close не пришёл сам собой')">
        Кликни здесь — окно не закроется
      </button>
    </ModalWindow>

    <EventLog :entries="entries" @clear="clear" title="Лог закрытий" empty="Открой окно и закрой его любым способом" />

    <table class="debug-table">
      <thead>
        <tr>
          <th>способ</th>
          <th>поддержан по коду</th>
          <th>чем управляется</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>крестик (CloseButton)</th>
          <td class="true">да</td>
          <td>ModalWindowContent, слот controls + @click</td>
        </tr>
        <tr>
          <th>клик по фону</th>
          <td class="true">да</td>
          <td>ModalWindowContent, @click на .background</td>
        </tr>
        <tr>
          <th>Escape</th>
          <td class="true">да</td>
          <td>ModalWindowContent, onKeyDown('Escape') из vueuse, слушает пока смонтирован</td>
        </tr>
        <tr>
          <th>клик по самой карточке</th>
          <td class="false">не закрывает (и не должен)</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Нет ни одного пропа, чтобы отключить фон-клик или Escape по отдельности — они либо есть все три сразу, либо
      приходится обходить компонент целиком (см. ModalWindowContent напрямую в секции «Базовое окно»).
    </p>

    <p class="debug-note">
      Причину в логе выше страница определяет сама: слушает <span class="debug-value">pointerdown</span> и
      <span class="debug-value">keydown</span> на <span class="debug-value">window</span> в фазе перехвата и смотрит,
      по какому элементу («.background», «.controls» — реальные внутренние классы компонента) пришёлся клик
      непосредственно перед событием close. Наружу компонент это не отдаёт — обычному потребителю причина закрытия
      недоступна.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ModalWindow from '@/shared/ui/modalWindow/ModalWindow.vue'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'

const display = ref(false)
const { entries, push, clear } = useEventLog()

let lastReason = 'причина не определена'

function onPointerDown(event: PointerEvent) {
  const target = event.target as Element
  if (target.closest('.background')) lastReason = 'клик по фону'
  else if (target.closest('.controls')) lastReason = 'крестик'
  else lastReason = 'клик внутри карточки (не должен был дойти до close)'
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') lastReason = 'Escape'
}

function open() {
  display.value = true
  lastReason = 'причина не определена'
  push('открыто')
  window.addEventListener('pointerdown', onPointerDown, true)
  window.addEventListener('keydown', onKeydown, true)
}

function handleClose() {
  push(`закрыто — ${lastReason}`)
  display.value = false
  window.removeEventListener('pointerdown', onPointerDown, true)
  window.removeEventListener('keydown', onKeydown, true)
}
</script>
