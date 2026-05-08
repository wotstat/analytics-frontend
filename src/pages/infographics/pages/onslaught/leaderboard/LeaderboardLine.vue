<template>
  <tr>
    <td class="rank">
      <span class="value">{{ spaceProcessor(line.lastRank) }}</span>
      <span v-if="line.lastDayRank == 0" class="new">NEW</span>
      <span v-else-if="line.lastDayRank - line.lastRank != 0" class="delta" :class="{
        'up': line.lastDayRank - line.lastRank > 0,
        'down': line.lastDayRank - line.lastRank < 0,
      }">
        <TriangleUp class="triangle" /> {{ Math.abs(line.lastDayRank - line.lastRank) }}
      </span>
      <span v-else class="no-change">–</span>
    </td>

    <td class="player-name">
      <a :href="accountLink(line.bdid, line.name, game)" target="_blank" rel="noopener noreferrer">
        <span class="name">{{ line.name }}</span>
      </a>
      <span class="clan-tag" :style="{
        color: `#${line.clanColor.toString(16).padStart(6, '0')}`,
      }" v-if="line.clan"> [{{ line.clan }}]</span>
    </td>

    <td class="battles-today">
      <span v-if="line.lastDayRank != 0 && line.lastBattlesCount - line.lastDayBattlesCount != 0" class="battles-delta">
        {{ line.lastBattlesCount - line.lastDayBattlesCount }}
      </span>
      <span v-else>–</span>
    </td>

    <td class="battles-total">
      <span>{{ line.lastBattlesCount }}</span>
    </td>

    <td class="rating">
      <span class="value">{{ spaceProcessor(line.lastRating) }}</span>
      <span v-if="line.lastDayRank == 0" class="new">NEW</span>
      <span v-else-if="line.lastRating - line.lastDayRating != 0" class="delta" :class="{
        'up': line.lastRating - line.lastDayRating > 0,
        'down': line.lastRating - line.lastDayRating < 0,
      }">
        <TriangleUp class="triangle" /> {{ Math.abs(line.lastRating - line.lastDayRating) }}
      </span>
      <span v-else class="no-change">–</span>
    </td>
  </tr>
</template>


<script setup lang="ts">
import { accountLink, GameVendor } from '@/shared/game/wot'
import TriangleUp from './assets/triangle-up.svg'
import { spaceProcessor } from '@/shared/utils/processors/useSpaceProcessor'

const props = defineProps<{
  line: {
    name: string
    bdid: number
    clan: string | null
    clanColor: number
    lastRank: number
    lastDayRank: number
    lastBattlesCount: number
    lastDayBattlesCount: number
    lastRating: number
    lastDayRating: number
  }
  game: GameVendor
}>()
</script>


<style lang="scss" scoped>
td {
  padding: 20px 15px;
  line-height: 1.2;
  white-space: nowrap;
  color: white;

  &.rank {
    font-variant-numeric: tabular-nums;

    .value {
      display: inline-block;
      min-width: 3ch;
      text-align: right;
    }
  }

  &.player-name {
    white-space: wrap;

    a {
      color: inherit;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &.rating {
    font-variant-numeric: tabular-nums;
    text-align: center;

    .value {
      display: inline-block;
      min-width: 5ch;
      text-align: right;
      font-weight: bold;
    }

    .delta,
    .new,
    .no-change {
      display: inline-block;
      min-width: 5ch;
      text-align: left;
    }

    .new {
      min-width: calc(5ch / 0.75);
    }
  }

  &.battles-today {
    text-align: center;
    color: #c8c8c8;
  }

  &.battles-total {
    text-align: center;
    color: #c8c8c8;
  }

  .delta {

    .triangle {
      display: inline-block;
      height: 0.6em;
    }

    &.down {
      color: #ff6060;

      .triangle {
        transform: rotate(180deg);
      }
    }

    &.up {
      color: #57ff6e;
    }
  }

  .new {
    font-size: 0.75em;
    color: #ffd557;
    font-weight: bold;
  }

  .no-change {
    color: #717171;
    font-weight: bold;
  }

  .delta,
  .new,
  .no-change {
    margin-left: 10px;
  }
}


@container (max-width: 700px) {

  td {
    font-size: 14px;

    &.rank,
    &.rating {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 15px;
      gap: 5px;
      text-align: center;

      .value {
        min-width: auto;
      }

      .delta,
      .new,
      .no-change {
        margin-left: 0;
      }
    }

    &.rating {

      .delta,
      .new,
      .no-change {
        min-width: auto;
      }
    }
  }
}

@container (max-width: 500px) {
  td {
    &.player-name {
      padding: 10px 5px;
      word-break: break-all;
    }

    &.battles-today {
      display: none;
    }
  }
}

@container (max-width: 400px) {
  td {
    &.battles-total {
      display: none;
    }
  }
}

@container (max-width: 350px) {
  td {
    &.player-name {
      .clan-tag {
        display: none;
      }
    }
  }
}
</style>