<template>
  <DebugSection title="valueAdapter: значение → props и параметры отдельно" id="value-adapter"
    description="Одно и то же значение, два адаптера. Слева адаптер отдаёт и contentProps, и tooltipProps, справа только contentProps — поэтому placement, target и disabled из значения работают только у левой цели."
    source="src/shared/uiKit/tooltip/useTooltip.ts">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">nick</span>
        <input type="text" v-model="nick">
      </label>

      <label class="debug-control">
        <span class="debug-label">battles</span>
        <input type="number" min="0" v-model.number="battles">
      </label>

      <PlacementSelect v-model="placement" allow-none />

      <label class="debug-control">
        <span class="debug-label">target → якорь</span>
        <input type="checkbox" v-model="useAnchor">
      </label>

      <label class="debug-control">
        <span class="debug-label">disabled</span>
        <input type="checkbox" v-model="disabled">
      </label>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>поле значения</th>
          <th>с tooltipProps</th>
          <th>только contentProps</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>nick, battles</th>
          <td>пропы карточки</td>
          <td>пропы карточки</td>
        </tr>
        <tr>
          <th>placement</th>
          <td class="true">параметр поповера</td>
          <td class="false">не используется</td>
        </tr>
        <tr>
          <th>target</th>
          <td class="true">точка привязки</td>
          <td class="false">не используется</td>
        </tr>
        <tr>
          <th>disabled</th>
          <td class="true">запрещает показ</td>
          <td class="false">не используется</td>
        </tr>
      </tbody>
    </table>

    <div class="debug-stage center short">
      <div class="debug-row">
        <button class="debug-btn" v-adapted-tooltip.instant="value">с tooltipProps</button>
        <button class="debug-btn" v-content-only-tooltip.instant="value">только contentProps</button>
        <div class="anchor" ref="anchor">якорь</div>
      </div>
    </div>

    <p class="debug-note">
      Адаптер — единственный способ отдать в поповер что-то из значения: без него значение целиком уходит в пропы
      содержимого. Обратное тоже верно — <span class="debug-value">contentProps</span> может быть любой формы, поля
      можно переименовывать и считать на ходу, карточка про исходное значение ничего не знает.
    </p>

    <p class="debug-note">
      Тип значения выводится из аннотации параметра адаптера
      (<span class="debug-value">valueAdapter: (value: PlayerValue) =&gt; …</span>). Без аннотации
      <span class="debug-value">Value</span> схлопывается в пропы компонента, и «лишние» поля значения становятся
      ошибкой типизации. В бою второй путь тоже встречается: в
      <span class="debug-value">useRankDistributionTooltip</span> контент-компонент сам объявляет
      <span class="debug-value">target</span> и <span class="debug-value">placement</span> пропами, а адаптер отдаёт
      значение в контент целиком и попутно вытаскивает из него параметры поповера.
    </p>

    <p class="debug-note">
      Приоритет всё тот же: модификатор в шаблоне сильнее <span class="debug-value">tooltipProps</span> из значения,
      а значение сильнее опций директивы. Проверить можно, поставив placement в селекторе и сравнив с целью из
      секции про модификаторы.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlacementSelect from '../../shared/PlacementSelect.vue'
import { vAdaptedTooltip, vContentOnlyTooltip, type PlayerValue } from './adaptedTooltip'

const nick = ref('Верблюд_с_пулемётом')
const battles = ref(15423)
const placement = ref<PlacementWithModifiers | null>('left')
const useAnchor = ref(false)
const disabled = ref(false)

const anchor = useTemplateRef<HTMLElement>('anchor')

const value = computed<PlayerValue>(() => ({
  nick: nick.value,
  battles: battles.value,
  placement: placement.value ?? undefined,
  target: useAnchor.value ? anchor.value : undefined,
  disabled: disabled.value,
}))

</script>


<style scoped lang="scss">
.anchor {
  border: 1px dashed var(--blue-color);
  border-radius: 4px;
  padding: 1.2em 1em;
  font-size: 12px;
  color: var(--blue-thin-color);
}
</style>
