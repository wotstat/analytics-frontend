<template>
  <div class="day-selector">
    <button ref="trigger" type="button" class="trigger" @click="displayPopup = !displayPopup">
      <span class="trigger-content">
        <span v-if="caption" class="caption">{{ caption }}:</span>
        <span class="selection-label">{{ selectionLabel }}</span>
        <DropdownArrow :is-open="displayPopup" class="arrow" />
      </span>
    </button>
  </div>

  <PopoverAutoClose :target="trigger" v-model="displayPopup"
    :placement="['bottom-start', 'bottom-end', 'right-start-float', 'left-start-float', 'bottom-float']"
    :viewport-offset="{ top: headerHeight + additionalHeaderHeight, right: 10, bottom: 10, left: 10 }" :arrow-size="0"
    class="comp7-tooltip">
    <div class="calendar-popup">
      <TipSelectDayGroups ref="groupSelectionTip" class="group-selection-tip" :display="displayPopup"
        :selection-mode="props.selectionMode" />
      <header>
        <div class="title-row">
          <h3>Выбор дней сезона</h3>
          <button type="button" class="reset" :class="{ disabled: selectedDays.length === 0 }"
            @click="selectWholeSeason">
            <Reload />
          </button>
        </div>
        <p>{{ selectionDescription }}</p>
      </header>

      <div class="separator"></div>

      <div class="calendar-grid">
        <span class="week-heading">Нед.</span>
        <button v-for="weekday in weekdays" :key="weekday.column" type="button" class="weekday"
          :class="{ selected: props.selectionMode === 'arbitrary' && isGroupSelected(weekday.days) }"
          :style="{ gridColumn: weekday.column + 2, gridRow: 1 }" :disabled="props.selectionMode === 'interval'"
          @click="selectGroup(weekday.days)" @pointerenter="hoveredWeekday = weekday.column"
          @pointerleave="hoveredWeekday = null">
          {{ weekday.label }}
        </button>

        <template v-for="weekday in weekdays" :key="`selected-weekday-${weekday.column}`">
          <Transition name="group-selection">
            <div v-if="props.selectionMode === 'arbitrary' && isGroupSelected(weekday.days)"
              class="group-selection column-selection" :style="{
                gridColumn: weekday.column + 2,
                gridRow: `1 / span ${weekday.rowSpan}`,
              }"></div>
          </Transition>
        </template>

        <Transition name="group-highlight">
          <div v-if="props.selectionMode === 'arbitrary' && hoveredWeekday !== null"
            class="group-highlight column-highlight" :style="{
              gridColumn: hoveredWeekday + 2,
              gridRow: `1 / span ${weekdays[hoveredWeekday]!.rowSpan}`,
            }"></div>
        </Transition>
        <Transition name="group-highlight">
          <div v-if="hoveredWeek !== null" class="group-highlight row-highlight" :style="{
            gridColumn: `1 / span ${weeks[hoveredWeek]!.columnSpan}`,
            gridRow: hoveredWeek + 2,
          }"></div>
        </Transition>

        <div v-for="week in weeks" :key="week.index" class="week-row">
          <Transition name="group-selection">
            <div v-if="isGroupSelected(week.days)" class="group-selection row-selection" :style="{
              gridColumn: `1 / span ${week.columnSpan}`,
              gridRow: week.index + 2,
            }"></div>
          </Transition>
          <button type="button" class="week-number" :class="{ selected: isGroupSelected(week.days) }"
            :style="{ gridColumn: 1, gridRow: week.index + 2 }" @click="selectGroup(week.days)"
            @pointerenter="hoveredWeek = week.index" @pointerleave="hoveredWeek = null">
            {{ week.index + 1 }}
          </button>

          <template v-for="column in 7" :key="column">
            <button v-if="week.days[column - 1]" v-tooltip:calendar.instant.top-float="{
              class: 'comp7-tooltip',
              text: week.days[column - 1]!.calendarLabel,
            }" type="button" class="day" :style="{ gridColumn: column + 1, gridRow: week.index + 2 }" :class="{
              selected: isDaySelected(week.days[column - 1]),
              'selected-before': isDaySelected(week.days[column - 1]) && isDaySelected(week.days[column - 2]),
              'selected-after': isDaySelected(week.days[column - 1]) && isDaySelected(week.days[column]),
              today: week.days[column - 1]!.isToday,
              future: week.days[column - 1]!.isFuture,
              'group-highlighted': hoveredWeek === week.index || hoveredWeekday === column - 1,
            }" @click="selectDay(week.days[column - 1]!)">
              <span class="day-label">{{ week.days[column - 1]!.seasonDay }}</span>
            </button>
            <span v-else class="empty-day" :style="{ gridColumn: column + 1, gridRow: week.index + 2 }"></span>
          </template>
        </div>
      </div>

      <div class="separator"></div>

      <button type="button" class="whole-season" :class="{ selected: selectedDays.length === 0 }"
        @click="selectWholeSeason">
        Весь сезон
      </button>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import Reload from '@/assets/icons/reset.svg'
