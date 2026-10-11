# Ошибки написания кода

Пополняемый список замечаний пользователя к коду, который пишут ИИ-агенты. Прочитай его перед написанием или изменением кода и соблюдай правила в затрагиваемых участках.

## 1. Сплошная стена кода без смысловых блоков

В длинных функциях отделяй пустыми строками самостоятельные этапы: проверку входных данных, поиск готового значения, вычисления и финальный возврат. Связанные строки внутри одного этапа оставляй вместе. Разделение должно отражать структуру алгоритма, а не добавлять пустую строку после каждой строки кода. Короткие примитивные функции не дроби на блоки (см. правило 6).

Плохо — все этапы слиты:

```ts
if (!Number.isInteger(value) || value < 0) return { status: 'unresolved', reason: 'invalid' }
const key = shortKeys.get(value)
if (key !== undefined) return { status: 'ready', value: key }
const offset = value - PAIR_CODE_BASE
const mode = modesByPairCode.get(Math.floor(offset / GAMEPLAY_STRIDE))
const gameplay = gameplaysByCode.get(offset & GAMEPLAY_MASK)
if (mode !== undefined && gameplay !== undefined) return { status: 'ready', value: battleModeKey(mode, gameplay) }
return { status: 'unresolved', reason: 'invalid' }
```

Хорошо — каждый этап читается отдельно:

```ts
if (!Number.isInteger(value) || value < 0) return { status: 'unresolved', reason: 'invalid' }

const key = shortKeys.get(value)
if (key !== undefined) return { status: 'ready', value: key }

const offset = value - PAIR_CODE_BASE
const mode = modesByPairCode.get(Math.floor(offset / GAMEPLAY_STRIDE))
const gameplay = gameplaysByCode.get(offset & GAMEPLAY_MASK)

if (mode !== undefined && gameplay !== undefined) return { status: 'ready', value: battleModeKey(mode, gameplay) }
return { status: 'unresolved', reason: 'invalid' }
```

## 2. Громоздкие тернарные операторы

Не используй тернарный оператор, когда и условие, и варианты результата длинные. Переносы строк сами по себе не делают такое выражение удобным для чтения. Для возврата результата используй `if` с ранним `return`, затем обычный возврат альтернативы. Короткие и понятные тернарные выражения допустимы.

Плохо:

```ts
return mode !== undefined && gameplay !== undefined
  ? { status: 'ready', value: battleModeKey(mode, gameplay) } : { status: 'unresolved', reason: 'invalid' }
```

Хорошо:

```ts
if (mode !== undefined && gameplay !== undefined) return { status: 'ready', value: battleModeKey(mode, gameplay) }
return { status: 'unresolved', reason: 'invalid' }
```

## 3. Лишние ветвления и вложенность вместо раннего возврата

Если ветку можно завершить через `return`, делай это сразу и продолжай основной поток после неё. Не добавляй `else` после безусловного возврата и не оборачивай оставшийся код в дополнительный блок. Предпочитай короткий прямой поток, когда он сохраняет поведение и упрощает чтение.

Плохо:

```ts
if (key !== undefined) {
  return { status: 'ready', value: key }
} else {
  const offset = value - PAIR_CODE_BASE
  const mode = modesByPairCode.get(Math.floor(offset / GAMEPLAY_STRIDE))
  const gameplay = gameplaysByCode.get(offset & GAMEPLAY_MASK)

  if (mode !== undefined && gameplay !== undefined) {
    return { status: 'ready', value: battleModeKey(mode, gameplay) }
  } else {
    return { status: 'unresolved', reason: 'invalid' }
  }
}
```

Хорошо:

```ts
if (key !== undefined) return { status: 'ready', value: key }

const offset = value - PAIR_CODE_BASE
const mode = modesByPairCode.get(Math.floor(offset / GAMEPLAY_STRIDE))
const gameplay = gameplaysByCode.get(offset & GAMEPLAY_MASK)

if (mode !== undefined && gameplay !== undefined) return { status: 'ready', value: battleModeKey(mode, gameplay) }
return { status: 'unresolved', reason: 'invalid' }
```

## 4. Общая бинарная механика в игровом домене и QueryStorage

Не размещай в `shared/game/` бинарные функции, которые не знают об игровых сущностях.
Формат значения в URL — ответственность сериализатора. QueryStorage вызывает его,
но не должен отвечать за бинарную упаковку, Base62/Base64url или сжатие.
Общие бинарные примитивы размещай в `shared/utils/encoding/`; игровые словари
и их применение — в `shared/game/encoding/`, структуру конкретного формата — рядом с его сериализатором.

