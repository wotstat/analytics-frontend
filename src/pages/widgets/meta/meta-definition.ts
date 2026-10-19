import { defineMetaDefinition, everyHours } from '@/meta/utils'
import MetaCard from '@/shared/ui/meta/components/MetaCard.vue'
import WidgetsMetaCard from './WidgetsMetaCard.vue'
import { getWidgetRoute, widgetCatalog } from './widgetCatalog.ts'

const description = 'Виджеты для «Мира танков» и World of Tanks. Добавляйте их прямо в игру или в OBS.'

export const widgetsMeta = defineMetaDefinition({
  id: 'widgets',
  priority: 10,
  match: url => /^\/widgets\/?$/.test(url.pathname),
  component: MetaCard,
  name: 'Виджеты/Каталог',
  summary: 'Общая карточка раздела виджетов.',
  examples: [{ name: 'Виджеты', url: 'https://wotstat.info/widgets' }],
  meta: { title: 'Виджеты', description, imageAlt: 'Виджеты — WotStat Analytics' },
  props: {
    title: 'Виджеты',
    subtitle: 'Для Мира Танков, World of Tanks и OBS',
    footer: 'Мир танков · World of Tanks',
  },
})

export const widgetMeta = defineMetaDefinition({
  id: 'widget',
  priority: 20,
  match: url => getWidgetRoute(url) !== null,
  component: WidgetsMetaCard,
  contexts: { catalog: widgetCatalog },
  name: 'Виджеты/Превью виджета',
  summary: 'Название, короткое описание и iframe с превью выбранного виджета.',
  examples: [
    { name: 'Статистика коробок', url: 'https://wotstat.info/widgets/hangar/lootbox-universal' },
    { name: 'Счётчик боёв', url: 'https://wotstat.info/widgets/counters/battle' },
    { name: 'Оборудование', url: 'https://wotstat.info/widgets/nidin/equipments' },
    { name: 'Универсальная прогрессия', url: 'https://wotstat.info/widgets/competitive/universal' },
    { name: 'Bongo Cat', url: 'https://wotstat.info/widgets/meme/bongo-cat' },
    { name: 'Прогрессия Натиска', url: 'https://wotstat.info/widgets/efficiency/comp7' },
  ],
  meta: (url, { catalog }) => {
    const widget = catalog?.get(getWidgetRoute(url)!)
    if (!widget) return {
      title: 'Виджеты WotStat',
      description,
      imageAlt: 'Виджеты WotStat',
    }

    return {
      title: `${widget.name} — Виджеты WotStat`,
      description: widget.description || description,
      imageAlt: `${widget.name} — превью виджета`,
    }
  },
  props: (url, { catalog }) => {
    const widget = catalog?.get(getWidgetRoute(url)!)
    if (!widget) return {
      title: 'Виджет для игры',
      description,
      hasPreview: !catalog,
    }

    return {
      title: widget.name,
      description: widget.description || description,
      hasPreview: widget.hasPreview,
    }
  },
  revisionKey: () => everyHours(1),
})