import { headerHeight, useAdditionalHeaderHeight } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { getRegionDayChangeHourOffset } from '@/shared/game/comp7/utils'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import TipSelectDayGroups from './tips/TipSelectDayGroups.vue'
import DropdownArrow from './DropdownArrow.vue'

export type DaySelectionMode = 'arbitrary' | 'interval'

type CalendarDay = {
  value: string
  calendarLabel: string
  seasonDay: number
  isToday: boolean
  isFuture: boolean
}

const props = withDefaults(defineProps<{
  seasonInterval: { start: Date, end: Date }
  region: string
  selectionMode?: DaySelectionMode
  caption?: string
}>(), {
  selectionMode: 'arbitrary',
  caption: undefined,
})

const selectedDays = defineModel<string[]>({ default: () => [] })
const displayPopup = defineModel<boolean>('isOpen', { default: false })

const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const groupSelectionTip = useTemplateRef<InstanceType<typeof TipSelectDayGroups>>('groupSelectionTip')
const hoveredWeek = ref<number | null>(null)
const hoveredWeekday = ref<number | null>(null)
const currentTime = ref(Date.now())
const { additionalHeaderHeight } = useAdditionalHeaderHeight(true)

const DAY = 24 * 60 * 60 * 1000
const calendarDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  timeZone: 'UTC',
})

const currentGameDay = computed(() => new Date(
  currentTime.value - getRegionDayChangeHourOffset(props.region)
).toISOString().slice(0, 10))

const days = computed<CalendarDay[]>(() => {
  const result: CalendarDay[] = []
  const current = new Date(props.seasonInterval.start)
  let seasonDay = 1

  while (current < props.seasonInterval.end) {
    const value = current.toISOString().slice(0, 10)
    result.push({
      value,
      calendarLabel: calendarDateFormatter.format(current),
      seasonDay,
      isToday: value === currentGameDay.value,
      isFuture: value > currentGameDay.value,
    })

    current.setUTCDate(current.getUTCDate() + 1)
    seasonDay++
  }

  return result
})

const weeks = computed(() => Array.from(
  { length: Math.ceil(days.value.length / 7) },
  (_, index) => {
    const weekDays = days.value.slice(index * 7, index * 7 + 7)
    return {
      index,
      days: weekDays,
      columnSpan: weekDays.filter(day => !day.isFuture).length + 1,
    }
  }
))

const weekdays = computed(() => Array.from({ length: 7 }, (_, column) => {
  const date = new Date(props.seasonInterval.start.getTime() + column * DAY)
  const columnDays = days.value.filter((_, index) => index % 7 === column)
  const lastAvailableDay = columnDays.findLast(day => !day.isFuture)
  return {
    column,
    label: weekdayFormatter.format(date).replace('.', ''),
    days: columnDays,
    rowSpan: lastAvailableDay === undefined
      ? 1
      : Math.floor((lastAvailableDay.seasonDay - 1) / 7) + 2,
  }
}))

const selectedSet = computed(() => new Set(selectedDays.value))
const dayIndex = computed(() => new Map(days.value.map((day, index) => [day.value, index])))

const selectionLabel = computed(() => {
  if (selectedDays.value.length === 0) return 'Весь сезон'
  if (selectedDays.value.length === 1) {
    const selected = days.value.find(day => day.value === selectedDays.value[0])
    return selected ? `День ${selected.seasonDay}` : 'Выбран 1 день'
  }

  if (props.selectionMode === 'interval') {
    const selected = normalizedSelection(selectedDays.value)
    const first = days.value.find(day => day.value === selected[0])
    const last = days.value.find(day => day.value === selected.at(-1))
    if (first && last) return `Дни ${first.seasonDay}–${last.seasonDay}`
  }

  return `Выбрано дней: ${selectedDays.value.length}`
})

