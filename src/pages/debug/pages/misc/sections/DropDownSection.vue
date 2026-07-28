<template>
  <DebugSection title="DropDown" id="dropdown" source="src/shared/uiKit/dropdown/DropDown.vue"
    description="Все пропсы и слоты, v-model, вырожденные списки, поведение у края экрана и отсутствие клавиатуры.">

    <div class="debug-col">
      <span class="debug-label">Строки — пресеты вариантов</span>

      <div class="debug-row">
        <button class="debug-btn" :class="{ active: preset === 'normal' }" @click="preset = 'normal'">обычный</button>
        <button class="debug-btn" :class="{ active: preset === 'long' }" @click="preset = 'long'">длинный список
          (80)</button>
        <button class="debug-btn" :class="{ active: preset === 'longLabel' }" @click="preset = 'longLabel'">длинная
          подпись</button>
        <button class="debug-btn" :class="{ active: preset === 'single' }" @click="preset = 'single'">один
          пункт</button>
        <button class="debug-btn" :class="{ active: preset === 'empty' }" @click="preset = 'empty'">пустой
          список</button>
      </div>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">слот current</span>
          <input type="checkbox" v-model="useCurrentSlot">
        </label>
        <label class="debug-control">
          <span class="debug-label">слот line</span>
          <input type="checkbox" v-model="useLineSlot">
        </label>
        <label class="debug-control">
          <span class="debug-label">свой valueToLabel (upperCase)</span>
          <input type="checkbox" v-model="useCustomValueToLabel">
        </label>
      </div>

      <div class="debug-stage short narrow">
        <DropDown :variants="stringVariants" v-model="stringValue"
          :value-to-label="useCustomValueToLabel ? upperLabel : undefined">
          <template #current="{ currentValue }" v-if="useCurrentSlot">
            <span class="custom-current">▸ {{ currentValue ?? '—' }}</span>
          </template>
          <template #line="{ variant }" v-if="useLineSlot">
            <span class="custom-line">• {{ variant.label ?? variant.value }}</span>
          </template>
        </DropDown>
      </div>

      <p class="debug-hint">v-model: <span class="debug-value">{{ stringValue ?? '(не выбрано)' }}</span></p>

      <p class="debug-note">
        У длинного списка нет внутреннего скролла — <span class="debug-value">.lines</span> просто растёт по высоте
        вместе с блоком (<span class="debug-value">height: auto</span> / <span class="debug-value">calc-size</span>),
        поэтому 80 пунктов раскрываются во всю длину и двигают всё, что ниже, по странице. У «длинной подписи» тот же
        эффект по ширине: у <span class="debug-value">.dropdown</span> нет ни <span
          class="debug-value">max-width</span>,
        ни переноса — контейнер просто растягивается под самый длинный вариант.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">Объекты — generic на нестроковом T (сравнение по ссылке)</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">без label в варианте и без valueToLabel</span>
          <input type="checkbox" v-model="withoutLabel">
        </label>
      </div>

      <div class="debug-stage short narrow">
        <DropDown :variants="objectVariants" v-model="objectValue">
          <template #line="{ variant }">
            <span class="fruit-line">
              <span class="dot" :style="{ background: variant.value.color }"></span>
              {{ variant.value.name }}
            </span>
          </template>
        </DropDown>
      </div>

      <p class="debug-hint">v-model: <span class="debug-value">{{ objectValue?.name ?? '(не выбрано)' }}</span></p>

      <p class="debug-note" v-if="withoutLabel">
        Заголовок дропдауна (не переопределён слотом <span class="debug-value">current</span>) показывает результат
        <span class="debug-value">valueToLabel</span>: без <span class="debug-value">label</span> и без этого пропа
        функция по умолчанию возвращает сам объект-значение, и он попадает прямо в интерполяцию шаблона. Это не
        «[object Object]»: Vue сериализует объект через <span class="debug-value">JSON.stringify(val, null,
        2)</span>, а браузер схлопывает переносы и отступы в пробелы, так что заголовок показывает однострочный JSON
        вроде <span class="debug-value">{ "id": 5, "name": "Киви", "color": "#8bc24a" }</span>. Слот
        <span class="debug-value">line</span> список не спасает, только текст в свёрнутом виде.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">У края экрана и без клавиатуры</span>

      <p class="debug-hint">
        Раскрытие — не поповер: список растёт в потоке документа, без portal и без флипа у края viewport. Внизу узкой
        прокручиваемой сцены раскрытие просто обрежется краем контейнера, а не перевернётся вверх.
      </p>

      <div class="debug-stage scroll short narrow">
        <div class="edge-filler">прокрути сцену вниз — дропдаун у нижнего края</div>
        <DropDown :variants="normalVariants" v-model="edgeValue" />
      </div>

      <p class="debug-note">
        Клавиатуры нет вообще: у <span class="debug-value">.dropdown</span> нет <span
          class="debug-value">tabindex</span>,
        обработчиков <span class="debug-value">keydown</span> в компоненте тоже нет — Tab его не фокусирует, стрелки и
        Enter ничего не делают. Открытие и выбор работают только указателем
        (<span class="debug-value">pointerdown</span> / <span class="debug-value">pointerup</span> /
        <span class="debug-value">click</span>). Это ограничение самого компонента — здесь его не дорабатываем.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DropDown from '@/shared/uiKit/dropdown/DropDown.vue'

