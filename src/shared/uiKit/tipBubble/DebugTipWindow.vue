<template>
  <div class="debug-tip">

    <div class="settings">
      <div class="show-debug-tips">
        <input type="checkbox" name="debug-tips" id="debug-tips" v-model="showDebugTips">
        <label for="debug-tips">Show Debug Tips</label>
      </div>

      <button @click="clearLocalStorage">Clear bubbles storage</button>
    </div>

    <div class="debug-tips" v-if="showDebugTips">
      <div class="cell" v-for="(value, index) in displayed" @click="displayed[index] = !displayed[index]">
        <input type="checkbox" v-model="displayed[index]">
        <TipBubbleText class="d-tip-bubble" :bubbleKey="`test-${index}`" :direction="'left'" :autoExtend="'always'"
          :groupKey="'debug-group'" :text="`test-${index}`" :display="displayed[index]" />
      </div>
    </div>

    <div class="active-tips">

      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Acc</th>
            <th>Show</th>
            <th>Open</th>
            <th>Wrong</th>
            <th>Visible Wrong</th>
            <th>Hide Wrong</th>
            <th colspan="3">Interact O/S/W</th>
            <th>May Display</th>
            <th>Should Display</th>
            <th>Displayed</th>
            <th>Auto Extend</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="[key, state] in debugInfo.bubbles.entries()" :key="key">
            <th>{{ key }}</th>
            <template v-if="state.state && state.props">
              <td :class="state.state.accepted.toString()">{{ state.state.accepted }}</td>
              <td>{{ state.state.openCount }}</td>
              <td>{{ state.state.showCount }}</td>
              <td>{{ state.state.wrongCount }}</td>
              <td>{{ state.state.visibleWrongCount }}</td>
              <td>{{ state.state.lastHideWrong }}</td>
              <td>{{ state.state.lastInteractOpen }}</td>
              <td>{{ state.state.lastInteractShow }}</td>
              <td>{{ state.state.lastInteractWrong }}</td>
              <td :class="state.props.mayDisplay.toString()">{{ state.props.mayDisplay }}</td>
              <td :class="state.props.shouldDisplay.toString()">{{ state.props.shouldDisplay }}</td>
              <td :class="state.props.displayed.toString()">{{ state.props.displayed }}</td>
              <td :class="state.props.autoExtend.toString()">{{ state.props.autoExtend }}</td>
            </template>
            <td v-else colspan="13">Always hidden</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="groups" v-if="debugInfo.groups.size > 0">

      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th>Displayed Bubble</th>
            <th>Waiting Queue</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="[group, state] in debugInfo.groups.entries()" :key="group">
            <th>{{ group }}</th>
            <td>{{ state.displayedBubble }}</td>
            <td>{{ state.waitingQueue.join(', ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import TipBubbleText from './TipBubbleText.vue'
import { debugInfo } from './useTipBubble'

const showDebugTips = ref(false)
const displayed = ref(Array.from({ length: 5 }, () => false))

function clearLocalStorage() {
  window.resetTipBubbles?.()
  location.reload()
}

</script>


<style lang="scss" scoped>
.active-tips,
.groups {
  table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      border: 1px solid #ffffff19;
      padding: 0.25em 0.5em;
      font-size: 12px;
      text-align: center;
    }

    thead {
      background: #ffffff19;
    }

    tbody {
      th {
        text-align: left;
      }
    }
  }

}

.active-tips {
  display: flex;
  flex-direction: column;
  gap: 0.5em;

  table {
    tbody {
      td {
        &.true {
          background: #00ff5519;
        }

        &.false {
          background: #ff000019;
        }
      }
    }
  }
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  margin-top: 1em;

  table {
    tr {
      th:first-child {
        width: 25%;
      }

      td:nth-child(2) {
        width: 25%;
      }
    }
  }
}

.debug-tips {
  display: flex;
  gap: 0.5em;
  margin-bottom: 1em;
  cursor: pointer;

  .cell {
    background: #ffffff19;
    padding: 0.5em;
    border-radius: 4px;
    border: 1px solid #ffffff19;
    flex: 1;
    height: 36px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
}

.settings {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 1em;

  label {
    cursor: pointer;
  }

  .show-debug-tips {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.2em;
  }

  button {
    background: #ffffff19;
    border: 1px solid #ffffff19;
    padding: 0.4em 1em;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #ffffff29;
      border-color: #ffffff29;
    }
  }
}
</style>