const selectionDescription = computed(() => selectedDays.value.length === 0
  ? 'Выбрана статистика за весь сезон'
  : selectionLabel.value
)

watch(displayPopup, value => {
  if (value) currentTime.value = Date.now()
})

function availableGroup(group: CalendarDay[]) {
  return group.filter(day => !day.isFuture).map(day => day.value)
}

function isGroupSelected(group: CalendarDay[]) {
  const values = availableGroup(group)
  return values.length > 0 && values.every(value => selectedSet.value.has(value))
}

function isDaySelected(day: CalendarDay | undefined) {
  return day !== undefined && selectedSet.value.has(day.value)
}

function normalizedSelection(values: string[]) {
  return [...new Set(values)]
    .filter(value => dayIndex.value.has(value) && value <= currentGameDay.value)
    .sort()
}

function rangeBetween(first: string, last: string) {
  const firstIndex = dayIndex.value.get(first)
  const lastIndex = dayIndex.value.get(last)
  if (firstIndex === undefined || lastIndex === undefined) return []

  const from = Math.min(firstIndex, lastIndex)
  const to = Math.max(firstIndex, lastIndex)
  return days.value
    .slice(from, to + 1)
    .filter(day => !day.isFuture)
    .map(day => day.value)
}

function selectDay(day: CalendarDay) {
  if (day.isFuture) return

  if (props.selectionMode === 'arbitrary') {
    const next = new Set(selectedDays.value)
    if (next.has(day.value)) next.delete(day.value)
    else next.add(day.value)
    selectedDays.value = normalizedSelection([...next])
    return
  }

  const selected = normalizedSelection(selectedDays.value)
  const selectedFirstIndex = dayIndex.value.get(selected[0])
  const selectedLastIndex = dayIndex.value.get(selected.at(-1)!)
  const clickedIndex = dayIndex.value.get(day.value)

  if (selected.length > 1 && clickedIndex === selectedFirstIndex) {
    selectedDays.value = selected.slice(1)
  } else if (selected.length > 1 && clickedIndex === selectedLastIndex) {
    selectedDays.value = selected.slice(0, -1)
  } else if (selectedFirstIndex !== undefined && selectedLastIndex !== undefined && clickedIndex === selectedFirstIndex - 1) {
    selectedDays.value = rangeBetween(day.value, selected.at(-1)!)
  } else if (selectedFirstIndex !== undefined && selectedLastIndex !== undefined && clickedIndex === selectedLastIndex + 1) {
    selectedDays.value = rangeBetween(selected[0], day.value)
  } else {
    selectedDays.value = [day.value]
  }
}

function selectGroup(group: CalendarDay[]) {
  const values = availableGroup(group)
  if (values.length === 0) return
  groupSelectionTip.value?.accept()

  if (props.selectionMode === 'interval') {
    selectedDays.value = rangeBetween(values[0], values.at(-1)!)
    return
  }

  const next = new Set(selectedDays.value)
  const remove = values.every(value => next.has(value))
  for (const value of values) {
    if (remove) next.delete(value)
    else next.add(value)
  }
  selectedDays.value = normalizedSelection([...next])
}

function selectWholeSeason() {
  selectedDays.value = []
}
</script>

