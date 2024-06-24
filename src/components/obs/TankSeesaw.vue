<template>
  <div class="card" :style="{ backgroundColor }">
    <div class="main">
      <table>
        <thead>
          <tr>
            <th class="wide">Никнейм</th>
            <th class="center">{{ getTankName(tank[0], true) }}</th>
            <th class="center">{{ getTankName(tank[1], true) }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(player, i) in nickname">
            <th class="wide nickname">
              {{ nickProcessor(player) }}
            </th>
            <td class="num" :class="Math.max(...dmg1Tween) == dmg1Tween[i] ? 'green' : ''">{{ processor(dmg1Tween[i]) }}
            </td>
            <td class="num" :class="Math.max(...dmg2Tween) == dmg2Tween[i] ? 'green' : ''">{{ dmg2Tween[i] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { getTankName } from '@/utils/i18n';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  nickname: string[];
  tank: string[];
  dmg: number[][];
  backgroundColor?: string;
}>();


const backgroundColor = computed(() => `#${props.backgroundColor ?? '353535'}`)


const processor = useFixedSpaceProcessor(0)

function nickProcessor(name: string) {
  if (name.endsWith('_Chuck')) return name.slice(0, -6);
  return name;
}

const dmg1 = computed(() => props.dmg.map(t => t[0]));
const dmg1Tween = useTweenCounter(dmg1, { duration: 1 });

const dmg2 = computed(() => props.dmg.map(t => t[1]));
const dmg2Tween = useTweenCounter(dmg2, { duration: 1 });

const route = useRoute();

onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';
})
</script>

<style lang="scss" scoped>
$grey: #c4c4c4;

.l2 {
  font-size: 2.8em;

  .sep {
    width: 0;
    border-right: 0.08em solid #525252d2;
    margin: 0 1em;
  }

  table {
    width: 100%;
    text-wrap: nowrap;
    padding: 0;

    th,
    td {
      padding: 0 !important;
    }
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}


.card {
  font-size: 1.3vw;
  padding: 3em 3em 2.3em 3em;
  border-radius: 3em;
  position: relative;

  h1 {
    color: #fff;
    text-align: left;
    font-size: 5em;
    margin: 0;
  }


  table {
    table-layout: fixed;
    border-collapse: collapse;
    width: 100%;

    th,
    td {
      padding: 0 0.5em;
      line-height: 1.3;
      text-wrap: nowrap;
      white-space: nowrap;

      &.wide {
        width: 45%;
      }
    }

    th:first-child {
      padding-left: 0;
    }

    td:last-child,
    th:last-child {
      padding-right: 0;
    }

    thead {
      th {
        color: $grey;
        font-size: 3em;
        text-align: left;
        font-weight: normal;
        padding: 0;

        vertical-align: bottom;

        &.center {
          text-align: center;
        }

        &.right {
          text-align: right;
        }

        &.big {
          font-size: 4em;
          width: 20%;
        }

        img {
          width: 2em;
          margin: -0.5em;
          transform: translateY(0.1em);

          &.gold-img {
            width: 2.5em;
            transform: translate(00em, -0.4em);
          }
        }
      }

      th:last-child {
        padding-left: 0.58em;
      }
    }

    .right {
      text-align: right;
    }

    tbody {
      tr {

        th {
          color: #fff;
          font-size: 3em;
          text-align: left;
          font-weight: bold;
        }

        td {
          color: #fff;
          font-size: 3.5em;
          text-align: center;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
      }
    }
  }

  .nickname {
    overflow: hidden;
    text-overflow: ellipsis;

    .win {
      color: $grey;
      font-size: 0.8em;
      font-weight: normal;
      margin-right: 0.1em;
    }
  }

  .green {
    color: #7ee927;
  }

  .gold {
    color: #ffdc9c;
    filter: drop-shadow(0 0 0.3em #a45c05);
  }

  .grey {
    color: $grey;
  }

  .bold {
    font-weight: bold;
  }

  .num {
    font-variant-numeric: tabular-nums;
  }
}
</style>
