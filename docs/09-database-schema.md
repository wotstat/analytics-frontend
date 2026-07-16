# Схема БД `WOT` (ClickHouse)

> Справочник по таблицам и колонкам базы **`WOT`** для агента, работающего с ClickHouse напрямую.
> Состояние на июль 2026. Описания колонок частично взяты из комментариев в самой БД —
> они местами шутливые/неточные, поэтому **проверяй по смыслу, а не верь комментарию слепо.**

Подключение и слой запросов во фронте — в [03-data-clickhouse.md](03-data-clickhouse.md).
Фронт ходит только в базу **`WOT`** под read-only юзером `public`. Базы `MT-36-1`, `BOB25`,
`Positions`, `WOTINSPECTOR` — изолированные легаси, здесь не описываются.

## Источники данных

1. **Мод в игре** собирает игровые события у игроков и шлёт их в таблицы с префиксом **`Event_*`**.
2. **Отдельный микросервис (cron-таски)** наполняет справочники: часть выгружается из игровых
   ресурсов и актуализируется каждую версию игры, часть — фоновый периодический опрос игрового API.

> ⚠️ Не все таблицы используются сейчас — многие заведены под будущие фичи. А используемые местами
> задействованы криво/через костыли и будут переписываться: **не считай текущие запросы эталоном.**

## Общие конвенции `Event_*`

- **`id`** (`UInt128`) монотонно кодирует время: `id = timestamp_ms × 1e10` (см. `dateToDbIndex`
  во фронте). Отсюда фильтр по периоду делается диапазоном по `id`, а не только по `dateTime`.
- События внутри одного боя связаны через **`onBattleStartId`** (= `id` соответствующего
  `Event_OnBattleStart`).
- **Сортировка (`ORDER BY`) идёт по игроку** (`playerName` в начале ключа, после режимных колонок),
  **партиционирование — по месяцу** `toYYYYMM(dateTime)`. → дёшевы выборки по конкретному игроку и по
  диапазону дат; выборки «по всем игрокам сразу» — тяжёлые.
- Везде есть `region`, `gameVersion`/`modVersion` (плюс разобранные на `*_major/minor/...` и
  `*Comparable`-версии для semver-фильтров), `playerName`, `accountDBID`.
- **Вложенные массивы** (`playersResults.*`, `results.*`, `session.*`, `shells.*`) — это
  Nested-структуры: параллельные массивы, где i-й элемент каждого подстолбца относится к одному
  объекту (игроку / попаданию / бою в сессии). Разворачиваются через `ARRAY JOIN`.

---

## Категориальные значения

Значения ниже — фактические (из `GROUP BY` по данным), с расшифровкой. Множества `LowCardinality`
открыты: движок игры добавляет новые теги режимов/карт/танков со временем.

### Регионы (`region`)

`RU` (≈75% боёв), `EU`, `NA`, `ASIA`, `CN`; плюс служебные `CT` (Common Test) и редкий `KR`.
В справочниках регион ограничен боевыми серверами (`RU/EU/NA/ASIA/CN`).

### Тип боя (`battleMode`, ~46 значений)

| Значение | Что это |
| --- | --- |
| `REGULAR` | Случайные бои (рандом) — основная масса |
| `FUN_RANDOM`, `RANDOM_NP2` | Рандом с изменёнными правилами (событийный) |
| `COMP7`, `COMP7_LIGHT` | «Натиск» (7×7 сезонный рейтинг) — осн./облегчённый |
| `TRAINING_COMP7`, `TOURNAMENT_COMP7` | «Натиск»: тренировка / турнир |
| `RANKED` | Ранговые бои |
| `EPIC_BATTLE` | «Линия фронта» (30×30) |
| `EPIC_RANDOM`, `EPIC_RANDOM_TRAINING` | «Большие бои» 30×30 (и тренировка) |
| `GLOBAL_MAP` | Глобальная карта (клановые) |
| `FORT_BATTLE_2` | Укрепрайон (клановые) |
| `SORTIE_2` | Вылазка (клановые) |
| `BATTLE_ROYALE_SOLO`, `BATTLE_ROYALE_SQUAD`, `BATTLE_ROYALE_TRN_*` | «Стальной охотник» (соло/взвод/трен.) |
| `VERSUS_AI` | Бой с ботами (PvE) |
| `TRAINING` | Тренировочная комната |
| `MAPBOX` | Полигон / Mapbox (тест карт) |
| `MAPS_TRAINING` | Обучение картам |
| `HISTORICAL_BATTLES` | Исторические бои |
| `BOB` | «Битва блогеров» |
| `TOURNAMENT_REGULAR` | Турниры |
| `EVENT_BATTLES`, `EVENT_BATTLES_2` | Событийные бои |
| `WINBACK` | Режим для вернувшихся игроков |
| `STORY_MODE*` | Сюжетный режим (событие) |

Прочие — сезонные/событийные режимы: `COSMIC_EVENT`, `WHITE_TIGER(_2)`, `HALLOWEEN(_MEDIUM/_HARD/_DEFENCE)`,
`LAST_STAND(_MEDIUM/_HARD)`, `GRINCH`, `RACES`, `PORTAL`, `HB_OFFENCE`, `HB_DEFENCE` и т.п.

### Режим геймплея (`battleGameplay`)

| Значение | Что это |
| --- | --- |
| `ctf` | Стандартный бой (захват базы) |
| `domination` | Встречный бой (одна общая база) |
| `assault`, `assault2` | Штурм (одна команда атакует базу) |
| `ctf30x30` | Стандартный для «Больших боёв» 30×30 |
| `epic` | «Линия фронта» |
| `comp7` | «Натиск» |
| `domination3` | Вариант доминации |
| `bob` | «Битва блогеров» |
| `maps_training` | Обучение картам |
| `bootcamp` | Учебный полигон (новички) |

### Результат боя

- **`result`** — `Enum8`: `lose=0`, `win=1`, `tie=2`.
- **`finishReason`** — причина завершения: `unknown`, `extermination` (уничтожены все),
  `base` (захват базы), `timeout` (истекло время), `destroyedObjects`, `winPoints`, `winPointsCap`,
  `objectivesCompleted`, `hbEnemyExtermination`, `hbAllySpgExtermination`, `failure`, `technical`,
  `ownVehicleDestroyed`, `allyKilled`, `afk`.
- **`winnerTeam`** — номер победившей команды: `0` = ничья, `1`/`2` — команды в обычном бою,
  `>2` — в многокомандных режимах. **`playerTeam`** — номер команды игрока (та же нумерация).

### Причина завершения полёта снаряда (`hitReason`, Event_OnShot)

`Enum8`: `tank=1` (попал в танк), `terrain=2` (в землю/объект), `other=3`, `none=4`.

### Тип танка (`tankType`) — ⚠️ два разных кодирования

- В таблицах **`Event_*`**: `HT`, `MT`, `LT`, `AT`, `SPG` (короткие коды; так же во фронте — `StatParams.types`).
- В справочниках (`Vehicles`, `Tanks`, …), поле **`type`**: `heavyTank`, `mediumTank`, `lightTank`,
  `AT-SPG`, `SPG` (полные имена из клиента игры).

При джойне Event-данных со справочником техники это нужно приводить вручную.

### Роль танка (`tankRole`)

`role_<КЛАСС>_<роль>`: класс — `HT/MT/LT/ATSPG/SPG`; роль — `assault`, `support`, `universal`,
`break`, `sniper`, `wheeled` (колёсные ЛТ), `flame`. Спец-значения: `NotDefined` и пустая строка `''`
(старые бои / режимы без ролей). Примеры: `role_HT_break`, `role_MT_sniper`, `role_LT_wheeled`, `role_SPG`.

### Нации (`nation`)

`ussr`, `germany`, `usa`, `uk`, `france`, `china`, `japan`, `sweden`, `poland`, `czech`, `italy`.

### Уровень (`level` / `tankLevel`)

`1`–`10` (боевые уровни); `11` встречается для особой/событийной техники.

### Тип снаряда (`shellTag`)

