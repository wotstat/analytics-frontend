<template>
  <div class="battle">
    <div class="result-container">
      <div class="result" :class="meta.result"></div>
    </div>

    <div class="container card">
      <div class="left">
        <div class="arena-background"></div>

        <VehicleImage :tag="meta.tankTag" size="shop" class="vehicle" />
        <div class="arena-info">
          <h4>{{ getArenaName(meta.arena) }}</h4>
          <p>{{ meta.battleMode }}</p>
        </div>
        <h5 class="player-name">{{ meta.player }}</h5>
        <h5 class="vehicle-name">{{ getTankName(meta.tankTag, true) }}</h5>
      </div>
      <div class="right">
        <div class="title-line">
          <h3>{{ meta.title }}</h3>
          <div class="info">
            <div class="item">
              <img :src="DmgIcon" alt="download count">
              <p>{{ utils.downloadCount }}</p>
            </div>
          </div>
        </div>
        <div class="stats">
          <BattleStatValue :value="stats.damage" tooltip="Урон" />
          <BattleStatValue :value="stats.assist" tooltip="Ассист" />
          <BattleStatValue :value="stats.blocked" tooltip="Заблокированно бронёй" />
          <BattleStatValue :value="stats.kills" tooltip="Уничтожено" />
          <BattleStatValue :value="stats.xp" tooltip="Опыт" />
          <BattleStatValue :value="stats.spot" tooltip="Обнаружено" />
          <BattleStatValue :value="stats.damage" tooltip="Урон" />
          <BattleStatValue :value="timeProcessor(stats.lifetime).join(':')" tooltip="Время жизни" />
        </div>
        <div class="meta">
          <p class="item">Регион: <span>{{ meta.region }}</span></p>
          <p class="item">Результат: <span>{{ meta.result }}</span></p>
          <p class="item">Респ: <span>{{ meta.team }}</span></p>
          <p class="item">Версия: <span>{{ meta.version }}</span></p>
          <p class="item">Дата: <span>{{ meta.date }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DmgIcon from '@/assets/efficiency-icon/dmg.png'
import VehicleImage from '@/components/vehicles/VehicleImage.vue';
import { timeProcessor } from '@/utils';
import { getArenaName, getTankName } from '@/utils/i18n';
import BattleStatValue from './BattleStatValue.vue';


const props = defineProps<{
  meta: {
    title: string,
    region: string
    team: string
    result: 'win' | 'lose' | 'tie'
    version: string
    date: string
    player: string
    arena: string
    tankTag: string,
    battleMode: string
  },
  stats: {
    damage: number,
    assist: number,
    blocked: number,
    kills: number,
    xp: number,
    lifetime: number,
    spot: number,
  },
  utils: {
    downloadCount: number
  }

}>()


</script>

<style scoped lang="scss">
h3,
h4,
h5 {
  margin: 0;
}


h3 {
  font-size: 20px;
}

h4 {
  font-size: 16px;
}

h5 {
  font-size: 16px;
}

.battle {
  line-height: 1;
  transition-property: box-shadow;
  transition-duration: 0.3s;
  border-radius: 15px;
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);

    .container {
      .left {
        .arena-background {
          filter: brightness(0.6);
        }
      }
    }
  }

  .result-container {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 30px;
    border-radius: 15px;
    overflow: hidden;

    .result {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 5px;
      z-index: 2;

      &.tie {
        background: rgb(255, 204, 0);
      }

      &.win {
        background: rgb(52, 199, 88);
      }

      &.lose {
        background: rgb(255, 59, 48);
      }
    }
  }

  .container {
    display: flex;

    .left {
      width: 35%;
      min-width: 150px;

      display: flex;
      flex-direction: column;
      position: relative;

      .arena-info {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .player-name {
        position: absolute;
        bottom: 0;
        left: 0;
      }

      .vehicle-name {
        position: absolute;
        bottom: 0;
        right: 0;
      }

      .vehicle {
        position: absolute;
        max-height: 130%;
        max-width: 90%;
        right: -15px;
        bottom: -10px;
      }

      .arena-background {
        position: absolute;
        left: -15px;
        top: -15px;
        bottom: -15px;
        right: -15px;
        border-top-left-radius: 15px;
        border-bottom-left-radius: 15px;
        background: url('https://tomato.gg/maps/10_hills.webp');
        background-size: cover;
        filter: brightness(0.5);
        mask-image: linear-gradient(to left, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1) 40%);
        transition: filter 0.3s;
      }
    }

    .right {
      flex: 1;

      .title-line {
        display: flex;

        h3 {
          flex: 1;
        }

        .info {
          .item {
            display: flex;
            align-items: flex-end;

            img {
              height: 20px;
            }
          }
        }
      }

      .stats {
        margin: 20px 0;

        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        font-size: 16px;
        margin-left: 20px;
      }

      .meta {
        display: flex;
        margin-left: 20px;
        font-size: 14px;
        justify-content: space-between;


        color: rgb(193, 193, 193);

        span {
          color: white;
          font-weight: bold;
        }
      }
    }
  }
}
</style>