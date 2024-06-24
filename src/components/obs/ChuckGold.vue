<template>
  <div class="card" :style="{ backgroundColor }">
    <div class="main">
      <table>
        <thead>
          <tr>
            <th class="wide"></th>
            <th class="center"><img src="/dmg.png"></th>
            <th class="center" :style="{ width: '14%' }"><img src="/kill.png"></th>
            <th class="right" :style="{ width: '15%' }"><img src="/gold.png" class="gold-img"></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(player, i) in current">
            <th class="wide nickname"><span class="win">({{ player.wins }}/{{ player.battles }})</span>
              {{ nickProcessor(player.nickname) }}
            </th>
            <td class="num">{{ processor(dmgTween[i]) }}</td>
            <td class="num" :style="{ width: '10%' }">{{ fragsTween[i] }}</td>
            <td class="gold bold right num" :style="{ width: '15%' }">{{ Math.round(scoreTween[i] / 10) }}</td>
          </tr>
        </tbody>
      </table>

      <div :style="{ height: `${spacer ?? 6}em` }"></div>

      <div class="l2">
        <div class="flex gap-0">
          <div class="flex-1">
            <table>
              <tr v-for="(_, i) in new Array(5).fill(0)">
                <td class="grey num" :style="{ width: '13%' }">{{ i + 1 }}.</td>
                <td class="grey ellipsis">{{ top[i]?.nickname ?? '' }}</td>
                <td class="bold right num gold" :style="{ width: '26%' }">
                  {{ top[i] ? Math.round(top[i].score / 10) : '' }}
                </td>
              </tr>
            </table>
          </div>
          <div class="sep"></div>
          <div class="flex-1">

            <table>
              <tr v-for="(_, i) in new Array(5).fill(0)">
                <td class="grey num" :style="{ width: '15%' }">{{ i + 6 }}.</td>
                <td class="grey ellipsis">{{ top[i + 5]?.nickname ?? '' }}</td>
                <td class="bold right num gold" :style="{ width: '26%' }">
                  {{ top[i + 5] ? Math.round(top[i + 5].score / 10) : '' }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  current: {
    nickname: string;
    battles: number;
    wins: number;
    dmg: number;
    frags: number;
    score: number;
  }[];
  top: {
    nickname: string;
    score: number;
  }[];
  backgroundColor?: string;
  spacer?: number;
}>();


const backgroundColor = computed(() => `#${props.backgroundColor ?? '353535'}`)


const processor = useFixedSpaceProcessor(0)

function nickProcessor(name: string) {
  if (name.endsWith('_Chuck')) return name.slice(0, -6);
  return name;
}

const dmg = computed(() => props.current.map(t => t.dmg));
const dmgTween = useTweenCounter(dmg, { duration: 1 });

const frags = computed(() => props.current.map(t => t.frags));
const fragsTween = useTweenCounter(frags, { duration: 1 });

const score = computed(() => props.current.map(t => t.score));
const scoreTween = useTweenCounter(score, { duration: 1 });


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