| Тег | Снаряд |
| --- | --- |
| `ARMOR_PIERCING` | Бронебойный (ББ) |
| `ARMOR_PIERCING_CR` | Бронебойный подкалиберный (APCR, часто премиум/«голда») |
| `ARMOR_PIERCING_FSDS` | Подкалиберный оперённый (APFSDS) |
| `HOLLOW_CHARGE` | Кумулятивный (HEAT/КС) |
| `HIGH_EXPLOSIVE` | Осколочно-фугасный (ОФ) |
| `FLAME` | Огнемётный (спец-режимы) |

### Карты (`arenaTag`)

Тег вида `NN_name` (напр. `01_karelia`, `04_himmelsdorf`). Суффиксы = вариации карты:
`_att` (штурмовой вариант), `_def` (оборона), `_fp`/`_ny`/`_lunar_26` (зимние/новогодние/сезонные),
`_wt` (White Tiger), `_mb`/`_nb` (Mapbox/варианты), `_ls25`/`_ls26` (Last Stand),
`_hw24` (Halloween), `_sm24`/`_sm25`/`_scc` (события) и т.д. Локализованные имена — в
`ArenasLocalization` (`nameRU/nameEU/nameNA/nameAS/nameCN`); часть имён — плейсхолдеры (`#...` или `tag/name`).

---

## Таблицы событий (`Event_*`)

### `Event_OnBattleStart`

Старт боя. Пишется модом, когда бой прогрузился.

- **ORDER BY:** `battleMode, playerName, tankLevel, tankType, arenaTag, id, sipHash64(id)`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `battleTime` | `Int32` | Время относительно начала боя в мс |
| `arenaId` | `UInt64` | Id арены |
| `gameplayMask` | `UInt32` | Маска режимов игры (хз зачем нужно) |
| `loadBattlePeriod` | `Enum8('other' = 1, 'IDLE' = 2, 'WAITING' = 3, 'PREBATTLE' = 4, 'BATTLE' = 5, 'AFTERBATTLE' = 6)` | Стадия боя в момент прогрузки |
| `inQueueWaitTime` | `UInt32` | Время в очереди перед началом боя в мс |
| `loadTime` | `UInt32` | Время в загрузки карты в мс |
| `preBattleWaitTime` | `UInt32` | Время в ожидания начала боя после загрузки в мс |
| `arenaTag` | `LowCardinality(String)` | Название карты |
| `playerName` | `String` | Ник игрока |
| `playerClan` | `String` | Клан игрока |
| `playerClanDBID` | `UInt32` | ID клана |
| `accountDBID` | `UInt64` | ID аккаунта |
| `battleMode` | `LowCardinality(String)` | Тип боя |
| `battleGameplay` | `LowCardinality(String)` | Режим игры |
| `serverName` | `LowCardinality(String)` | Название сервера |
| `serverOnline` | `UInt32` | Онлайн на сервере |
| `regionOnline` | `UInt32` | Онлайн в регионе |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `team` | `UInt8` | Команда |
| `tankTag` | `LowCardinality(String)` | Название танка |
| `tankType` | `LowCardinality(String)` | Тип танка |
| `tankLevel` | `UInt8` | Уровень танка |
| `gunTag` | `LowCardinality(String)` | Тег орудия |
| `spawnPoint_x` | `Float32` | Координата X точки спавна |
| `spawnPoint_y` | `Float32` | Координата Y точки спавна |
| `spawnPoint_z` | `Float32` | Координата Z точки спавна |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `session.startTime` | `DateTime64(3)` | Дата начала сессии по локальному времени клиента |
| `session.startAgo` | `UInt32` | Время в секундах со старта сессии |
| `session.lastBattleAgo` | `UInt32` | Время в секундах со старта прошлого боя |
| `session.battleStarts` | `UInt32` | Число начатых за сессию боёв |
| `session.battleResults` | `UInt32` | Число результатов |
| `session.winCount` | `UInt32` | Число побед из результатов |
| `session.totalShots` | `UInt32` | Число выстрелов |
| `session.totalShotsDamaged` | `UInt32` | Число выстрелов с уроном |
| `session.totalShotsHit` | `UInt32` | Число попавших по танкам |
| `session.lastResult` | `Array(Enum8('win' = 1, 'lose' = 2, 'tie' = 3))` | Результаты за прошлые 10 боёв (победа/поражение/ничья) |
| `session.lastXpPlace` | `Array(UInt8)` | Место в команде по опыту за последние 10 результатов |
| `session.lastDmgPlace` | `Array(UInt8)` | Место в команде по урону за последние 10 результатов |
| `tankRole` | `LowCardinality(String)` | Роль танка |
| `allyTeamHealth` | `UInt16` | ХП союзной команды |
| `enemyTeamHealth` | `UInt16` | ХП вражеской команды |
| `allyTeamMaxHealth` | `UInt16` | Максимальное ХП союзной команды |
| `enemyTeamMaxHealth` | `UInt16` | Максимальное ХП вражеской команды |
| `allyTeamFragsCount` | `UInt8` | Количество фрагов союзников |
| `enemyTeamFragsCount` | `UInt8` | Количество фрагов врагов |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `extra` | `JSON(`bob.allyBloggerId` UInt8, `bob.allySkill` LowCardinality(String), `bob.enemyBloggerId` UInt8, `bob.enemySkill` LowCardinality(String), `bob.personalLevel` UInt16, `bob.stats.1.rank` UInt8, `bob.stats.1.score` UInt32, `bob.stats.2.rank` UInt8, `bob.stats.2.score` UInt32, `bob.stats.3.rank` UInt8, `bob.stats.3.score` UInt32, `bob.stats.4.rank` UInt8, `bob.stats.4.score` UInt32)` | Дополнительная информация актуальная только во время определённых событий |
| `mapsBlackList` | `Array(LowCardinality(String))` | Карты в чёрном списке игрока (исключены из подбора) |
| `comp7SkillTag` | `LowCardinality(String)` | Тег роли/навыка в «Натиске» |
| `equipment` | `Array(LowCardinality(String))` | Установленное оборудование (теги) |
| `consumables` | `Array(LowCardinality(String))` | Расходники (теги) |
| `battleBooster` | `LowCardinality(String)` | Боевой бустер (тег) |
| `crew` | `Array(Tuple(roles Array(LowCardinality(String)), level UInt8, skills Array(Tuple(tag LowCardinality(String), level UInt8))))` | Экипаж: роли, уровень танка экипажа, прокачанные перки (tag+level) |
| `shells.ARMOR_PIERCING` | `UInt16` | Кол-во бронебойных (ББ) снарядов в боекомплекте |
| `shells.HOLLOW_CHARGE` | `UInt16` | Кол-во кумулятивных (HEAT) снарядов в БК |
| `shells.ARMOR_PIERCING_FSDS` | `UInt16` | Кол-во подкалиберных оперённых (APFSDS) в БК |
| `shells.ARMOR_PIERCING_CR` | `UInt16` | Кол-во бронебойных подкалиберных (APCR, «голда») в БК |
| `shells.FLAME` | `UInt16` | Кол-во огнемётных снарядов в БК (спец-режимы) |
| `shells.HIGH_EXPLOSIVE` | `UInt16` | Кол-во осколочно-фугасных (ОФ) снарядов в БК |
| `systemInfo.*` | `Tuple(~30 полей)` | Железо/ОС игрока (cpu, gpu, ram, разрешение…). **RESTRICTED — не выводить наружу.** |

### `Event_OnBattleResult`

Итоговая статистика боя. Основная таблица для аналитики результатов. `personal.*` — метрики самого игрока (его строка результатов), `playersResults.*` — те же метрики массивами по всем игрокам боя (индекс i — один игрок).

