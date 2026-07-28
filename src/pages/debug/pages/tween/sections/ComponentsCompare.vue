<template>
  <DebugSection title="TweenValue vs SimpleTweenValue" id="components"
    description="Одно и то же целевое значение подано в оба компонента с одинаковыми options — числа должны идти синхронно. Смотри, где расходятся возможности, а не сама анимация."
    source="src/shared/ui/tween/TweenValue.vue, src/shared/ui/tween/SimpleTweenValue.vue">

    <table class="debug-table">
      <thead>
        <tr>
          <th>проп</th>
          <th>TweenValue</th>
          <th>SimpleTweenValue</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>value: number</th>
          <td class="true">есть</td>
          <td class="true">есть</td>
        </tr>
        <tr>
          <th>options?: TweenOptions</th>
          <td class="true">есть</td>
          <td class="true">есть</td>
        </tr>
        <tr>
          <th>processor / raw / space / precision</th>
          <td class="true">есть</td>
          <td class="true">есть</td>
        </tr>
        <tr>
          <th>tag?: string</th>
          <td class="true">оборачивает в &lt;component :is="tag"&gt;</td>
          <td class="false">нет — всегда голый текст</td>
        </tr>
        <tr>
          <th>class?: string | string[] | Record</th>
          <td class="true">есть, прокидывается на tag</td>
          <td class="false">нет</td>
        </tr>
        <tr>
          <th>default slot { value }</th>
          <td class="true">есть — можно обернуть в свою разметку</td>
          <td class="false">нет</td>
        </tr>
        <tr>
          <th>startAnimationInPreview?: boolean</th>
          <td class="false">нет</td>
          <td class="true">есть — первое значение всегда 0, дальше сразу тянется к value</td>
        </tr>
        <tr>
          <th>внутренняя реализация</th>
          <td>useProcessed() → useTweenComputed(effect)</td>
          <td>свой ref + watch(immediate) + useTweenRef — та же ветка форматирования продублирована руками</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Итог: бери <b>SimpleTweenValue</b>, если нужен голый текст и не нужны tag/class/slot — например
      startAnimationInPreview удобен именно там, где значение должно эффектно «набраться» при появлении карточки.
      Бери <b>TweenValue</b>, если нужна обёртка (tag/class) или кастомная разметка вокруг числа через слот.
      На вход оба принимают одно и то же — переключение между ними ничего не меняет в форматировании.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">value</span>
        <input type="number" v-model.number="target" step="any">
      </label>

      <button class="debug-btn" @click="target = 0">0</button>
      <button class="debug-btn" @click="target = -12345">-12345</button>
      <button class="debug-btn" @click="target = 1234567.891">1234567.891</button>

      <label class="debug-control">
        <span class="debug-label">easing</span>
        <select v-model="easingKey">
          <option v-for="key in easingKeys" :key="key" :value="key">{{ key }}</option>
        </select>
      </label>

      <label class="debug-control">
        <span class="debug-label">duration</span>
        <input type="range" min="0" max="3000" step="50" v-model.number="duration">
        <span class="debug-value">{{ duration }}</span>
      </label>

      <label class="debug-control">
        <span class="debug-label">space</span>
        <input type="checkbox" v-model="space">
      </label>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 260px">
      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue, без tag</span>
        <span class="value">
          <TweenValue :value="target" :options :space />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue, tag="span" + слот</span>
        <TweenValue :value="target" :options :space tag="span" class="value" v-slot="{ value }">
          <span class="slot-wrap">→ {{ value }}</span>
        </TweenValue>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">SimpleTweenValue</span>
        <span class="value">
          <SimpleTweenValue :value="target" :options :space />
        </span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">TweenValue, проп class="class-probe" (должна быть красная рамка)</span>
        <TweenValue :value="target" :options :space tag="span" class="value class-probe" />
        <span class="debug-hint">рамки нет: class объявлен в defineProps TweenValue.vue, но нигде не забинжен в шаблоне
          — проп не долетает до DOM</span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">
          SimpleTweenValue, startAnimationInPreview
          <button class="debug-btn" @click="previewKey++">пересоздать</button>
        </span>
        <span class="value">
          <SimpleTweenValue :key="previewKey" :value="target" :options :space start-animation-in-preview />
        </span>
      </div>
    </div>

    <p class="debug-note">
      «пересоздать» меняет :key и монтирует SimpleTweenValue заново — так видно, что startAnimationInPreview
      срабатывает только на монтировании: у обычного компонента без key повторный подъём того же value ничего
      не запускает, тянется как всегда от текущего значения.
    </p>

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">raw</span>
        <input type="checkbox" v-model="raw">
      </label>
      <label class="debug-control">
        <span class="debug-label">precision</span>
        <input type="number" min="0" max="6" v-model.number="precision">
      </label>
      <span class="debug-hint">raw и precision тоже общие — приоритет: processor → precision → raw → округление</span>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 220px">
      <div class="demo-card debug-col">
        <span class="debug-hint">raw + space одновременно</span>
        <span class="value">
          <TweenValue :value="target" :options raw :space="true" />
        </span>
        <span class="debug-hint">space молча игнорируется — ветка raw возвращает число как есть, до space дело не
          доходит</span>
      </div>

      <div class="demo-card debug-col">
        <span class="debug-hint">precision={{ precision }} + space</span>
        <span class="value">
          <TweenValue :value="target" :options :precision :space />
        </span>
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import TweenValue from '@/shared/ui/tween/TweenValue.vue'
import SimpleTweenValue from '@/shared/ui/tween/SimpleTweenValue.vue'
import { easing } from '@/shared/ui/tween/easing'
import { TweenOptions } from '@/shared/ui/tween/useTweenRef'

const easingKeys = Object.keys(easing) as (keyof typeof easing)[]

const target = ref(4213)
const easingKey = ref<keyof typeof easing>('out-quad')
const duration = ref(800)
const space = ref(true)
const raw = ref(false)
const precision = ref(2)
const previewKey = ref(0)

const options = computed<TweenOptions>(() => ({ duration: duration.value, easing: easingKey.value }))
</script>


<style scoped lang="scss">
.demo-card {
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.6em 0.8em;
}

.value {
  font-family: var(--debug-mono);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}

.slot-wrap {
  color: var(--blue-thin-color);
}

.class-probe {
  outline: 2px solid #ff5555;
  background: #ff000019;
  padding: 0.1em 0.3em;
}
</style>