type Preset = 'normal' | 'long' | 'longLabel' | 'single' | 'empty'

const normalVariants = [
  { value: 'apple', label: 'Яблоко' },
  { value: 'banana', label: 'Банан' },
  { value: 'cherry', label: 'Вишня' },
  { value: 'date', label: 'Финик' },
] as const

const longVariants = Array.from({ length: 80 }, (_, i) => ({ value: `item-${i}`, label: `Пункт №${i + 1}` }))

const longLabelVariants = [
  { value: 'short', label: 'Короткий' },
  {
    value: 'long',
    label: 'Очень-очень-очень длинная подпись, которая явно не помещается в обычную ширину дропдауна и должна растянуть контейнер',
  },
] as const

const singleVariant = [{ value: 'only', label: 'Единственный пункт' }] as const

const emptyVariants: readonly { value: string, label?: string }[] = []

const preset = ref<Preset>('normal')
const stringVariants = computed(() => {
  if (preset.value === 'long') return longVariants
  if (preset.value === 'longLabel') return longLabelVariants
  if (preset.value === 'single') return singleVariant
  if (preset.value === 'empty') return emptyVariants
  return normalVariants
})

const stringValue = ref<string>()
const edgeValue = ref<string>()
const useCurrentSlot = ref(false)
const useLineSlot = ref(false)
const useCustomValueToLabel = ref(false)

function upperLabel(value?: string) {
  return value ? value.toUpperCase() : '—'
}

type Fruit = { id: number, name: string, color: string }

const fruits: readonly Fruit[] = [
  { id: 1, name: 'Яблоко', color: '#e2504a' },
  { id: 2, name: 'Банан', color: '#e2c94a' },
  { id: 3, name: 'Вишня', color: '#c23a5a' },
  { id: 4, name: 'Черника', color: '#4a5ee2' },
  { id: 5, name: 'Киви', color: '#8bc24a' },
]

const withoutLabel = ref(false)
const objectVariants = computed(() => fruits.map(f => ({ value: f, label: withoutLabel.value ? undefined : f.name })))
const objectValue = ref<Fruit>()

</script>


<style scoped lang="scss">
.narrow {
  max-width: 260px;
}

.custom-current,
.custom-line {
  color: var(--blue-thin-color);
}

.fruit-line {
  display: flex;
  align-items: center;
  gap: 0.4em;

  .dot {
    width: 0.7em;
    height: 0.7em;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

.edge-filler {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--debug-dim);
  font-size: 12px;
  margin-bottom: 0.5em;
}
</style>