- **ORDER BY:** `battleMode, playerName, tankLevel, tankType, arenaTag, id, sipHash64(id)`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `onBattleStartId` | `UInt128` | Id события начала боя |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `arenaId` | `UInt64` | Id арены из танков |
| `result` | `Enum8('lose' = 0, 'win' = 1, 'tie' = 2)` | Результат боя |
| `finishReason` | `LowCardinality(String)` | Причина завершения боя (см. раздел «Результат боя») |
| `credits` | `Int32` | Заработанные кредиты |
| `originalCredits` | `Int32` | Заработанные кредиты без према и прочего |
| `duration` | `UInt16` | Длительность боя в секундах |
| `teamHealth` | `Array(UInt16)` | Здоровье команд |
| `winnerTeam` | `UInt16` | Победившая команда |
| `playerTeam` | `UInt8` | Команда игрока |
| `arenaTag` | `LowCardinality(String)` | Название карты |
| `playerName` | `String` | Ник игрока |
| `playerClan` | `String` | Клан игрока |
| `playerClanDBID` | `UInt32` | ID клана |
| `accountDBID` | `UInt64` | ID аккаунта |
| `battleMode` | `LowCardinality(String)` | Тип боя |
| `battleGameplay` | `LowCardinality(String)` | Режим игры |
| `serverName` | `LowCardinality(String)` | Название сервера |
| `serverOnline` | `UInt32` | Онлайн на сервере |
| `regionOnline` | `UInt32` | Онлайн в регионе |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `team` | `UInt8` | Команда |
| `tankTag` | `LowCardinality(String)` | Название танка |
| `tankType` | `LowCardinality(String)` | Тип танка |
| `tankLevel` | `UInt8` | Уровень танка |
| `gunTag` | `LowCardinality(String)` | Тег орудия |
| `playersResults.spotted` | `Array(UInt16)` | Обнаружено (засвечено) противников |
| `playersResults.mileage` | `Array(UInt16)` | Пройдено за бой, м |
| `playersResults.damageAssistedTrack` | `Array(UInt16)` | Содействие уроном сведением гусениц (обездвиживание) |
| `playersResults.damageReceivedFromInvisibles` | `Array(UInt16)` | Полученный урон от невидимых противников |
| `playersResults.damageReceived` | `Array(UInt16)` | Полученный урон |
| `playersResults.piercingsReceived` | `Array(UInt16)` | Получено пробитий |
| `playersResults.directHitsReceived` | `Array(UInt16)` | Получено прямых попаданий |
| `playersResults.piercingEnemyHits` | `Array(UInt16)` | Нанесено пробитий по противникам |
| `playersResults.explosionHits` | `Array(UInt16)` | Нанесено попаданий взрывом (ОФ/фугас) по противникам |
| `playersResults.damageAssistedRadio` | `Array(UInt16)` | Содействие уроном по засвету (разведка) |
| `playersResults.stunDuration` | `Array(Float32)` | Суммарная нанесённая длительность оглушения (арта), сек |
| `playersResults.damageBlockedByArmor` | `Array(UInt16)` | Урон, заблокированный бронёй |
| `playersResults.damageDealt` | `Array(UInt16)` | Нанесённый урон |
| `playersResults.xp` | `Array(UInt16)` | Полученный опыт за бой |
| `playersResults.team` | `Array(UInt8)` | Номер команды игрока |
| `playersResults.damaged` | `Array(UInt16)` | Число противников, которым нанесён урон |
| `playersResults.damageAssistedStun` | `Array(UInt16)` | Содействие уроном за счёт нанесённого оглушения (арта) |
| `playersResults.explosionHitsReceived` | `Array(UInt16)` | Получено попаданий взрывом |
| `playersResults.directEnemyHits` | `Array(UInt16)` | Нанесено прямых попаданий по противникам |
| `playersResults.stunned` | `Array(UInt16)` | Число оглушённых противников (нанесено, только арта) |
| `playersResults.shots` | `Array(UInt16)` | Сделано выстрелов |
| `playersResults.kills` | `Array(UInt16)` | Уничтожено противников (фраги) |
| `playersResults.lifeTime` | `Array(UInt16)` | Время жизни в бою, сек |
| `playersResults.tankTag` | `Array(LowCardinality(String))` | Тег танка |
| `playersResults.tankRole` | `Array(LowCardinality(String))` | Роль танка (см. tankRole) |
| `playersResults.tankType` | `Array(LowCardinality(String))` | Тип танка (HT/MT/LT/AT/SPG) |
| `playersResults.tankLevel` | `Array(UInt8)` | Уровень танка |
| `playersResults.killerIndex` | `Array(Int8)` | Индекс убийцы в массивах playersResults (−1 — выжил) |
| `playersResults.maxHealth` | `Array(UInt16)` | Максимальное HP танка |
| `playersResults.health` | `Array(UInt16)` | HP на конец боя (0 — уничтожен) |
| `playersResults.isAlive` | `Array(Bool)` | Выжил ли в бою |
| `playersResults.squadID` | `Array(UInt8)` | ID взвода (0 — не во взводе) |
| `playersResults.bdid` | `Array(UInt64)` | ID аккаунта игрока |
| `playersResults.name` | `Array(String)` | Ник игрока |
| `playersResults.clan` | `Array(String)` | Клан игрока |
| `playersResults.clanDBID` | `Array(UInt32)` | ID клана игрока |
| `playersResults.playerRank` | `Array(UInt8)` | Место в стальном охотнике |
| `playersResults.comp7PrestigePoints` | `Array(UInt16)` | Очки престижа натиска |
| `playersResults.comp7SkillTag` | `Array(LowCardinality(String))` | Тег роли/навыка в «Натиске» |
| `playersResults.comp7Rank` | `Array(LowCardinality(String))` | Ранг в «Натиске» |
| `personal.spotted` | `UInt16` | Обнаружено (засвечено) противников |
| `personal.mileage` | `UInt16` | Пройдено за бой, м |
| `personal.damageAssistedTrack` | `UInt16` | Содействие уроном сведением гусениц (обездвиживание) |
| `personal.damageReceivedFromInvisibles` | `UInt16` | Полученный урон от невидимых противников |
| `personal.damageReceived` | `UInt16` | Полученный урон |
| `personal.piercingsReceived` | `UInt16` | Получено пробитий |
| `personal.directHitsReceived` | `UInt16` | Получено прямых попаданий |
| `personal.piercingEnemyHits` | `UInt16` | Нанесено пробитий по противникам |
| `personal.explosionHits` | `UInt16` | Нанесено попаданий взрывом (ОФ/фугас) по противникам |
| `personal.damageAssistedRadio` | `UInt16` | Содействие уроном по засвету (разведка) |
| `personal.stunDuration` | `Float32` | Суммарная нанесённая длительность оглушения (арта), сек |
| `personal.damageBlockedByArmor` | `UInt16` | Урон, заблокированный бронёй |
| `personal.damageDealt` | `UInt16` | Нанесённый урон |
| `personal.xp` | `UInt16` | Полученный опыт за бой |
| `personal.team` | `UInt8` | Номер команды игрока |
| `personal.damaged` | `UInt16` | Число противников, которым нанесён урон |
| `personal.damageAssistedStun` | `UInt16` | Содействие уроном за счёт нанесённого оглушения (арта) |
| `personal.explosionHitsReceived` | `UInt16` | Получено попаданий взрывом |
| `personal.directEnemyHits` | `UInt16` | Нанесено прямых попаданий по противникам |
| `personal.stunned` | `UInt16` | Число оглушённых противников (нанесено, только арта) |
| `personal.shots` | `UInt16` | Сделано выстрелов |
| `personal.kills` | `UInt16` | Уничтожено противников (фраги) |
| `personal.lifeTime` | `UInt16` | Время жизни в бою, сек |
| `personal.tankTag` | `LowCardinality(String)` | Тег танка |
| `personal.tankType` | `LowCardinality(String)` | Тип танка (HT/MT/LT/AT/SPG) |
| `personal.tankRole` | `LowCardinality(String)` | Роль танка |
| `personal.tankLevel` | `UInt8` | Уровень танка |
| `personal.killerIndex` | `Int8` | Индекс убийцы в массивах playersResults (−1 — выжил) |
| `personal.maxHealth` | `UInt16` | Максимальное HP танка |
| `personal.health` | `UInt16` | HP на конец боя (0 — уничтожен) |
| `personal.isAlive` | `Bool` | Выжил ли в бою |
| `personal.squadID` | `UInt8` | Id взвода игрока. 0 - не взвод |
| `personal.playerRank` | `UInt8` | Место в стальном охотнике |
| `personal.comp7PrestigePoints` | `UInt16` | Очки престижа натиска |
| `personal.comp7SkillTag` | `LowCardinality(String)` | Тег роли/навыка в «Натиске» |
| `personal.comp7Rank` | `LowCardinality(String)` | Ранг в «Натиске» |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `session.startTime` | `DateTime64(3)` | Дата начала сессии по локальному времени клиента |
| `session.startAgo` | `UInt32` | Время в секундах со старта сессии |
| `session.lastBattleAgo` | `UInt32` | Время в секундах со старта прошлого боя |
| `session.battleStarts` | `UInt32` | Число начатых за сессию боёв |
| `session.battleResults` | `UInt32` | Число результатов |
| `session.winCount` | `UInt32` | Число побед из результатов |
| `session.totalShots` | `UInt32` | Число выстрелов |
| `session.totalShotsDamaged` | `UInt32` | Число выстрелов с уроном |
| `session.totalShotsHit` | `UInt32` | Число попавших по танкам |
| `session.lastResult` | `Array(Enum8('win' = 1, 'lose' = 2, 'tie' = 3))` | Результаты за прошлые 10 боёв (победа/поражение/ничья) |
| `session.lastXpPlace` | `Array(UInt8)` | Место в команде по опыту за последние 10 результатов |
| `session.lastDmgPlace` | `Array(UInt8)` | Место в команде по урону за последние 10 результатов |
| `allyTeamCount` | `UInt8` | Число танков в команде союзников |
| `enemyTeamCount` | `UInt8` | Число танков в команде противника |
| `allyTeamSurvivedCount` | `UInt8` | Выжило союзников к концу боя |
| `enemyTeamSurvivedCount` | `UInt8` | Выжило противников к концу боя |
| `ltCount` | `UInt8` | Число ЛТ в бою (обе команды) |
| `htCount` | `UInt8` | Число ТТ в бою (обе команды) |
| `mtCount` | `UInt8` | Число СТ в бою (обе команды) |
| `atCount` | `UInt8` | Число ПТ-САУ в бою (обе команды) |
| `spgCount` | `UInt8` | Число САУ в бою (обе команды) |
| `playersCount` | `UInt8` | Количество игроков в бою |
| `playerTeamPositionByDamage` | `UInt8` | Место игрока в команде по урону |
| `playerTeamPositionByRadio` | `UInt8` | Место игрока в команде по засвету (ассист радио) |
| `playerTeamPositionByKills` | `UInt8` | Место игрока в команде по фрагам |
| `visibleLevels` | `Array(UInt8)` | Уровни техники, присутствующей в бою |
| `visibleLevelsCount` | `Array(UInt8)` | Кол-во техники каждого уровня (парно к visibleLevels) |
| `gunMarkSum` | `UInt16` | Суммарный прогресс отметок на стволе (MoE) у игрока |
| `tankRole` | `LowCardinality(String)` | Роль танка |
| `allyTeamHealth` | `UInt16` | ХП союзной команды |
| `enemyTeamHealth` | `UInt16` | ХП вражеской команды |
| `allyTeamMaxHealth` | `UInt16` | Максимальное ХП союзной команды |
| `enemyTeamMaxHealth` | `UInt16` | Максимальное ХП вражеской команды |
| `allyTeamFragsCount` | `UInt8` | Количество фрагов союзников |
| `enemyTeamFragsCount` | `UInt8` | Количество фрагов врагов |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `extra` | `JSON(`bob.allyBloggerId` UInt8, `bob.allySkill` LowCardinality(String), `bob.enemyBloggerId` UInt8, `bob.enemySkill` LowCardinality(String), `bob.personalLevel` UInt16, `bob.stats.1.rank` UInt8, `bob.stats.1.score` UInt32, `bob.stats.2.rank` UInt8, `bob.stats.2.score` UInt32, `bob.stats.3.rank` UInt8, `bob.stats.3.score` UInt32, `bob.stats.4.rank` UInt8, `bob.stats.4.score` UInt32)` | Дополнительная информация актуальная только во время определённых событий |
| `currencies.originalCredits` | `Int32` | Кредиты за бой без бустеров/према |
| `currencies.originalGold` | `Int32` | Золото за бой (базовое) |
| `currencies.originalCrystal` | `Int32` | Боны за бой (базовые) |
| `currencies.subtotalCredits` | `Int32` | Кредиты за бой до автосписаний (промежуточный итог) |
| `currencies.autoRepairCost` | `Int32` | Автосписание за ремонт, кредиты |
| `currencies.autoLoadCredits` | `Int32` | Автозакупка снарядов, кредиты |
| `currencies.autoLoadGold` | `Int32` | Автозакупка снарядов, золото |
| `currencies.autoEquipCredits` | `Int32` | Автозакупка оборудования/расходников, кредиты |
| `currencies.autoEquipGold` | `Int32` | Автозакупка оборудования/расходников, золото |
| `currencies.autoEquipCrystals` | `Int32` | Автозакупка оборудования/расходников, боны |
| `currencies.piggyBank` | `Int32` | Отчисление в копилку, кредиты |
| `comp7.ratingDelta` | `Int32` | Изменение рейтинга «Натиска» за бой |
| `comp7.rating` | `UInt16` | Рейтинг «Натиска» после боя |
| `comp7.qualBattleIndex` | `UInt8` | Номер квалификационного боя сезона |
| `comp7.qualActive` | `Bool` | Идёт ли квалификация |
| `comp7SkillTag` | `LowCardinality(String)` | Тег роли/навыка в «Натиске» |
| `equipment` | `Array(LowCardinality(String))` | Установленное оборудование (теги) |
| `consumables` | `Array(LowCardinality(String))` | Расходники (теги) |
| `battleBooster` | `LowCardinality(String)` | Боевой бустер (тег) |
| `crew` | `Array(Tuple(roles Array(LowCardinality(String)), level UInt8, skills Array(Tuple(tag LowCardinality(String), level UInt8))))` | Экипаж: роли, уровень танка экипажа, прокачанные перки (tag+level) |
| `shells.ARMOR_PIERCING` | `UInt16` | Кол-во бронебойных (ББ) снарядов в боекомплекте |
| `shells.HOLLOW_CHARGE` | `UInt16` | Кол-во кумулятивных (HEAT) снарядов в БК |
| `shells.ARMOR_PIERCING_FSDS` | `UInt16` | Кол-во подкалиберных оперённых (APFSDS) в БК |
| `shells.ARMOR_PIERCING_CR` | `UInt16` | Кол-во бронебойных подкалиберных (APCR, «голда») в БК |
| `shells.FLAME` | `UInt16` | Кол-во огнемётных снарядов в БК (спец-режимы) |
| `shells.HIGH_EXPLOSIVE` | `UInt16` | Кол-во осколочно-фугасных (ОФ) снарядов в БК |
| `isPremium` | `Bool` | Был ли активен премиум-аккаунт в этом бою |
| `mapsBlackList` | `Array(LowCardinality(String))` | Карты в чёрном списке игрока (исключены из подбора) |
| `personalMissionsRaw` | `String` | Личные боевые задачи — сырой ответ клиента |
| `personalMissions` | `Array(Tuple(tag LowCardinality(String), conditions Array(Tuple(tag String, state LowCardinality(String), value Nullable(UInt16), goal Nullable(UInt16), battles Array(Bool)))))` | Личные боевые задачи: прогресс по условиям (tag + conditions) |
| `systemInfo.*` | `Tuple(~30 полей)` | Железо/ОС игрока (cpu, gpu, ram, разрешение…). **RESTRICTED — не выводить наружу.** |
| `fortClanDBIDs` | `Array(UInt32)` | ID кланов в спринтах |

