<template>
  <DebugSection title="API и с чего начать" id="api"
    description="Весь публичный интерфейс — одна функция без опций. Всё остальное поведение зашито в компонентах и наружу не настраивается."
    source="src/shared/uiKit/focusEffect/focusEffect.ts">

    <table class="debug-table">
      <thead>
        <tr>
          <th>что</th>
          <th>как есть</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>showFocusEffect(element)</th>
          <td>единственная функция; принимает только элемент, никаких опций</td>
        </tr>
        <tr>
          <th>время жизни</th>
          <td>{{ EFFECT_LIFETIME_MS }} мс, захардкожено в setTimeout внутри showFocusEffect</td>
        </tr>
        <tr>
          <th>снять досрочно</th>
          <td class="false">нельзя — публичного API нет</td>
        </tr>
        <tr>
          <th>продлить</th>
          <td class="false">нельзя — только повторный вызов</td>
        </tr>
        <tr>
          <th>FocusEffectTarget.options</th>
          <td>объявлен пустым объектом: задел, который ничего не делает</td>
        </tr>
        <tr>
          <th>где рисуется</th>
          <td>#focus-effect-root, телепорт в body, z-index 5000</td>
        </tr>
        <tr>
          <th>слежение за целью</th>
          <td class="true">getBoundingClientRect каждый кадр — едет за целью при скролле и ресайзе</td>
        </tr>
        <tr>
          <th>активных эффектов сейчас</th>
          <td>{{ activeEffectsCount }}</td>
        </tr>
      </tbody>
    </table>

    <p class="debug-note">
      Боевое использование одно — <span class="debug-value">src/pages/install/Index.vue</span>, подсветка шага в
      установщике модов. То есть компонент почти не обкатан, и странице стоит верить больше, чем привычке.
    </p>

    <p class="debug-note">
      <span class="debug-value">FocusEffectRoot</span> уже смонтирован в <span class="debug-value">App.vue</span> —
      монтировать его на странице второй раз не нужно. Эффект рисуется поверх всей страницы, снаружи
      <span class="debug-value">.debug-root</span>, поэтому классы <span class="debug-value">.debug-*</span> до него
      не достают.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import { activeEffectsCount, EFFECT_LIFETIME_MS } from '../shared/focusEffectControl'

</script>