<style scoped lang="scss">
.day-selector {
  display: inline-flex;

  .trigger {
    padding: 4px 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.025);
    color: rgba(255, 255, 255, 0.88);
    font-size: 14px;
    transition: background-color 0.1s, border-color 0.1s;

    &:hover {
      border-color: rgba(255, 255, 255, 0.32);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .trigger-content {
    display: flex;
    align-items: center;
    gap: 5px;
    transform: translateY(-1px);
  }

  .caption {
    color: rgba(255, 255, 255, 0.5);
  }

  .selection-label {
    font-variant-numeric: tabular-nums;
  }

  .arrow {
    display: block;
    width: 12px;
    height: 12px;
    margin: 2px 0 0 1px;
    transform: scale(0.85);
  }
}

.calendar-popup {
  --day-selector-popup-width: min(266px, calc(100vw - 20px));

  position: relative;
  box-sizing: border-box;
  width: var(--day-selector-popup-width);
  padding: 13px;

  .group-selection-tip {
    position: absolute;
    top: 15px;
    left: 13px;
  }

  &:has(> .group-selection-tip) header .title-row {
    padding-left: 25px;
  }

  header {
    .title-row {
      display: flex;
      align-items: center;
      gap: 7px;
      padding-left: 0;
      transition: padding-left 0.25s ease;
    }

    h3 {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      line-height: 1.1;
    }

    p {
      margin: 3px 0 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }

    .reset {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 23px;
      height: 23px;
      margin-left: auto;
      padding: 4px;
      border: none;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
      transition: background-color 0.2s, opacity 0.2s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      &.disabled {
        pointer-events: none;
        opacity: 0;
      }

      svg {
        display: block;
        width: 100%;
      }
    }
  }

  .separator {
    height: 1px;
    margin: 11px -13px;
    background: rgba(255, 255, 255, 0.1);
  }
}

.calendar-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, 30px);
  grid-auto-rows: 30px;
  justify-content: center;
  column-gap: 0;
  row-gap: 3px;

  button {
    position: relative;
    z-index: 2;
    border: none;
    color: rgba(255, 255, 255, 0.68);
    transition: color 0.1s, background-color 0.1s;
    user-select: none;
  }

  .week-heading,
  .weekday {
    height: 30px;
    color: rgba(255, 255, 255, 0.42);
    font-size: 11px;
    font-weight: 400;
    text-transform: uppercase;
    user-select: none;
  }

  .week-heading {
    display: flex;
    grid-row: 1;
    grid-column: 1;
    align-items: center;
    justify-content: center;
  }

  .weekday,
  .week-number {
    border-radius: 15px;
    background: transparent;

    &:hover {
      background: transparent;
      color: rgba(255, 255, 255, 0.9);
    }

    &.selected {
      color: #fff;
      background: transparent;
    }
  }

  .weekday:disabled {
    pointer-events: none;
    cursor: default;
  }

  .week-row {
    display: contents;
  }

  .group-highlight,
  .group-selection {
    pointer-events: none;
    border-radius: 15px;
  }

  .group-highlight {
    z-index: 0;
    background: rgba(255, 255, 255, 0.08);
  }

  .group-selection {
    z-index: 1;
    background: var(--blue-color, rgb(10, 132, 255));
  }

  .group-highlight-enter-active,
  .group-highlight-leave-active,
  .group-selection-enter-active,
  .group-selection-leave-active {
    transition: opacity 0.1s;
  }

  .group-highlight-enter-from,
  .group-highlight-leave-to,
  .group-selection-enter-from,
  .group-selection-leave-to {
    opacity: 0;
  }

  .week-number {
    height: 30px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
    font-weight: 400;
  }

  .day,
  .empty-day {
    height: 30px;
  }

  .day {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    color: #fff;
    font-size: 13px;
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      z-index: 0;
      top: 0;
      right: calc(50% - 15px);
      bottom: 0;
      left: calc(50% - 15px);
      border-radius: 15px;
      background: transparent;
      transition:
        right 0.1s ease-out,
        left 0.1s ease-out,
        border-radius 0.1s ease-out,
        background-color 0.1s,
        filter 0.1s;
    }

    &:hover::before,
    &:focus-visible::before {
      background: rgba(255, 255, 255, 0.09);
    }

    &.selected::before {
      background: var(--blue-color, rgb(10, 132, 255));
    }

    &.selected:hover::before,
    &.selected:focus-visible::before {
      filter: brightness(1.12);
    }

    &.selected-before::before {
      left: 0;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    &.selected-after::before {
      right: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    &.future {
      color: rgba(255, 255, 255, 0.23);
      cursor: default;

      &::before {
        background: transparent;
      }
    }

    &:focus-visible {
      outline: none;

      .day-label {
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.75);
      }
    }

    .day-label {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }

    &.today .day-label::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: 50%;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--blue-thin-color, #70baff);
      transform: translateX(-50%);
    }

    &.today.selected .day-label::after {
      background: #fff;
    }
  }
}

.whole-season {
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.035);
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  transition: color 0.1s, background-color 0.1s;
  user-select: none;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  &.selected {
    background: var(--blue-color, rgb(10, 132, 255));
    color: #fff;
  }
}
</style>
