<template>
  <div class="demo-chart" :style="{ height: `${height ?? 240}px`, width: width }">
    <UniversalChartComponent :chart="chart" />
  </div>
</template>


<script setup lang="ts">
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

defineProps<{
  chart: UniversalChart
  height?: number
  width?: string
}>()

</script>


<style scoped lang="scss">
.demo-chart {
  position: relative;
  max-width: 100%;

  :deep(.chart-container) {
    position: absolute;
    inset: 0;
  }

  :deep(.universal-chart-root) {
    font-size: 11px;
    color: #ffffff60;

    .main-line {
      stroke-width: 2px;
      fill: none;

      &.s0 {
        stroke: #02afff;
      }

      &.s1 {
        stroke: #57ff6e;
      }

      &.s2 {
        stroke: #ffb057;
      }

      // Толстый CSS stroke для стенда nearStroke: contains обязан следовать этой ширине, а не 2px по умолчанию
      &.thick .line {
        stroke-width: 14px;
      }

      // Классы стенда Highlight: оба вешаются Highlight'ом прямо на существующий path через classList,
      // ничего не перетирая
      &.line-highlighted {
        stroke-width: 4px;
      }

      &.flagged-highlighted {
        stroke-dasharray: 2 4;
      }
    }

    // Столбцы стендов grouped/stacked: цвет по датасету через CSS-переменную, классы подсветок
    // вешает Highlight на те же path через classList
    .bar-plot .bar {
      --bar-color: #02afff;
      fill: color-mix(in srgb, var(--bar-color) 56%, transparent);

      &.s1 {
        --bar-color: #57ff6e;
      }

      &.s2 {
        --bar-color: #ffb057;
      }

      // group — фон светлее собственного цвета датасета, а не общая заливка/обводка
      &.bar-group-highlighted,
      &.bar-group-contains-highlighted {
        fill: color-mix(in srgb, var(--bar-color), white 32%);
      }

      // dataset — сплошная цветная обводка; канал stroke свободен, group его больше не занимает
      &.bar-dataset-highlighted {
        stroke: #57d9ff;
        stroke-width: 2px;
      }

      // item — самый светлый фон, идёт последним в каскаде и перекрывает fill группы на общем баре
      &.bar-item-highlighted {
        fill: color-mix(in srgb, var(--bar-color), white 62%);
      }
    }

    // Стенд scatter: заливка марок и класс, который Highlight вешает на видимый круг (не на mask-вырез)
    .scatter-markers circle {
      fill: #02afff90;

      &.scatter-highlighted {
        fill: #ffb057;
        stroke: #ffffff;
        stroke-width: 2px;
      }
    }

    // Стенд polygon: вогнутый контур с дыркой. evenodd переключает CSS fill-rule — isPointInFill()
    // обязан следовать вычисленному правилу, а не жёсткому nonzero
    .polygon-demo path {
      fill: #02afff40;
      stroke: #02afff;
      stroke-width: 1.5px;
      fill-rule: nonzero;
    }

    .polygon-demo.evenodd path {
      fill-rule: evenodd;
    }

    // Highlight вешает класс прямо на path (targets — [target] из PolygonAreaInteractionSource), не на g.polygon-demo
    .polygon-demo path.polygon-highlighted {
      fill: #ffb05760;
      stroke: #ffb057;
      stroke-width: 2.5px;
    }

    // VerticalArea/HorizontalArea без geometry-опции читают bounds полигона
    .polygon-area {
      fill: #02afff20;
      stroke: #02afff60;
      stroke-width: 1px;
      stroke-dasharray: 3 3;
    }

    // Прицелы наведения курсора (не участвуют в interaction): цвет разный на каждый тестовый случай
    .probe-marker circle {
      fill: #ffffff90;
      opacity: 0.7;

      &.solid {
        fill: #57ff6e;
      }

      &.notch {
        fill: #ff5757;
      }

      &.hole {
        fill: #ffb057;
      }
    }

    // Стенд polygon-overlap: две полупрозрачные перекрывающиеся фигуры, topmost() подсвечивает победителя
    .polygon-overlap path {
      stroke-width: 1.5px;
    }

    .overlap-a path {
      fill: #02afff50;
      stroke: #02afff;
    }

    .overlap-b path {
      fill: #57ff6e50;
      stroke: #57ff6e;
    }

    .polygon-overlap path.polygon-overlap-highlighted {
      stroke: #ffb057;
      stroke-width: 3px;
    }

    .ticks {
      opacity: 0.12;
    }

    .label {
      font-weight: bold;
      fill: #ffffff80;
    }

    .hover {
      .interactive-zone {
        cursor: crosshair;
      }

      &.pan-active .interactive-zone {
        cursor: grabbing;
      }

      .hover-line {
        stroke: #ffffff60;

        &.accent {
          stroke: #ffb057;
          stroke-width: 2px;
          stroke-dasharray: 4 4;
        }
      }

      .hover-marker {
        fill: #02afff;

        &.flagged {
          fill: #ffb057;
        }

        &.s0 {
          fill: #02afff;
        }

        &.s1 {
          fill: #57ff6e;
        }

        // Хит из within(), но не из фактической толщины stroke: маркер тусклее contains
        &.reach-only {
          opacity: 0.45;
        }
      }
    }
  }
}
</style>