### `Event_OnShot`

Каждый выстрел игрока: полная баллистика, попадания, урон. Самая большая таблица БД (~3.7 млрд).

- **ORDER BY:** `battleMode, playerName, tankLevel, tankType, arenaTag, onBattleStartId, id, sipHash64(id)`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `onBattleStartId` | `UInt128` | Id события начала боя |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `shotId` | `UInt32` | Id выстрела из танков |
| `health` | `UInt32` | ХП игрока в момент выстрела |
| `arenaTag` | `LowCardinality(String)` | Название карты |
| `playerName` | `String` | Ник игрока |
| `playerClan` | `String` | Клан игрока |
| `playerClanDBID` | `UInt32` | ID клана |
| `accountDBID` | `UInt64` | ID аккаунта |
| `battleMode` | `LowCardinality(String)` | Тип боя |
| `battleGameplay` | `LowCardinality(String)` | Режим игры |
| `serverName` | `LowCardinality(String)` | Название сервера |
| `serverOnline` | `UInt32` | Онлайн на сервере |
| `regionOnline` | `UInt32` | Онлайн в регионе |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `team` | `UInt8` | Команда |
| `tankTag` | `LowCardinality(String)` | Название танка |
| `tankType` | `LowCardinality(String)` | Тип танка |
| `tankLevel` | `UInt8` | Уровень танка |
| `gunTag` | `LowCardinality(String)` | Тег орудия |
| `battleTime` | `Int32` | Время относительно начала боя в мс |
| `shellTag` | `LowCardinality(String)` | Тип снаряда |
| `shellName` | `LowCardinality(String)` | Название снаряда |
| `shellDamage` | `Decimal(9, 1)` | Средний урон снаряда |
| `damageRandomization` | `Decimal(9, 2)` | Разброс урона +-25% <=> 0.25 |
| `shellPiercingPower` | `Decimal(9, 2)` | Среднее пробитие снаряда |
| `shellCaliber` | `Float32` | Калибр снаряда |
| `shellSpeed` | `Decimal(9, 2)` | Скорость снаряда |
| `shellMaxDistance` | `UInt16` | Максимальная дистанция полета снаряда |
| `gunDispersion` | `Float32` | Актуальный разброс орудия на момент выстрела (например с учётом стана) |
| `battleDispersion` | `Float32` | Разброс орудия на момент старта боя |
| `serverShotDispersion` | `Float32` | Сведение орудия на момент выстрела по серверному прицелу |
| `clientShotDispersion` | `Float32` | Сведение орудия на момент выстрела по клиентскому прицелу |
| `old_ballisticResultServer_r` | `Float32` | Расстояние от серверного маркера до точки попадания |
| `old_ballisticResultServer_theta` | `Float32` | Угол между осью X и вектором от серверного маркера до точки попадания |
| `old_ballisticResultClient_r` | `Float32` | Расстояние от клиентского маркера до точки попадания |
| `old_ballisticResultClient_theta` | `Float32` | Угол между осью X и вектором от клиентского маркера до точки попадания |
| `gravity` | `Float32` | Гравитация |
| `acceleration_x` | `Float32` | Ускорение трассера по X |
| `acceleration_y` | `Float32` | Ускорение трассера по Y |
| `acceleration_z` | `Float32` | Ускорение трассера по Z |
| `serverAim` | `Bool` | Использовался ли серверный прицел |
| `autoAim` | `Bool` | Использовался ли автоприцел |
| `fps` | `UInt16` | ФПС |
| `hitVehicleDescr` | `Nullable(UInt32)` | Дескриптор танка, в который попал снаряд |
| `hitChassisDescr` | `Nullable(UInt32)` | Дескриптор шасси танка, в который попал снаряд |
| `hitTurretDescr` | `Nullable(UInt32)` | Дескриптор башни танка, в который попал снаряд |
| `hitGunDescr` | `Nullable(UInt32)` | Дескриптор орудия танка, в который попал снаряд |
| `hitTurretYaw` | `Nullable(Float32)` | Угол поворота башни танка, в который попал снаряд |
| `hitTurretPitch` | `Nullable(Float32)` | Угол наклона башни танка, в который попал снаряд |
| `vehicleDescr` | `UInt32` | Дескриптор своего танка |
| `chassisDescr` | `UInt32` | Дескриптор шасси своего танка |
| `turretDescr` | `UInt32` | Дескриптор башни своего танка |
| `gunDescr` | `UInt32` | Дескриптор орудия своего танка |
| `turretYaw` | `Float32` | Угол поворота башни своего танка |
| `turretPitch` | `Float32` | Угол наклона башни своего танка |
| `shellDescr` | `UInt32` | Дескриптор снаряда |
| `vehicleSpeed` | `Float32` | Скорость своего танка |
| `vehicleRotationSpeed` | `Float32` | Скорость поворота своего танка |
| `turretSpeed` | `Float32` | Скорость поворота башни своего танка |
| `gunPoint_x` | `Float32` | Координата X точки выстрела |
| `gunPoint_y` | `Float32` | Координата Y точки выстрела |
| `gunPoint_z` | `Float32` | Координата Z точки выстрела |
| `clientMarkerPoint_x` | `Float32` | Координата X клиентского маркера |
| `clientMarkerPoint_y` | `Float32` | Координата Y клиентского маркера |
| `clientMarkerPoint_z` | `Float32` | Координата Z клиентского маркера |
| `serverMarkerPoint_x` | `Float32` | Координата X серверного маркера |
| `serverMarkerPoint_y` | `Float32` | Координата Y серверного маркера |
| `serverMarkerPoint_z` | `Float32` | Координата Z серверного маркера |
| `tracerStart_x` | `Float32` | Координата X начала трассера |
| `tracerStart_y` | `Float32` | Координата Y начала трассера |
| `tracerStart_z` | `Float32` | Координата Z начала трассера |
| `tracerEnd_x` | `Float32` | Координата X конца трассера |
| `tracerEnd_y` | `Float32` | Координата Y конца трассера |
| `tracerEnd_z` | `Float32` | Координата Z конца трассера |
| `tracerVel_x` | `Float32` | Скорость трассера по X |
| `tracerVel_y` | `Float32` | Скорость трассера по Y |
| `tracerVel_z` | `Float32` | Скорость трассера по Z |
| `hitReason` | `Enum8('tank' = 1, 'terrain' = 2, 'other' = 3, 'none' = 4)` | Причина завершения полета снаряда |
| `hitPoint_x` | `Nullable(Float32)` | Координата X точки попадания |
| `hitPoint_y` | `Nullable(Float32)` | Координата Y точки попадания |
| `hitPoint_z` | `Nullable(Float32)` | Координата Z точки попадания |
| `results.order` | `Array(UInt16)` | Результаты выстрела по танкам. order - номер попадания, tankTag - тег танка, в который попал снаряд, shotDamage - урон от выстрела, fireDamage - урон от огня, shotHealth - здоровье танка после выстрела, fireHealth - здоровье танка после огня, ammoBayDestroyed - взрыв бк, flags - флаги попадания (из них можно понять например крит) |
| `results.tankTag` | `Array(LowCardinality(String))` | 〃 |
| `results.shotDamage` | `Array(UInt16)` | 〃 |
| `results.fireDamage` | `Array(UInt16)` | 〃 |
| `results.shotHealth` | `Array(Nullable(UInt16))` | 〃 |
| `results.fireHealth` | `Array(Nullable(UInt16))` | 〃 |
| `results.ammoBayDestroyed` | `Array(Bool)` | 〃 |
| `results.flags` | `Array(UInt32)` | Флаги результата выстрела. VEHICLE_HIT_FLAGS https://github.com/StranikS-Scan/WorldOfTanks-Decompiled/blob/a073ff6fab4bdb9a915560cb3c774e645ea9ed64/source/res/scripts/common/constants.py#L1309 |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `session.startTime` | `DateTime64(3)` | Дата начала сессии по локальному времени клиента |
| `session.startAgo` | `UInt32` | Время в секундах со старта сессии |
| `session.lastBattleAgo` | `UInt32` | Время в секундах со старта прошлого боя |
| `session.battleStarts` | `UInt32` | Число начатых за сессию боёв |
| `session.battleResults` | `UInt32` | Число результатов |
| `session.winCount` | `UInt32` | Число побед из результатов |
| `session.totalShots` | `UInt32` | Число выстрелов |
| `session.totalShotsDamaged` | `UInt32` | Число выстрелов с уроном |
| `session.totalShotsHit` | `UInt32` | Число попавших по танкам |
| `session.lastResult` | `Array(Enum8('win' = 1, 'lose' = 2, 'tie' = 3))` | Результаты за прошлые 10 боёв (победа/поражение/ничья) |
| `session.lastXpPlace` | `Array(UInt8)` | Место в команде по опыту за последние 10 результатов |
| `session.lastDmgPlace` | `Array(UInt8)` | Место в команде по урону за последние 10 результатов |
| `hitSegment` | `UInt128` | Битовая маска задетых бронедеталей/сегментов (0 — попадания в танк не было) |
| `ping` | `UInt16` | Пинг игрока на момент выстрела, мс |
| `serverMarkerDistance` | `UInt16` | Дистанция до серверной точки маркера прицела, м |
| `clientMarkerDistance` | `UInt16` | Дистанция до клиентской точки маркера прицела, м |
| `hitPointDistance` | `Float32` | Дистанция от орудия до точки попадания, м |
| `shotFragsCount` | `UInt8` | Уничтожено целей этим выстрелом (прямым уроном) |
| `firedCount` | `UInt8` | Число целей, подожжённых выстрелом |
| `firedFragsCount` | `UInt8` | Уничтожено целей пожаром от выстрела |
| `ammoBayDestroyedFragsCount` | `UInt8` | Уничтожено целей взрывом БК от выстрела |
| `tankRole` | `LowCardinality(String)` | Роль танка |
| `allyTeamHealth` | `UInt16` | ХП союзной команды |
| `enemyTeamHealth` | `UInt16` | ХП вражеской команды |
| `allyTeamMaxHealth` | `UInt16` | Максимальное ХП союзной команды |
| `enemyTeamMaxHealth` | `UInt16` | Максимальное ХП вражеской команды |
| `allyTeamFragsCount` | `UInt8` | Количество фрагов союзников |
| `enemyTeamFragsCount` | `UInt8` | Количество фрагов врагов |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `ballisticResultServer_r` | `Float32` | Расстояние от серверного маркера до точки попадания |
| `ballisticResultServer_theta` | `Float32` | Угол между осью X и вектором от серверного маркера до точки попадания |
| `ballisticResultClient_r` | `Float32` | Расстояние от клиентского маркера до точки попадания |
| `ballisticResultClient_theta` | `Float32` | Угол между осью X и вектором от клиентского маркера до точки попадания |
| `extra` | `JSON(`bob.allyBloggerId` UInt8, `bob.allySkill` LowCardinality(String), `bob.enemyBloggerId` UInt8, `bob.enemySkill` LowCardinality(String), `bob.personalLevel` UInt16, `bob.stats.1.rank` UInt8, `bob.stats.1.score` UInt32, `bob.stats.2.rank` UInt8, `bob.stats.2.score` UInt32, `bob.stats.3.rank` UInt8, `bob.stats.3.score` UInt32, `bob.stats.4.rank` UInt8, `bob.stats.4.score` UInt32)` | Дополнительная информация актуальная только во время определённых событий |
| `mapsBlackList` | `Array(LowCardinality(String))` | Карты в чёрном списке игрока (исключены из подбора) |
| `comp7SkillTag` | `LowCardinality(String)` | Тег роли/навыка в «Натиске» |
| `equipment` | `Array(LowCardinality(String))` | Установленное оборудование (теги) |
| `consumables` | `Array(LowCardinality(String))` | Расходники (теги) |
| `battleBooster` | `LowCardinality(String)` | Боевой бустер (тег) |
| `crew` | `Array(Tuple(roles Array(LowCardinality(String)), level UInt8, skills Array(Tuple(tag LowCardinality(String), level UInt8))))` | Экипаж: роли, уровень танка экипажа, прокачанные перки (tag+level) |
| `shells.ARMOR_PIERCING` | `UInt16` | Кол-во бронебойных (ББ) снарядов в боекомплекте |
| `shells.HOLLOW_CHARGE` | `UInt16` | Кол-во кумулятивных (HEAT) снарядов в БК |
| `shells.ARMOR_PIERCING_FSDS` | `UInt16` | Кол-во подкалиберных оперённых (APFSDS) в БК |
| `shells.ARMOR_PIERCING_CR` | `UInt16` | Кол-во бронебойных подкалиберных (APCR, «голда») в БК |
| `shells.FLAME` | `UInt16` | Кол-во огнемётных снарядов в БК (спец-режимы) |
| `shells.HIGH_EXPLOSIVE` | `UInt16` | Кол-во осколочно-фугасных (ОФ) снарядов в БК |
| `systemInfo.*` | `Tuple(~30 полей)` | Железо/ОС игрока (cpu, gpu, ram, разрешение…). **RESTRICTED — не выводить наружу.** |

