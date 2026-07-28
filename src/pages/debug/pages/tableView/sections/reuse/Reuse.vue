<template>
  <DebugSection title="Переиспользование строк" id="reuse"
    description="Главная неочевидная часть: DOM-узлы строк переиспользуются, как ячейки UITableView. Слева ячейка, которая переписывает своё состояние целиком, справа — которая пишет только когда есть что писать. Прокрути обе вниз и обратно."
    source="src/shared/uiKit/tableView/tableView/ReusableStorage.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">режим</span>
        <select v-model="mode">
          <option v-for="variant in modes" :key="variant.value" :value="variant.value">{{ variant.label }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">размер пула</span>
        <select v-model.number="poolLimit">
          <option v-for="limit in poolLimits" :key="limit" :value="limit">{{ limit }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">id DOM-узла в строке</span>
        <input type="checkbox" v-model="showNodeId">
      </label>

      <label class="debug-control">
        <span class="debug-label">показать фолбэк-слой</span>
        <input type="checkbox" v-model="showFallback">
      </label>

      <button class="debug-btn" @click="reset">Сбросить счётчики</button>
    </div>

    <div class="tables">
      <ReuseTable ref="correct" title="Правильная ячейка: состояние снимается всегда" :rows :mode :poolLimit
        :showNodeId :showFallback :broken="false" />
      <ReuseTable ref="broken" title="Сломанная ячейка: состояние только ставится" :rows :mode :poolLimit :showNodeId
        :showFallback :broken="true" />
    </div>

    <p class="debug-note">
      Что должно произойти в правой таблице: зелёная подсветка (winrate ≥ {{ TOP_WINRATE }}) и бейдж «рекорд»
      (боёв ≥ {{ formatInt(RECORD_BATTLES) }}) прилипают к <b>DOM-узлу</b>, а не к строке. После нескольких экранов
      прокрутки подсветятся строки, у которых winrate 40 %. Вся разница между ячейками — две строчки:
      <span class="debug-value">classList.toggle('top', условие)</span> против
      <span class="debug-value">if (условие) classList.add('top')</span>.
    </p>

    <p class="debug-note">
      Включи «id DOM-узла»: <span class="debug-value">n42</span> — номер, выданный при создании элемента. При
      прокрутке номера повторяются и ходят по кругу — узлов ровно столько, сколько влезает на экран, плюс пул.
      Счётчик «создано узлов» при этом стоит на месте, а <span class="debug-value">configure</span> растёт.
    </p>

    <table class="debug-table">
      <thead>
        <tr>
          <th>режим</th>
          <th>что возвращает cellForIndex</th>
          <th>что происходит</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>с пулом</th>
          <td><span class="debug-value">{ cell, reusableKey }</span></td>
          <td>ушедшая за край строка возвращается в <span class="debug-value">ReusableStorage</span>, пока в пуле есть
            место; создание узлов прекращается</td>
        </tr>
        <tr>
          <th>без ключа</th>
          <td>сам объект строки</td>
          <td>всё корректно, но узел не переиспользуется: «создано» растёт всю прокрутку, каждый экран — новый мусор
            для GC</td>
        </tr>
        <tr>
          <th>один экземпляр на оба слоя</th>
          <td>один и тот же объект на оба вызова</td>
          <td class="false">таблица ломается: узел переезжает в фолбэк-слой, и при уходе строки за край
            <span class="debug-value">removeChild</span> в слое прокрутки кидает
            <span class="debug-value">NotFoundError</span> прямо в rAF</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Размер пула — третий аргумент <span class="debug-value">registerReusable(key, ctor, limit)</span>, по умолчанию
      10. Это не кеш, а список свободных узлов: всё, что не влезло в лимит, просто выбрасывается. Пул один на оба
      слоя. При медленной прокрутке хватает и пяти — за кадр освобождается пара узлов; разница видна на резком флике,
      когда за один кадр уезжает сразу десяток строк: с лимитом 5 счётчик «создано» поедет, с 60 останется на месте.
      Ориентир — вдвое больше видимых строк, потому что слоя два.
    </p>

    <p class="debug-note">
      Ключ пула — <span class="debug-value">static reusableKey</span> самого класса ячейки. Наследник обязан объявить
      свой символ: без этого он попадёт в пул родителя и таблица начнёт доставать оттуда объекты другого класса. В
      проекте так и сделано — <span class="debug-path">shared/ui/tableView/cells/HighlightedCell.ts</span>
      переобъявляет ключ, унаследованный от <span class="debug-value">SelectableCellLine</span>.
    </p>

    <p class="debug-note">
      Таблицы прокручиваются независимо: синхронизации прокрутки у компонента нет. Пальцем проверять так же — важна
      именно инерционная прокрутка, при ней узлы переиспользуются пачками.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { syntheticTableRows } from '@/pages/debug/shared/fixtures/syntheticSeries'
import { RECORD_BATTLES, TOP_WINRATE } from '../../shared/RowCell'
import { formatInt } from '../../shared/format'
import ReuseTable from './ReuseTable.vue'

const modes = [
  { value: 'pool', label: 'с пулом (reusableKey)' },
  { value: 'fresh', label: 'без ключа: новый экземпляр каждый раз' },
  { value: 'shared', label: 'один экземпляр на оба слоя (ломает таблицу)' },
] as const

const poolLimits = [5, 20, 60]

const rows = syntheticTableRows(3_000, 11)

const mode = ref<typeof modes[number]['value']>('pool')
const poolLimit = ref(20)
const showNodeId = ref(true)
const showFallback = ref(false)

const correct = useTemplateRef<InstanceType<typeof ReuseTable>>('correct')
const broken = useTemplateRef<InstanceType<typeof ReuseTable>>('broken')

function reset() {
  correct.value?.reset()
  broken.value?.reset()
}

</script>


<style scoped lang="scss">
.tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 0.75em;
  align-items: start;
}
</style>