Плохо — общие `compactMask(values, options)` и `expandMask(bits, options)` в `game/utils/bitmask.ts`
или перенос сжатия сериализатора в QueryStorage только потому, что результат записывается в URL.

Хорошо — бинарные примитивы в `shared/utils/encoding/`, маски наций, классов и уровней
в `game/encoding/masks.ts`, а версия, заголовок и порядок полей сравнения — в его кодеке.

## 5. Вспомогательные типы и поиск компактеров в игровом домене

Результат восстановления компактного значения и поиск, используемый только компактерами,
размещай в `shared/game/encoding/`. Сами игровые каталоги остаются в `shared/game/domain/`.

Плохо — `Expansion` и `regionalTagLookup.ts` в `game/domain/catalog/`.

Хорошо — `Expansion` рядом с `CompactValue` в `game/encoding/types.ts`, поиск в `game/encoding/utils/regionalTagLookup.ts`.

## 6. Лишнее дробление коротких функций

Разбивай код на смысловые блоки только там, где кода много и разделение помогает читать алгоритм. В примитивной функции из нескольких строк пустая строка между проверкой и возвратом не нужна. То же относится к коротким callback-функциям и простым веткам внутри больших функций.

Плохо:

```ts
finish() {
  if (this.bytes.length > MAX_BYTES) return invalid()

  return Uint8Array.from(this.bytes)
}
```

Хорошо:

```ts
finish() {
  if (this.bytes.length > MAX_BYTES) return invalid()
  return Uint8Array.from(this.bytes)
}
```

## 7. Сокращённые методы вместо стрелочных функций в объектах

В литералах объектов записывай функции как свойства со стрелочными функциями: `compact: (...) => { ... }`, а не сокращённые методы `compact(...) { ... }`.

Исключение — функции, которым нужны собственные `this` или `arguments`: для них оставляй обычный метод. Стрелочная функция берёт `this` и `arguments` из внешней области, поэтому такая замена изменила бы поведение.

Плохо:

```ts
const compactor = {
  compact(tag: string, contextRegion?: string): CompactValue {
    return tag
  },
}
```

Хорошо:

```ts
const compactor = {
  compact: (tag: string, contextRegion?: string): CompactValue => {
    return tag
  },
}
```

## 8. Служебные утилиты рядом с основными файлами

Если служебный файл является частью одного значимого модуля, собери основной файл и его служебные файлы в папку этого модуля. Например, `battleModes.ts` и его таблицы `battleModeCodes.ts` должны лежать рядом в `battleModes/`. В этой папке один значимый модуль, поэтому дополнительная подпапка `utils/` не нужна.

Для общих служебных utils-функций учитывай количество значимых файлов в текущей директории. Если выделяешь такую функцию в отдельный файл и в директории уже больше двух значимых файлов, создай поддиректорию `utils/` и размести служебный файл в ней. Значимые файлы — основные модули или компоненты, определяющие назначение директории.

Если общий служебный файл уже лежит на верхнем уровне директории, перенеси его в `utils/` при добавлении второго значимого файла. При переносе обнови импорты и ссылки в документации.

Плохо — добавили второй основной модуль, оставив служебную утилиту рядом:

```text
encoding/
  vehicles.ts
  arenas.ts
  regionalIdPacking.ts
```

Хорошо:

```text
encoding/
  vehicles.ts
  arenas.ts
  utils/
    regionalIdPacking.ts
```

Плохо — часть одного модуля вынесена в общие утилиты:

```text
encoding/
  battleModes.ts
  utils/
    battleModeCodes.ts
```

Хорошо:

```text
encoding/
  battleModes/
    battleModes.ts
    battleModeCodes.ts
```

## 9. Копирование default в локальных обёртках QueryStorage

Не добавляй локальные фабрики и обёртки только для копирования массива, объекта или Set в default.
QueryStorage сам копирует напрямую заданный default через `structuredClone` при его получении.
Фабрика остаётся для динамического default или особого создания значения; она возвращает новый экземпляр сама.

Плохо:

```ts
regions: { ...setOfSerializer(['RU', 'EU']), default: () => new Set<'RU' | 'EU'>(['RU']) }
```

Хорошо:

```ts
regions: { ...setOfSerializer(['RU', 'EU']), default: new Set<'RU' | 'EU'>(['RU']) }
```

## 10. Ручная сборка стандартных параметров QueryStorage

