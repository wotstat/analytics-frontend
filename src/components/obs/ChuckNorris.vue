<template>
  <div class="card" :class="players.length > 1 ? '' : 'solo'">
    <!-- <h1>По правилам Чака</h1> -->
    <table>

      <thead>
        <tr>
          <th v-if="players.length > 1" class="wide">Никнейм</th>
          <th class="green center">Очки в ср. ({{ battles }})</th>
          <th class="center">Посл. бой</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(player, i) in players" v-if="players.length > 1">
          <th class="wide nickname">{{ nickProcessor(player.nickname) }}</th>
          <td class="green">{{ processor(avgTween[i]) }}</td>
          <td>{{ processor(lastTween[i]) }}</td>
        </tr>

        <tr class="avg">
          <th class="wide" v-if="players.length > 1">Сумма</th>
          <td class="green">{{ processor(sumTween[0]) }}</td>
          <td>{{ processor(sumTween[1]) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';


const props = defineProps<{
  players: {
    nickname: string;
    avg: number;
    last: number;
  }[];
  battles: number,
  sum: {
    avg: number,
    last: number,
  };
}>();

const processor = useFixedSpaceProcessor(0)

function nickProcessor(name: string) {
  if (name.endsWith('_Chuck')) return name.slice(0, -6);
  return name;
}

const avg = computed(() => props.players.map(t => t.avg));
const avgTween = useTweenCounter(avg, { duration: 1 });

const last = computed(() => props.players.map(t => t.last));
const lastTween = useTweenCounter(last, { duration: 1 });

const sum = computed(() => [props.sum.avg, props.sum.last]);
const sumTween = useTweenCounter(sum, { duration: 1 })

const route = useRoute();

onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';
})
</script>

<style lang="scss" scoped>
.card {
  font-size: 1.3vw;
  padding: 3em 3em 2.3em 3em;
  border-radius: 3em;
  background-color: #3a3a3ad2;
  // background-color: #2022315a;
  // background: linear-gradient(180deg, #2e2e2e70, #00000068);
  margin: 3em;
  box-shadow: 0 0 3em 0px #000000c1;

  &.solo {
    font-size: 2vw;
  }

  $grey: #c4c4c4;

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
        width: 40%;
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

        &.center {
          text-align: center;
        }
      }

      th:last-child {
        padding-left: 0.58em;
      }
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

      .avg {
        th {
          color: $grey;
          font-size: 3em;
          text-align: left;
          font-weight: normal;
        }

        td {
          font-size: 4em;
          text-align: center;
          font-weight: 900;
        }

      }
    }
  }

  .nickname {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .green {
    color: #7ee927;
    // color: rgb(191, 245, 110);

    // color: #e7ffde;
    // filter: drop-shadow(0 0 0.3em #639e31);
  }

  .footer {
    color: $grey;
    font-size: 3em;
    padding-left: 2px;
    text-align: left;
    margin: 0;

    span {
      font-weight: 800;
    }
  }
}
</style>
