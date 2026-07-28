<template>
  <DebugSection title="Бейджи выбранного" id="badges"
    description="Badge → BadgesLine → BadgesLinePopover. Один бейдж, много бейджей, очень длинные названия и что происходит, когда они не влезают в контейнер."
    source="src/shared/game/selectors/components/badges/">

    <div class="debug-col">
      <span class="debug-label">Badge: один бейдж</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">text</span>
          <input type="text" v-model="badgeText">
        </label>

        <label class="debug-control">
          <span class="debug-label">closable</span>
          <input type="checkbox" v-model="closable">
        </label>

        <button class="debug-btn" @click="badgeText = longTexts[3]">длинный текст</button>
        <button class="debug-btn" @click="badgeText = ''">пустой текст</button>

        <span class="debug-hint">событий close: <span class="debug-value">{{ closes }}</span></span>
      </div>

      <div class="debug-stage">
        <div class="badge-box">
          <Badge :text="badgeText" :closable="closable" @close="closes++" />
        </div>
      </div>

      <p class="debug-note">
        <span class="debug-value">close</span> висит на крестике <b>и</b> на
        <span class="debug-value">@auxclick</span> всего бейджа, причём auxclick не смотрит на
        <span class="debug-value">closable</span>: сними галку и щёлкни по бейджу средней или правой кнопкой — счётчик
        всё равно вырастет. В <span class="debug-value">BadgesLine</span> это значит, что «неудаляемых» бейджей там нет
        в принципе, а правый клик удаляет бейдж заодно с показом системного меню.
      </p>

      <p class="debug-note">
        Бейдж не обрезает и не переносит текст: высота жёстко 20px, длинное название растягивает его на всю доступную
        ширину, а дальше — на всю ширину строки бейджей. Ни
        <span class="debug-value">max-width</span>, ни <span class="debug-value">ellipsis</span> внутри
        <span class="debug-value">Badge.vue</span> нет; с пустым текстом остаётся кружок из одного крестика.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">BadgesLine: строка бейджей</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">showAddButton</span>
          <input type="checkbox" v-model="showAddButton">
        </label>

        <label class="debug-control">
          <span class="debug-label">tagToText</span>
          <input type="checkbox" v-model="useTagToText">
        </label>

        <label class="debug-control">
          <span class="debug-label">ширина контейнера</span>
          <input type="range" min="120" max="700" v-model.number="width">
          <span class="debug-value">{{ width }}px</span>
        </label>
      </div>

      <div class="debug-row">
        <button class="debug-btn" @click="fill(1)">1 бейдж</button>
        <button class="debug-btn" @click="fill(5)">5</button>
        <button class="debug-btn" @click="fill(40)">40</button>
        <button class="debug-btn" @click="fillLong()">длинные названия</button>
        <button class="debug-btn" @click="tags.clear()">очистить</button>
      </div>

      <div class="debug-stage">
        <div class="line-box" :style="{ width: `${width}px` }">
          <BadgesLine v-model="tags" :show-add-button="showAddButton"
            :tag-to-text="useTagToText ? tagToText : undefined" @open-select-modal="opens++" />
        </div>
      </div>

      <div class="debug-row">
        <span class="debug-hint">бейджей: <span class="debug-value">{{ tags.size }}</span></span>
        <span class="debug-hint">openSelectModal: <span class="debug-value">{{ opens }}</span></span>
      </div>

      <p class="debug-note">
        Переполнения в поповер здесь <b>нет</b>: <span class="debug-value">BadgesLine</span> — это просто
        <span class="debug-value">flex-wrap: wrap</span>, бейджи переносятся на новые строки и растят контейнер по
        высоте, свёртки в «+N» нет. Поставь 40 бейджей и сузь контейнер — увидишь, на сколько строк уезжает фильтр.
        Поповер в <span class="debug-value">BadgesLinePopover</span> — это попап выбора, а не переполнение.
      </p>

      <p class="debug-note">
        Без <span class="debug-value">tagToText</span> в бейдже оказывается сырой тег
        (<span class="debug-value">tagToText?.(tag) ?? tag</span>) — так же выглядит подпись, если локализация ещё не
        доехала или тега в ней нет. Кнопка справа меняется по <span class="debug-value">selected.size</span>: «выбрать»
        на пустом наборе и «+» на непустом; она же единственный способ открыть попап, отдельного клика по строке нет.
      </p>
    </div>

    <div class="debug-col">
      <span class="debug-label">BadgesLinePopover: строка + поповер с произвольным содержимым</span>

      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">closeOnOutsideWindow</span>
          <select v-model="closeOnOutsideWindow">
            <option v-for="variant in closeVariants" :key="variant" :value="variant">{{ variant }}</option>
          </select>
        </label>

        <button class="debug-btn" @click="fillPopover(3)">+3 бейджа</button>
        <button class="debug-btn" @click="fillPopover(25)">+25 бейджей</button>
        <button class="debug-btn" @click="popoverTags.clear()">очистить</button>
      </div>

      <div class="debug-stage">
        <div class="line-box" :style="{ width: `${width}px` }">
          <BadgesLinePopover v-model="popoverTags" :tag-to-text="tagToText"
            :close-on-outside-window="closeOnOutsideWindow">
            <div class="slot-card">
              <p>Содержимое слота — любое. Настоящие селекторы кладут сюда свой попап.</p>
              <div class="row">
                <button v-for="tag in slotTags" :key="tag" @click="toggle(popoverTags, tag)"
                  :class="{ active: popoverTags.has(tag) }">
                  {{ tag }}
                </button>
              </div>
            </div>
          </BadgesLinePopover>
        </div>
      </div>

      <p class="debug-note">
        Цель поповера — <b>вся строка бейджей</b> (<span class="debug-value">badges?.$el</span>), а не кнопка «+».
        Поэтому по мере роста строки поповер прыгает: он всегда цепляется за левый нижний угол всей строки
        (<span class="debug-value">bottom-start</span>, фолбэк <span class="debug-value">bottom-float</span>,
        <span class="debug-value">arrowSize: 0</span>). Набери 25 бейджей в узком контейнере, открой попап и удали пару
        бейджей — попап переедет под новую геометрию строки.
      </p>

      <p class="debug-note">
        Из того, что целью считается вся строка, следует полезный побочный эффект: клики по самой строке для поповера
        «внутри цели», а не снаружи. Открой попап и потыкай крестики на бейджах — попап останется открытым, хотя
        <span class="debug-value">PopoverAutoClose</span> закрывается по нажатию вне. Повторный клик по «+» при этом
        честно закрывает: <span class="debug-value">displayPopup = !displayPopup</span> отрабатывает без гонки с
        автозакрытием.
      </p>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import Badge from '@/shared/game/selectors/components/badges/Badge.vue'