Для стандартных форматов используй фабрики из `shared/uiKit/queryStorage/params.ts`,
а не локальные обёртки и повторяющиеся объекты с сериализатором, default и настройками.
У `oneOfParam` и `setOfParam` первые аргументы — допустимые значения и default,
последний необязательный объект — остальные настройки параметра. Set-фабрики принимают массив default сами.
Нестандартные кодеки и контекстные преобразования по-прежнему объявляй обычным объектом `QueryParam`.

Плохо:

```ts
nations: {
  ...setOfSerializer(nations), default: new Set(localDefaults.nations),
  label: 'nation', key: 'vehicles.nations'
}
```

Хорошо:

```ts
nations: setOfParam(nations, localDefaults.nations, { label: 'nation', key: 'vehicles.nations' })
```

## 11. Нечитаемые символы в компактных ссылках

Для значений `compare` используй Base62 с алфавитом `0–9A–Za–z`. Оценивай не только
допустимость символов в URL, но и внешний вид ссылки: `_` сливается с подчёркиванием.

Плохо — оставлять `_` в ссылке сравнения только потому, что Base64url технически безопасен.

Хорошо — сохранять бинарную структуру кодека, а байты преобразовывать в Base62 общей утилитой.

## 12. Настройки графика внутри бинарного сравнения

В `compare` сохраняй только источники, их фильтры, цвета и видимость. Общие настройки графика
храни отдельными читаемыми параметрами: `metric`, `step`, `avg`, `annotations`.
URL-ключи метрик строй из существующего `availableSlots`, для исторических событий используй их ID из каталога.

Плохо — отдельный бинарный словарь метрик, маски шага, усреднения и аннотаций внутри `compare`.

Хорошо — `metric=winrate&step=week&avg=3&annotations=versions,razvorot&compare=HpeZ`.

## 13. Регистр и разделители составных значений в URL

Составные названия значений в query, включая группировки, метрики и агрегации, записывай в kebab-case:
строчные буквы, слова и агрегация разделены дефисами. Внутренние ключи преобразуй в сериализаторе;
для восстановления используй известный каталог значений. Например, `classesByLevel` записывается как `classes-by-level`.
Проверяй коллизии. Максимальный вид содействия называй `maxAssist` (`max-assist` в URL),
чтобы отличать его от агрегации `assist_max` (`assist-max`) без исключений в сериализаторе.

Плохо — `group=classesByLevel`, `metric=damagePerLifeMinute_q50` или `metric=damage_q50`.

Хорошо — `group=classes-by-level`, `metric=damage-per-life-minute-q50` и `metric=damage-q50`.

## 14. Порядок параметров страницы техники в URL

Задавай явные `priority` в определениях QueryStorage. Первыми идут фильтры боя:
`region` → `mode` → `arena` → `platoon` → `result` → `battle-level`.
Затем параметры таблицы: `group` → `search` → `type` → `nation` → `level` → `only-actual` →
`min-battles` → `min-players`. Настройки сравнения идут в конце:
`metric` → `step` → `avg` → `annotations` → `compare`. Не полагайся на алфавитный порядок
для этих параметров; аннотации должны находиться после скользящего среднего.
Сами объявления в `defineParams` и `useQueryStorage`, включая spread наборов параметров,
располагай в том же порядке, что и в URL, даже если порядок уже обеспечен через `priority`.

Плохо — `annotations=versions&level=5&search=КВ&type=HT&region=EU&metric=winrate`.

Хорошо — `region=EU&search=КВ&type=HT&level=5&metric=winrate&annotations=versions`.

## 15. Проверка совместимости ссылок только через round-trip

Для бинарных ссылок `compare` сохраняй фиксированные пары «строка ↔ ожидаемая модель» в `codec.fixtures.json`.
Не вычисляй ожидаемые строки и JSON текущим кодеком при запуске теста: согласованное изменение
сериализатора и десериализатора может сохранить round-trip, но сломать уже выпущенные ссылки.
Фиксируй также итоговые hex-цвета, чтобы перестановка палитры не осталась незамеченной.

Плохо — только `deserialize(serialize(state)) === state` или автоматическое обновление эталонов после падения теста.

Хорошо — отдельно проверить чтение сохранённой строки, точную строку при записи ожидаемой модели
и нормализацию полного входа с тегами/hex-цветами. Изменение существующих эталонов требует осознанного решения о формате.

## Как пополнять список

При новом замечании пользователя добавляй правило: что было сделано плохо, как нужно писать и короткие примеры «плохо / хорошо». Если замечание относится к существующему правилу, уточни его вместо дублирования. Фиксируй подтверждённые замечания, не придумывай новые запреты от себя.