### `Event_OnAccountStats`

Периодический снимок ресурсов аккаунта (валюты, премиум, копилка).

- **ORDER BY:** `region, playerName, id`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `playerName` | `String` | Ник игрока |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `credits` | `UInt64` | Баланс кредитов |
| `gold` | `UInt32` | Баланс золота |
| `crystal` | `UInt32` | Баланс кристаллов / бонов (crystal) |
| `equipCoin` | `UInt32` | Компоненты для экспериментального оборудования (equipCoin) |
| `bpCoin` | `UInt32` | Коины боевого пропуска (bpCoin) |
| `eventCoin` | `UInt32` | Монеты ивента — событийная валюта (eventCoin) |
| `freeXP` | `UInt32` | Свободный опыт |
| `isPremiumPlus` | `Bool` | Активен премиум-плюс |
| `premiumPlusExpiryTime` | `Nullable(DateTime)` | Дата истечения премиум-плюс |
| `isWotPlus` | `Bool` | Активна подписка WoT+ |
| `wotPlusTier` | `LowCardinality(String)` | Уровень подписки WoT+ |
| `wotPlusExpiryTime` | `Nullable(DateTime)` | Дата истечения WoT+ |
| `telecom` | `LowCardinality(String)` | Статус партнёрской telecom-подписки |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `piggyBankCredits` | `UInt32` | Кредиты в копилке |
| `piggyBankGold` | `UInt32` | Золото в копилке |

