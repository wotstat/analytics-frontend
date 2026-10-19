import { defineMetaDefinition, everyDays } from '@/meta/utils'
import VehiclesTableMetaCard from './table/VehiclesTableMetaCard.vue'
import VehiclesCompareMetaCard from './compare/VehiclesCompareMetaCard.vue'
import { vehiclesMetaCatalog } from './utils/catalog.ts'
import { vehiclesCompareMetaTags, vehiclesTableMetaTags } from './utils/tags.ts'

const vehiclesPage = (url: URL) => /^\/session\/vehicles\/?$/.test(url.pathname)
const vehiclesMetaCache = { revisionKey: () => everyDays(1), cache: { htmlSeconds: 10, imageSeconds: 3600 } }

export default defineMetaDefinition({
  id: 'infographics-vehicles', component: VehiclesTableMetaCard, priority: 10,
  match: vehiclesPage,
  name: 'Сравнение техники/Техника',
  summary: 'Крупный заголовок, полные строки и рамка таблицы, продолжающаяся до нижнего края карточки.',
  examples: [
    { name: 'Техника · RU', url: 'https://wotstat.info/session/vehicles' },
    { name: 'Только X уровень', url: 'https://wotstat.info/session/vehicles?level=10' },
    { name: 'По уровням', url: 'https://wotstat.info/session/vehicles?group=levels' },
    { name: 'По типам', url: 'https://wotstat.info/session/vehicles?group=classes' },
    { name: 'Типы по уровням · VIII–X', url: 'https://wotstat.info/session/vehicles?group=classes-by-level&level=8,9,10' },
    { name: 'EU · за неделю', url: 'https://wotstat.info/session/vehicles?region=EU&period=week' },
    { name: 'X · тяжёлые · победы', url: 'https://wotstat.info/session/vehicles?level=10&type=HT&result=win' },
    { name: 'Один столбец · урон', url: 'https://wotstat.info/session/vehicles?columns=damage&sort=damage' },
    { name: 'Четыре выбранных столбца', url: 'https://wotstat.info/session/vehicles?columns=assist-radio,damage,winrate,blocked&sort=assist-radio' },
    { name: 'Пять столбцов · сортировка по содействию', url: 'https://wotstat.info/session/vehicles?columns=assist-radio,damage,winrate,player-count,battles&sort=assist-radio' },
    { name: 'Составная сортировка · два показателя', url: 'https://wotstat.info/session/vehicles?columns=battles,player-count,winrate,damage,blocked,assist-radio&sort=assist-radio,blocked-asc' },
    { name: 'Медиана · время и дистанция', url: 'https://wotstat.info/session/vehicles?columns=damage-q50,duration,mileage&sort=damage-q50' },
    { name: 'Медиана · по возрастанию', url: 'https://wotstat.info/session/vehicles?columns=damage-q50,duration,mileage&sort=damage-q50-asc' },
    { name: 'Проценты и дробные значения', url: 'https://wotstat.info/session/vehicles?columns=winrate,survival,kills,spotted&sort=kills' },
    { name: 'Пустая выборка', url: 'https://wotstat.info/session/vehicles?search=несуществующий-танк' },
  ],
  contexts: { vehiclesMetaCatalog },
  meta: (url, { vehiclesMetaCatalog }) => vehiclesTableMetaTags(url, vehiclesMetaCatalog),
  ...vehiclesMetaCache,
})

export const compare = defineMetaDefinition({
  id: 'infographics-vehicles-compare', component: VehiclesCompareMetaCard, priority: 100,
  match: url => vehiclesPage(url) && Boolean(url.searchParams.get('compare')?.trim()),
  name: 'Сравнение техники/Сравнение',
  summary: 'Один-два танка без легенды; три и более источника или категории — панорама с легендой.',
  examples: [
    { name: 'Три танка · урон', url: 'https://wotstat.info/session/vehicles?region=RU&compare=1JNxP4fcCSA375qQz40k3owcagZjw54TRxz0gPWFr1BElpdfAPd3VCU0xoNsI8VoJfrxocFmpJzeZbLq61qr' },
    { name: 'Два танка · урон', url: 'https://wotstat.info/session/vehicles?region=RU&compare=4u2COGR' },
    { name: 'ИС-7 · урон', url: 'https://wotstat.info/session/vehicles?region=RU&compare=HpeZ' },
    { name: 'Два танка · победы', url: 'https://wotstat.info/session/vehicles?region=RU&metric=winrate&compare=4u2COGR' },
    { name: 'Объект 261 · победы', url: 'https://wotstat.info/session/vehicles?region=RU&metric=winrate&compare=2Vgd2OvHGjYwA3DFyqfvV3J5AcCxiT' },
    { name: 'Уровни VIII / IX / X', url: 'https://wotstat.info/session/vehicles?region=RU&compare=1AhWI6' },
    { name: 'Один уровень · X', url: 'https://wotstat.info/session/vehicles?region=RU&compare=KARwIvzg' },
    { name: 'Типы · ТТ / ПТ-САУ', url: 'https://wotstat.info/session/vehicles?region=RU&compare=HcCR' },
    { name: 'ИС-7 и X уровень', url: 'https://wotstat.info/session/vehicles?region=RU&compare=bhk3i5jGI7wk9KUOgtrxwJvuYqfs' },
    { name: 'ИС-7 · RU против EU', url: 'https://wotstat.info/session/vehicles?region=RU&compare=I6lztDPPLRlKi2EFqmqVPtLaZL4ZGpVq7IO' },
    { name: 'ИС-7 · победы против поражений', url: 'https://wotstat.info/session/vehicles?region=RU&compare=4yjpQKM1tnyexiI4Cr1BFHDHRDMtxZxl015RpI' },
    { name: 'Некорректная ссылка', url: 'https://wotstat.info/session/vehicles?region=RU&compare=invalid' },
  ]
  ,
  contexts: { vehiclesMetaCatalog },
  meta: (url, { vehiclesMetaCatalog }) => vehiclesCompareMetaTags(url, vehiclesMetaCatalog),
  ...vehiclesMetaCache,
})
