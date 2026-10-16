import type { Component } from 'vue'
import type { MetaCardPatternProps } from './pattern'
import GradientBackground from '../backgrounds/GradientBackground.vue'
import DiagonalBackground from '../backgrounds/DiagonalBackground.vue'
import GrainBackground from '../backgrounds/GrainBackground.vue'
import GridBackground from '../backgrounds/GridBackground.vue'
import ContoursBackground from '../backgrounds/ContoursBackground.vue'
import AuroraBackground from '../backgrounds/AuroraBackground.vue'
import RaysBackground from '../backgrounds/RaysBackground.vue'
import EmberBackground from '../backgrounds/EmberBackground.vue'
import AuroraMistBackground from '../backgrounds/AuroraMistBackground.vue'
import AuroraFlowBackground from '../backgrounds/AuroraFlowBackground.vue'
import ContoursSteelBackground from '../backgrounds/ContoursSteelBackground.vue'
import ContoursGlowBackground from '../backgrounds/ContoursGlowBackground.vue'
import RaysMatteBackground from '../backgrounds/RaysMatteBackground.vue'
import RaysGlowBackground from '../backgrounds/RaysGlowBackground.vue'
import VehiclesBackground from '../backgrounds/VehiclesBackground.vue'

export interface MetaCardBackgroundPreview {
  id: string
  number: string
  component: Component
  name: string
  description: string
  props?: MetaCardPatternProps
  supportsPattern?: boolean
}

export const metaCardBackgrounds: MetaCardBackgroundPreview[] = [
  { id: 'gradient', number: '01', component: GradientBackground, name: 'Серо-синий', description: 'Мягкий холодный переход и спокойные края.' },
  { id: 'diagonal', number: '02', component: DiagonalBackground, supportsPattern: false, name: 'Свет с другого края', description: 'Развёрнутый градиент с синим светом сверху слева и тёмным правым углом.' },
  { id: 'grain', number: '03', component: GrainBackground, name: 'Графит и зерно', description: 'Почти однотонный графит с мелкой матовой текстурой.' },
  { id: 'grid', number: '04', component: GridBackground, supportsPattern: false, name: 'Координатная сетка', description: 'Тонкая сетка на тёмном синем фоне, как на технической схеме.' },
  { id: 'contours', number: '05', component: ContoursBackground, supportsPattern: false, name: 'Рельеф', description: 'Плавные топографические линии и приглушённый оливковый оттенок.' },
  { id: 'aurora', number: '06', component: AuroraBackground, name: 'Северное сияние', description: 'Рассеянный свет в оттенках индиго и бирюзы на глубоком тёмном фоне.' },
  { id: 'rays', number: '07', component: RaysBackground, supportsPattern: false, name: 'Диагональные плоскости', description: 'Крупные полупрозрачные полосы и стальной синий оттенок.' },
  { id: 'ember', number: '08', component: EmberBackground, name: 'Медная орбита', description: 'Тёплый медный свет, тонкие дуги и лёгкое зерно.' },
  { id: 'aurora-mist', number: '09', component: AuroraMistBackground, name: 'Сияние: дымка', description: 'Фон по умолчанию: мягкие цвета 06 без очерченных кругов света на тёмной основе.' },
  { id: 'aurora-flow', number: '10', component: AuroraFlowBackground, name: 'Сияние: поток', description: 'Бирюза и индиго перетекают по диагонали, как рассеянный свет сквозь ткань.' },
  { id: 'contours-steel', number: '11', component: ContoursSteelBackground, supportsPattern: false, name: 'Рельеф: сталь', description: 'Холодный сине-серый рельеф с более редкими и тихими линиями.' },
  { id: 'contours-glow', number: '12', component: ContoursGlowBackground, supportsPattern: false, name: 'Рельеф: свечение', description: 'Топографические линии 05 под мягким бирюзовым и лиловым светом.' },
  { id: 'rays-matte', number: '13', component: RaysMatteBackground, supportsPattern: false, name: 'Плоскости: матовые', description: 'Геометрия 07 с мягкими краями и спокойным графитовым оттенком.' },
  { id: 'rays-glow', number: '14', component: RaysGlowBackground, supportsPattern: false, name: 'Плоскости: свечение', description: 'Диагональные слои со светом индиго и бирюзы из варианта 06.' },
  { id: 'vehicles', number: '15', component: VehiclesBackground, name: 'Статистика техники', description: 'Исходный фон страницы статистики техники: графит и едва заметный холодный свет.' },
  { id: 'pattern-dots', number: '16', component: AuroraMistBackground, props: { pattern: 'dots' }, name: 'Точки', description: 'Редкая сетка мелких точек поверх тёмной дымки 09.' },
  { id: 'pattern-crosses', number: '18', component: AuroraMistBackground, props: { pattern: 'crosses' }, name: 'Кресты', description: 'Небольшие координатные отметки на мягком тёмном фоне.' },
]