### `Event_OnComp7Info`

Снимок рейтинга «Натиска» (Comp7) игрока.

- **ORDER BY:** `region, playerName, id`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `playerName` | `String` | Ник игрока |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `season` | `LowCardinality(String)` | Идентификатор сезона «Натиска» |
| `rating` | `UInt16` | Рейтинг «Натиска» |
| `eliteRating` | `UInt16` | Элитный рейтинг (после достижения потолка обычного) |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `leaderboardPosition` | `Nullable(UInt32)` | Позиция в лидерборде (NULL — вне ранжируемого топа) |

### `Event_OnLootboxOpen`

Факт открытия коробок/контейнеров и что из них выпало.

- **ORDER BY:** `playerName, containerTag, openGroup, id, sipHash64(id)`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `playerName` | `String` | Ник игрока |
| `serverName` | `LowCardinality(String)` | Название сервера |
| `serverOnline` | `UInt32` | Онлайн на сервере |
| `regionOnline` | `UInt32` | Онлайн в регионе |
| `containerTag` | `LowCardinality(String)` | Тег контейнера |
| `openByTag` | `LowCardinality(String)` | Чем открыта коробка (тег ключа/валюты) |
| `isOpenSuccess` | `Bool` | Успешно ли прошло открытие |
| `openCount` | `UInt16` | Количество контейнеров в этом открытие |
| `openGroup` | `String` | Id открытия кейсов, если открывали например по 10 |
| `session.startTime` | `DateTime64(3)` | Дата начала сессии по локальному времени клиента |
| `session.startAgo` | `UInt32` | Время в секундах со старта сессии |
| `session.lastBattleAgo` | `UInt32` | Время в секундах со старта прошлого боя |
| `session.battleStarts` | `UInt32` | Число начатых за сессию боёв |
| `session.battleResults` | `UInt32` | Число результатов |
| `session.winCount` | `UInt32` | Число побед из результатов |
| `session.totalShots` | `UInt32` | Число выстрелов |
| `session.totalShotsDamaged` | `UInt32` | Число выстрелов с уроном |
| `session.totalShotsHit` | `UInt32` | Число попавших по танкам |
| `session.lastResult` | `Array(Enum8('win' = 1, 'lose' = 2, 'tie' = 3))` | Результаты за прошлые 10 боёв (победа/поражение/ничья) |
| `session.lastXpPlace` | `Array(UInt8)` | Место в команде по опыту за последние 10 результатов |
| `session.lastDmgPlace` | `Array(UInt8)` | Место в команде по урону за последние 10 результатов |
| `raw` | `JSON` | Сырые данные события |
| `credits` | `UInt32` | Кредиты |
| `gold` | `UInt32` | Золото |
| `freeXP` | `UInt32` | Свободный опыт |
| `crystal` | `UInt32` | Кристаллы |
| `eventCoin` | `UInt32` | Монеты ивента |
| `equipCoin` | `UInt32` | Компоненты для эксперементального оборудования |
| `bpcoin` | `UInt32` | БП коины |
| `currencies.tag` | `Array(String)` | Теги дополнительных валют |
| `currencies.amount` | `Array(UInt32)` | Количество дополнительных валют |
| `premium` | `UInt32` | Премиум |
| `premiumPlus` | `UInt32` | Премиум плюс |
| `premiumVip` | `UInt32` | Премиум вип |
| `addedVehicles` | `Array(String)` | Добавленные танки |
| `rentedVehicles.tag` | `Array(String)` | Теги арендных танков |
| `rentedVehicles.rentType` | `Array(String)` | Тип аренды |
| `rentedVehicles.rentValue` | `Array(UInt32)` | Время аренды |
| `slots` | `UInt32` | Слоты |
| `berths` | `UInt32` | Койки в казарме |
| `items.tag` | `Array(String)` | Теги предметов |
| `items.count` | `Array(UInt32)` | Количество предметов |
| `crewBooks.tag` | `Array(String)` | Теги книг экипажа |
| `crewBooks.count` | `Array(UInt32)` | Количество книг экипажа |
| `boosters.tag` | `Array(String)` | Теги бустеров |
| `boosters.time` | `Array(UInt32)` | Время действия бустеров |
| `boosters.value` | `Array(UInt32)` | Значение бустеров |
| `boosters.count` | `Array(UInt32)` | Количество бустеров |
| `discounts.tag` | `Array(String)` | Теги танков для которых скидка |
| `discounts.value` | `Array(UInt32)` | Значение скидок |
| `equip.tag` | `Array(String)` | Теги экипировки |
| `equip.count` | `Array(UInt32)` | Количество экипировки |
| `lootboxes.tag` | `Array(String)` | Теги контейнеров |
| `lootboxes.count` | `Array(UInt32)` | Количество контейнеров |
| `bonus.tag` | `Array(String)` | Теги бонусов Х3 и Х5 опытов |
| `bonus.count` | `Array(UInt32)` | Количество бонусов |
| `customizations.type` | `Array(String)` | Типы кастомизаций |
| `customizations.tag` | `Array(String)` | Теги кастомизаций |
| `customizations.count` | `Array(UInt32)` | Количество кастомизаций |
| `blueprints.type` | `Array(String)` | Типы чертежей |
| `blueprints.specification` | `Array(String)` | Спецификации чертежей (нация или танк) |
| `blueprints.count` | `Array(UInt32)` | Количество чертежей |
| `selectableCrewbook` | `Array(String)` | Выбираемая книга экипажа |
| `compensatedVehicles.tag` | `Array(String)` | Теги компенсированных танков |
| `compensatedVehicles.variant` | `Array(String)` | Варианты компенсированных танков |
| `compensatedVehicles.gold` | `Array(UInt32)` | Золото компенсированных танков |
| `rawString` | `String` | Сырые данные события в строке |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `claimed` | `Bool` | Было ли содержимое контейнера забрано пользователем. Или заменено на другое |
| `rerollCount` | `UInt8` | Количество замен |
| `extra.tag` | `Array(String)` | Теги дополнительных лутов, которые не попали в основные категории |
| `extra.count` | `Array(UInt32)` | Количество дополнительных лутов |
| `toys.tag` | `Array(String)` | Тег игрушки |
| `toys.count` | `Array(UInt32)` | Количество игрушек |
| `compensatedToys.tag` | `Array(String)` | Теги компенсированных игрушек |
| `compensatedToys.currency` | `Array(String)` | Валюта компенсации |
| `compensatedToys.count` | `Array(UInt32)` | Количество компенсации |
| `entitlements.tag` | `Array(String)` | Тег бонусных привилегий |
| `entitlements.count` | `Array(UInt32)` | Количество бонусных привилегий |