import BadgesLine from '@/shared/game/selectors/components/badges/BadgesLine.vue'
import BadgesLinePopover from '@/shared/game/selectors/components/badges/BadgesLinePopover.vue'
import type { CloseOnOutsideWindow } from '@/shared/uiKit/popover/utils'
import { longTexts } from '../shared/fixtures'

const closeVariants: CloseOnOutsideWindow[] = ['target', 'popover', 'popover-full']
const slotTags = ['альфа', 'бета', 'гамма']

const badgeText = ref('ИС-7')
const closable = ref(true)
const closes = ref(0)

const tags = ref(new Set<string>())
const showAddButton = ref(true)
const useTagToText = ref(true)
const width = ref(420)
const opens = ref(0)

const popoverTags = ref(new Set<string>())
const closeOnOutsideWindow = ref<CloseOnOutsideWindow>('target')

function tagToText(tag: string) {
  return `тег ${tag}`
}

function fill(count: number) {
  tags.value.clear()
  for (let i = 1; i <= count; i++) tags.value.add(`tag-${i}`)
}

function fillLong() {
  tags.value.clear()
  for (const text of longTexts) tags.value.add(text)
}

function fillPopover(count: number) {
  for (let i = 1; i <= count; i++) popoverTags.value.add(`tag-${i}`)
}

function toggle(set: Set<string>, tag: string) {
  if (set.has(tag)) set.delete(tag)
  else set.add(tag)
}

</script>


<style scoped lang="scss">
.badge-box {
  max-width: 420px;
}

.line-box {
  border: 1px solid var(--debug-border-strong);
  border-radius: 4px;
  padding: 0.3em;
  max-width: 100%;
}

.slot-card {
  padding: 10px;
  width: 260px;
  font-size: 13px;
  line-height: 1.4;

  .row {
    display: flex;
    gap: 5px;
    margin-top: 8px;

    button {
      flex: 1;
      border: none;
      border-radius: 5px;
      padding: 4px 8px;
      background-color: rgba(255, 255, 255, 0.08);
      color: inherit;
      cursor: pointer;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &.active {
        background-color: var(--blue-color);
      }
    }
  }
}
</style>
