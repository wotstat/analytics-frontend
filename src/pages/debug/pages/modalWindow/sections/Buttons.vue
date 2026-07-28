<template>
  <DebugSection title="Кнопки" id="buttons"
    description="CircleButton, LabelButton, CloseButton — без своей логики состояний. Смотри, чего не хватает: disabled, размеров, aria-label — и что class=&quot;icon&quot; у CircleButton — необходимый, но нигде не описанный контракт."
    source="src/shared/ui/modalWindow/buttons/">

    <table class="debug-table">
      <thead>
        <tr>
          <th>компонент</th>
          <th>пропсы</th>
          <th>что рисует</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>CircleButton</th>
          <td>нет — только слот и click</td>
          <td>круглая кнопка 30×30, фон меняется по hover</td>
        </tr>
        <tr>
          <th>LabelButton</th>
          <td>text, bold?</td>
          <td>текстовая кнопка, цвет из --accent-color</td>
        </tr>
        <tr>
          <th>CloseButton</th>
          <td>нет</td>
          <td>CircleButton + иконка x.svg</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-col">
      <span class="debug-label">CircleButton — содержимому вручную задан класс .icon (как задумано)</span>
      <div class="debug-row">
        <CircleButton @click="push('circle: X (с .icon)')">
          <XIcon class="icon" />
        </CircleButton>
        <CircleButton @click="push('circle: + (с .icon)')"><span class="icon glyph">+</span></CircleButton>
        <CircleButton @click="push('circle: A (с .icon)')"><span class="icon glyph">A</span></CircleButton>
      </div>

      <span class="debug-label">CircleButton — тот же контент, но без класса .icon (ломаем нарочно)</span>
      <div class="debug-row">
        <CircleButton @click="push('circle: X (без .icon)')">
          <XIcon />
        </CircleButton>
        <CircleButton @click="push('circle: A (без .icon, крупный шрифт)')"><span class="glyph oversized">A</span>
        </CircleButton>
      </div>
      <p class="debug-note">
        Правило <span class="debug-value">:deep(.icon)</span> внутри CircleButton задаёт 16×16 только содержимому с
        классом <span class="debug-value">icon</span>. Компонент это нигде не проверяет и не документирует — без
        класса контент рисуется в собственном размере и может вылезти за пределы круга 30×30, как во второй строке.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">LabelButton</span>
      <div class="debug-row">
        <LabelButton text="Обычная" @click="push('label: обычная')" />
        <LabelButton text="Жирная" bold @click="push('label: жирная')" />
        <div class="accent-scope">
          <LabelButton text="Свой цвет через --accent-color" @click="push('label: свой цвет')" />
        </div>
      </div>
      <div class="debug-stage short">
        <LabelButton
          text="Очень длинный текст кнопки — проверяем перенос строки, ширины и text-overflow у компонента нет вовсе"
          @click="push('label: длинный текст')" />
      </div>
      <p class="debug-note">
        Ни ширины, ни <span class="debug-value">white-space: nowrap</span>, ни обрезки текста нет — длинный
        <span class="debug-value">text</span> просто переносится браузером по словам.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">CloseButton</span>
      <div class="debug-row">
        <CloseButton @click="push('close-button')" />
      </div>
    </div>

    <div class="debug-col">
      <span class="debug-label">Много кнопок подряд (как в шапке модалки)</span>
      <div class="debug-row buttons-line">
        <CircleButton v-for="n in 8" :key="n" @click="push(`circle #${n}`)"><span class="icon glyph">{{ n }}</span>
        </CircleButton>
        <CloseButton @click="push('close-button (в ряду)')" />
      </div>
    </div>

    <EventLog :entries="entries" @clear="clear" title="Клики" empty="Понажимай кнопки выше" />

    <p class="debug-note">
      Ни у одной из трёх кнопок нет <span class="debug-value">disabled</span>, размера или
      <span class="debug-value">aria-label</span> — CircleButton и CloseButton визуально неотличимы от иконки без
      подписи для скринридера.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import CircleButton from '@/shared/ui/modalWindow/buttons/CircleButton.vue'
import LabelButton from '@/shared/ui/modalWindow/buttons/LabelButton.vue'
import CloseButton from '@/shared/ui/modalWindow/buttons/closeButton/CloseButton.vue'
import XIcon from '@/shared/ui/modalWindow/buttons/closeButton/x.svg'
import EventLog from '../shared/EventLog.vue'
import { useEventLog } from '../shared/useEventLog'

const { entries, push, clear } = useEventLog()
</script>


<style scoped lang="scss">
.glyph {
  font-size: 13px;
  line-height: 1;
}

.oversized {
  font-size: 34px;
  line-height: 1;
}

.accent-scope {
  --accent-color: #4ade80;
  --accent-color-hover: #22c55e;
}

.buttons-line {
  align-items: center;
}
</style>