### `Event_OnMoeInfo`

Снимок отметок мастерства (MoE) игрока по конкретному танку.

- **ORDER BY:** `region, vehicleTag, id`
- **PARTITION BY:** `toYYYYMM(dateTime)`

| Колонка | Тип | Описание |
| --- | --- | --- |
| `id` | `UInt128` | Id события |
| `dateTime` | `DateTime64(3)` | Время события на сервере |
| `playerName` | `String` | Ник игрока |
| `region` | `LowCardinality(String)` | Регион |
| `gameVersion` | `LowCardinality(String)` | Версия игры |
| `modVersion` | `LowCardinality(String)` | Версия мода |
| `localeTime` | `DateTime64(3)` | Время события у клиента |
| `vehicleTag` | `LowCardinality(String)` | тег танка |
| `battleCount` | `UInt32` | число боев |
| `p0` | `UInt16` | Порог combined (урон+ассист) для 0-го перцентиля — минимум по танку |
| `p20` | `UInt16` | Порог combined для 20-го перцентиля |
| `p40` | `UInt16` | Порог combined для 40-го перцентиля |
| `p55` | `UInt16` | Порог combined для 55-го перцентиля |
| `p65` | `UInt16` | Порог 1-й отметки на стволе (65-й перцентиль) |
| `p75` | `UInt16` | Порог combined для 75-го перцентиля |
| `p85` | `UInt16` | Порог 2-й отметки (85-й перцентиль) |
| `p95` | `UInt16` | Порог 3-й отметки (95-й перцентиль) |
| `p100` | `UInt16` | Максимум combined по танку (100-й перцентиль) |
| `modVersion_parts` | `Array(String)` | Части версии мода major.minor.patch.revision-identifier |
| `modVersion_major` | `UInt16` | Часть версии мода MAJOR.minor.patch.revision-identifier |
| `modVersion_minor` | `UInt16` | Часть версии мода major.MINOR.patch.revision-identifier |
| `modVersion_patch` | `UInt16` | Часть версии мода major.minor.PATCH.revision-identifier |
| `modVersion_revision` | `UInt16` | Часть версии мода major.minor.patch.REVISION-identifier |
| `modVersion_identifier` | `String` | Часть версии мода major.minor.patch.revision-IDENTIFIER |
| `gameVersion_parts` | `Array(String)` | Части версии игры prefix_major.minor.patch_identifier |
| `gameVersion_prefix` | `UInt16` | Часть версии игры PREFIX_major.minor.patch_identifier |
| `gameVersion_major` | `UInt16` | Часть версии игры prefix_MAJOR.minor.patch_identifier |
| `gameVersion_minor` | `UInt16` | Часть версии игры prefix_major.MINOR.patch_identifier |
| `gameVersion_patch` | `UInt16` | Часть версии игры prefix_major.minor.PATCH_identifier |
| `gameVersion_identifier` | `UInt16` | Часть версии игры prefix_major.minor.patch_IDENTIFIER |
| `gameVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |
| `modVersionComparable` | `UInt32` | Версия игры которую можно сравнивать на больше меньше |

---

## Справочники (микросервис, cron)

### Общий «версионный» блок колонок

Справочники, выгружаемые из ресурсов игры (`Vehicles`, `Tanks`, `Arenas`, `Equipments`,
`OptionalDevices`, `Artefacts`, `Customizations`, `Lootboxes`, `Toys`, `GameVersions`), имеют общий
префикс колонок:

| Колонка | Тип | Описание |
| --- | --- | --- |
| `region` | `String` | Регион, для которого выгружено (`RU/EU/NA/ASIA/CN`) |
| `gameVersionFull` | `String` | Полная версия игры, напр. `1.27.0.0` |
| `gameVersion` | `String` | Короткая версия, напр. `1.27.0` |
| `gameVersionHash` | `String` | Хеш сборки версии |
| `gameVersionComp` | `String` | Версия в сравнимом виде (для сортировки/фильтра) |
| `datetime` | `DateTime` | Момент выгрузки справочника |
| `tag` | `String` | Уникальный тег сущности (танк/карта/предмет) |

`Xxx` — история по версиям (`ReplacingMergeTree`, ключ `region + gameVersionFull + tag`);
`XxxLatest` — актуальный срез последней версии. Ниже — только **отличительные** колонки каждой таблицы.

### Техника

**`Vehicles` / `VehiclesLatest`** — техника с ТТХ (десятки числовых полей: броня, ДПМ, обзор,
подвижность и пр.). Ключевые: `nation`, `level` (`UInt8`), `type` (полное имя, см. tankType выше),
`role`, `tag`, плюс боевые характеристики.

**`Tanks`** — компактный per-region каталог: `id` (`UInt16`), `nation`, `type`, `role`, `level`,
`userString` (имя), `shortUserString` (короткое имя).

**`TankList`** (`MergeTree`, глобальный, без версии) — плоский быстрый справочник:
`tag`, `type`, `level`, `nation`, `iconUrl`, `nameRU`, `shortNameRU`.

**`VehiclesLocalization`** — имена техники на 5 языках: `tag`, `nation`, `type`, `role`, `level`,
`nameRU/EU/NA/AS/CN` и короткие `shortRU/EU/NA/AS/CN`.

**`LatestBattleVehicleInfo`** (`ReplacingMergeTree`) — по каждой технике агрегат «сколько боёв реально
замечено»: `region`, `tag`, `role`, `type`, `nation`, `level`, `count` (`UInt64`), `updated`.
Полезно, чтобы понять, какие танки вообще встречаются в боях.

### Карты

**`Arenas` / `ArenasLatest`** — карты и режимы геймплея (ключ включает `gameplay`).
**`ArenasLocalization`** — имена карт: `tag`, `nameRU`, `nameEU`, `nameNA`, `nameAS`, `nameCN`.

### Предметы

**`Equipments` / `EquipmentsLatest`** — снаряжение/расходники: `id`, `tag`, `name`, `description`,
`icon`, `priceAmount`/`priceCurrency`, `tags`, фильтры совместимости с техникой
(`vehicleInclude*`/`vehicleExclude*`: уровни, нации, теги), `kpiSimple`/`kpiAggregate`.

**`OptionalDevices` / `OptionalDevicesLatest`** — дополнительное оборудование. Как `Equipments`
плюс `groupName`, `archetype`.

**`Artefacts`** — обобщённый справочник артефактов (`tag` → `name`).
**`Customizations`** — кастомизация (камуфляжи/эмблемы/надписи), `tag` → `name`.
**`Lootboxes`** / **`LootboxesLocalization`** — описания коробок (`tag` → `name`).
**`Toys`** — декор/«игрушки» событий (`tag` → `name`).

### Версии игры

**`GameVersions` / `GameVersionsLatest`** — версии клиента по регионам:
`region`, `gameVersionFull`, `gameVersion`, `gameVersionHash`, `gameVersionComp`, `datetime`,
`modsFolderName` (имя папки модов для этой версии).

---

## Справочники из игрового API (периодический опрос)

### «Натиск» — лидерборды

Снимки лидерборда «Натиска», тянутся из API с шагом.

**`Comp7Leaderboard`** / **`Comp7LeaderboardByRank`** (`ReplacingMergeTree`, ~114M):
`region`, `recalculationTime` (момент пересчёта), `name` (ник), `bdid` (id аккаунта), `clan`,
`clanColor`, `rank` (позиция), `rating`, `battlesCount`, `elite` (bool), `day`.
Первая отсортирована по игроку, вторая — по рангу (для выборок «топ-N»).

**`Comp7LeaderboardDaily`** / **`Comp7LeaderboardDailyByRank`** — дневные агрегаты:
`region`, `day`, `bdid`, `lastRecalculationTime`, `firstSnapshot`/`lastSnapshot`,
`minRank`/`maxRank`, `minRating`/`maxRating`, `minElite`/`maxElite`.

### Отметки и мастерство

**`MoeInfo` / `MoeInfoLatest`** (`ReplacingMergeTree`) — пороги отметок эффективности (MoE) по танкам:
`region`, `tag`, `updatedAt`, `dateTime`, и пороги `p0, p20, p40, p55, p65, p75, p85, p95, p100`
(значения урона+ассиста для соответствующего процента отметки).

**`MasteryInfo`** — пороги знаков классности/мастерства по танкам:
`region`, `tag`, `updatedAt`, `dateTime`, `p1`…`p100` (порог опыта для каждого перцентиля).

**`GameMoeInfo`** (`AggregatingMergeTree`) — временной ряд глобальных MoE:
`region`, `vehicleTag`, `dateTime`, `battleCount`, `p0`…`p100`.

### Онлайн и события

**`GameOnlineInfo`** (`AggregatingMergeTree`, ~60M) — онлайн по серверам во времени:
`dateTime`, `region`, `server`, `online`.

**`GoldWagonHistory`** — история ивента «Золотой вагон»: `region`, `dateTime`, `balance`.

**`ResourceWellHistory`** — история «Ресурсного источника»:
`region`, `channel`, `dateTime`, `remainingLots`, `givenLots`.

### Ники игроков

**`PlayerNames`** (`ReplacingMergeTree`, ~18M) — индекс ников (одна колонка `name`) для
автодополнения в поиске игрока. **`PlayerNamesByLength`** — то же с колонкой `len` в ключе
(поиск/сортировка по длине ника).

---

## Дедупликация результатов боёв — `DeduplicatedBattleResults`

Таблица с движком **`Null`** (данные не хранятся). Это **вход пайплайна общей статистики по всем игрокам** — важный узел, от которого зависят агрегирующие materialized views.

Как работает:

- В неё пишутся результаты боёв из `Event_OnBattleResult`, но **дедуплицированные по `arenaId`**: если в один бой попало несколько игроков с модом, у каждого пришёл бы свой `Event_OnBattleResult` с одинаковым `arenaId` — в `DeduplicatedBattleResults` попадает **только один результат на бой**.
- Движок `Null` саму строку отбрасывает, но **подключённые MV срабатывают на каждую вставку**. Сейчас это `SimpleTestAggByPlayerMV` → пишет в `SimpleTestAggByPlayer`.
- MV разворачивают массивы **`playersResults.*`** через `ARRAY JOIN` и агрегируют статистику **по всем игрокам боя** (а не только по носителям мода). Дедупликация по `arenaId` не даёт задваивать бой, если модников в нём было несколько.

Итог: так получается **общая статистика по всем игрокам** игры (из `playersResults.*`), собранная без двойного учёта боёв. Схема таблицы — срез `Event_OnBattleResult`: `arenaId`, `battleMode`/`battleGameplay`, `region`, командные показатели и полный набор `playersResults.*`.

---

## Производные таблицы и легаси

Считаются из `Event_*` под тяжёлые виджеты; выбор оптимального MV — через `bestMV` (`src/db/schema.ts`).

| Таблица(ы) | Назначение |
| --- | --- |
| `accuracy_hit_points`, `..._battle_mode`, `..._battle_mode_gameplay`, `..._battle_mode_gameplay_tankTag` | Семейство под аналитику точности/эллипса попаданий с разными наборами колонок-ключей |
| `ShotsPrepare` / `ShotsPrepare2` | Подготовленные агрегаты выстрелов для позиционных тепловых карт (ср. `Positions.Shots`) |
| `SimpleTestAggByPlayer` | Агрегат по игроку (масса avg/min/max метрик боя); наполняется через `DeduplicatedBattleResults` (см. раздел выше) |
| `DeduplicatedBattleResults` | `Null`-вход пайплайна дедупликации по `arenaId` → общая статистика по всем игрокам (см. раздел выше) |
| MV `Event_OnShot_health_damage_mv`, `Event_OnShot_safe_damage_count_by_base_mv`, `player_coverage_*`, `team_results_mv` | Материализованные представления под конкретные виджеты (+ скрытые `.inner.*`) |
| `PlayerNames`, `PlayerNamesByLength` | Индекс ников (поиск игрока) |
| `migrations`, `Test`, `named_tuples`, `description` (View), `Requests`, `Reports`, `PositionLicenseOld`, `PositionPromoCodesOld` | Служебные / легаси, не использовать |
