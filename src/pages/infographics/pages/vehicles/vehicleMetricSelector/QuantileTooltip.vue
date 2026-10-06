<template>
  <div class="quantile-tooltip nice-scrollbar"
    :style="{
      '--available-height': `calc(100dvh - ${headerOffset}px - 24px)`,
      '--results-height': `${chartHeight}px`,
      '--result-row-height': `${rowHeight}px`,
      '--result-bottom-margin': `${sampleRadius}px`,
      '--slider-progress': `${percentile}%`,
    }"
    @pointerdown.stop @pointerup.stop @click.stop>
    <div class="heading">Что такое квантиль</div>
    <p class="intro">Квантиль — это граница, ниже которой находится заданная доля значений. <a
        href="https://ru.wikipedia.org/wiki/%D0%9A%D0%B2%D0%B0%D0%BD%D1%82%D0%B8%D0%BB%D1%8C" target="_blank"
        rel="noopener noreferrer">Википедия</a>
    </p>

    <div class="example">
      <div class="example-heading">Например</div>
      <div class="distribution">
        <div class="section-label">Распределение урона</div>
        <svg ref="chart" class="chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          @pointermove="moveSlice" @pointerdown="moveSlice">
          <defs>
            <clipPath :id="clipId">
              <rect :x="chartX(chartLeft)" y="0" :width="chartX(sliceX - chartLeft)" :height="baseline" />
            </clipPath>
          </defs>
          <path class="area" :d="areaPath" />
          <path class="lower-area" :d="areaPath" :clip-path="`url(#${clipId})`" />
          <path class="curve" :d="curvePath" />
          <line class="axis" :x1="chartX(chartLeft)" :x2="chartX(chartRight)" :y1="baseline" :y2="baseline" />
          <circle v-for="(value, index) in values" :key="value" :cx="chartX(quantileX((index + 0.5) * 10))"
            :cy="baseline" :r="sampleRadius" class="sample" :class="{ lower: index < belowCount }" />
          <line class="slice" :x1="chartX(sliceX)" :x2="chartX(sliceX)" y1="16" :y2="baseline" />
          <circle class="slice-point" :cx="chartX(sliceX)" :cy="densityY(sliceX)" r="4" />
          <text class="slice-label" :x="chartX(sliceX)" y="11" text-anchor="middle">Q{{ percentile }}</text>
        </svg>
      </div>

      <div class="results">
        <div class="section-label">Урон за 10 боёв</div>
        <div class="value-list">
          <button v-for="(value, index) in values" :key="value" type="button" class="value-row"
            :class="{ lower: index < belowCount }" @pointerenter="selectRow(index)" @click="selectRow(index)">
            <span class="rank">{{ index + 1 }}</span>
            <span>{{ formatValue(value) }}</span>
          </button>
          <div class="table-slice" :style="{ top: `${belowCount * rowHeight}px` }">
            <span>Q{{ percentile }}</span>
          </div>
        </div>
      </div>

      <div class="slider-controls">
        <div class="shares">
          <strong>{{ percentile }}% боёв ниже порога</strong>
          <span>{{ 100 - percentile }}% выше</span>
        </div>
        <input :value="percentile" class="slider" type="range" min="0" max="100" step="10" @input="moveSlider" />
        <div class="presets">
          <button v-for="preset in presets" :key="preset.value" type="button"
            :style="{ left: `${preset.value}%` }"
            :class="{ active: percentile === preset.value }" @click="percentile = preset.value">
            {{ preset.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="explanation">
      <div class="explanation-label">Квантиль {{ percentile }}%{{ percentile === 50 ? ' · медиана' : '' }}</div>
      <div class="explanation-value">
        В {{ percentile }}% боёв урон ниже <strong>{{ formatValue(threshold) }}</strong>
      </div>
      <div class="explanation-detail">
        <template v-if="percentile === 50">В половине боёв урон ниже, в половине — выше.</template>
        <template v-else>
          В {{ belowCount }} {{ belowCount === 1 ? 'бою' : 'боях' }} из 10 урон ниже, в {{ 10 - belowCount }} —
          выше.
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'

const values = [100, 600, 1000, 1300, 1600, 1900, 2200, 2600, 3000, 3800]
const presets = [
  { value: 10, label: 'Q10' },
  { value: 50, label: 'Q50 · медиана' },
  { value: 90, label: 'Q90' },
]
const percentile = ref(20)
const belowCount = computed(() => percentile.value / 10)
const threshold = computed(() => percentile.value === 50
  ? (values[4] + values[5]) / 2
  : values[belowCount.value - 1])
const formatValue = (value: number) => value.toLocaleString('ru-RU')
const clipId = `quantile-share-${useId()}`
const rowHeight = 16
const sampleRadius = 3
const baseline = values.length * rowHeight
const chartHeight = baseline + sampleRadius
const chart = useTemplateRef<SVGSVGElement>('chart')
const { width } = useElementSize(chart, { width: 280, height: chartHeight })
const chartWidth = computed(() => Math.max(width.value, 1))
const chartX = (x: number) => x / 280 * chartWidth.value
const chartLeft = 12
const chartRight = 268
const center = (chartLeft + chartRight) / 2
const deviation = (chartRight - chartLeft) / 6
const density = (x: number) => Math.exp(-0.5 * ((x - center) / deviation) ** 2)
const densityY = (x: number) => baseline - density(x) * (baseline - 24)

// Схема колокола: равные доли площади соответствуют равному числу боёв в таблице.
const points = Array.from({ length: chartRight - chartLeft + 1 }, (_, index) => {
  const x = chartLeft + index
  return { x, y: densityY(x), density: density(x) }
})
let cumulative = 0
const cumulativePoints = points.map((point, index) => {
  if (index > 0) cumulative += (points[index - 1].density + point.density) / 2
  return { x: point.x, cumulative }
})
const totalDensity = cumulative

function quantileX(percent: number) {
  return cumulativePoints.find(point => point.cumulative / totalDensity >= percent / 100)?.x ?? chartRight
}

const sliceX = computed(() => quantileX(percentile.value))
const curvePath = computed(() => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${chartX(point.x)} ${point.y}`).join(' '))
const areaPath = computed(() => `${curvePath.value} L ${chartX(chartRight)} ${baseline} L ${chartX(chartLeft)} ${baseline} Z`)
const cuts = Array.from({ length: 9 }, (_, index) => ({ percent: (index + 1) * 10, x: quantileX((index + 1) * 10) }))

function moveSlice(event: PointerEvent) {
  if (event.type === 'pointermove' && event.pointerType === 'touch' && event.buttons === 0) return
  const chart = event.currentTarget as SVGSVGElement
  const bounds = chart.getBoundingClientRect()
  if (!bounds.width) return
  const x = (event.clientX - bounds.left) / bounds.width * 280
  const closest = cuts.reduce((best, cut) => Math.abs(cut.x - x) < Math.abs(best.x - x) ? cut : best)
  percentile.value = closest.percent
}

function selectRow(index: number) {
  percentile.value = Math.min((index + 1) * 10, 90)
}

function moveSlider(event: Event) {
  const slider = event.currentTarget as HTMLInputElement
  percentile.value = Math.max(10, Math.min(Number(slider.value), 90))
  slider.value = String(percentile.value)
}
</script>

<style scoped lang="scss">
.quantile-tooltip {
  --quantile-accent: rgba(92, 184, 255, 1);

  box-sizing: border-box;
  width: min(400px, calc(100vw - 24px));
  max-height: var(--available-height);
  padding: 10px;
  font-size: 13px;
  line-height: 1.35;
  font-variant-numeric: tabular-nums;

  p {
    margin: 0;
  }

  .heading {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 700;
  }

  .intro {
    color: #ffffff90;

    a {
      color: var(--quantile-accent);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .example {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 92px;
    column-gap: 14px;
    margin: 12px 0;
  }

  .section-label {
    margin-bottom: 5px;
    color: #ffffff80;
    font-size: 11px;
  }

  .example-heading {
    grid-column: 1 / -1;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .results .section-label {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .sort-direction {
    flex: none;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-bottom: 5px solid currentColor;
  }

  .chart {
    display: block;
    width: 100%;
    height: var(--results-height);
    cursor: crosshair;
    touch-action: pan-y;

    .area {
      fill: #ffffff0a;
    }

    .lower-area {
      fill: color-mix(in srgb, var(--quantile-accent) 25%, transparent);
    }

    .curve {
      fill: none;
      stroke: #ffffff65;
      stroke-width: 2;
    }

    .axis {
      stroke: #ffffff30;
    }

    .sample {
      fill: #888;
      stroke: #2a2a2a;
    }

    .sample.lower {
      fill: var(--quantile-accent);
    }

    .slice {
      stroke: var(--quantile-accent);
      stroke-width: 2;
    }

    .slice-point {
      fill: var(--quantile-accent);
      stroke: #2a2a2a;
    }

    .slice-label {
      fill: var(--quantile-accent);
      font-size: 13px;
      font-weight: 800;
    }

  }

  .slider-controls {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 12px;
  }

  .shares {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    color: #ffffff90;
    font-size: 11px;
    line-height: 1;

    strong {
      color: var(--quantile-accent);
      white-space: nowrap;
    }
  }

  .slider {
    display: block;
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    cursor: pointer;

    &::-webkit-slider-runnable-track {
      height: 4px;
      border: 0;
      border-radius: 4px;
      background: linear-gradient(to right,
          var(--quantile-accent) 0 var(--slider-progress),
          #ffffff18 var(--slider-progress) 100%);
    }

    &::-webkit-slider-thumb {
      appearance: none;
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      margin-top: -4px;
      border: 0;
      border-radius: 50%;
      background: var(--quantile-accent);
      box-shadow: 0 1px 4px #00000040;
    }

    &::-moz-range-track {
      height: 4px;
      border: 0;
      border-radius: 4px;
      background: #ffffff18;
    }

    &::-moz-range-progress {
      height: 4px;
      border: 0;
      border-radius: 4px;
      background: var(--quantile-accent);
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border: 0;
      border-radius: 50%;
      background: var(--quantile-accent);
      box-shadow: 0 1px 4px #00000040;
    }
  }

  .presets {
    position: relative;
    height: 20px;
    margin: 0 6px;

    button {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      border: 0;
      border-radius: 5px;
      padding: 3px 6px;
      background: #ffffff08;
      color: #ffffff90;
      font: inherit;
      font-size: 11px;
      white-space: nowrap;
      cursor: pointer;

      &:hover {
        background: #ffffff15;
      }

      &.active {
        color: var(--quantile-accent);
        background: color-mix(in srgb, var(--quantile-accent) 12.5%, transparent);
      }
    }
  }

  .value-list {
    position: relative;
    margin-bottom: var(--result-bottom-margin);
  }

  .value-row {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--result-row-height);
    padding: 0 5px;
    border: 0;
    background: transparent;
    color: #ffffff90;
    font: inherit;
    font-size: 11px;
    cursor: pointer;

    .rank {
      color: #ffffff40;
      font-size: 9px;
    }

    &.lower {
      color: var(--quantile-accent);
      background: color-mix(in srgb, var(--quantile-accent) 8%, transparent);
      font-weight: 700;
    }
  }

  .table-slice {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 2px solid var(--quantile-accent);
    pointer-events: none;

    span {
      position: absolute;
      right: calc(100% + 3px);
      top: -7px;
      color: var(--quantile-accent);
      font-size: 9px;
      font-weight: 800;
    }
  }

  .explanation {
    border-radius: 7px;
    padding: 8px 10px;
    background: color-mix(in srgb, var(--quantile-accent) 6.25%, transparent);

    .explanation-label {
      color: var(--quantile-accent);
      font-weight: 700;
    }

    .explanation-value {
      margin-top: 2px;
      font-size: 14px;
    }

    strong {
      color: var(--quantile-accent);
      font-weight: 800;
    }

    .explanation-detail {
      margin-top: 2px;
      color: #ffffff90;
      font-size: 11px;
    }
  }
}

@media (max-width: 600px) {
  .quantile-tooltip {
    .example {
      display: block;
    }

    .distribution,
    .results {
      display: none;
    }

    .example-heading {
      margin-bottom: 6px;
    }
  }
}
</style>
