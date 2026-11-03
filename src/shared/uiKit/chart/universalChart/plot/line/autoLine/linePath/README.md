# LinePath

`LinePath.ts` строит SVG-пути и предоставляет геометрию для взаимодействия. Ломаная и monotone используют Zig/WASM; smooth строится в TS. Поиск ближайшей точки работает в WASM по округлённым координатам отрисованного пути без разбора SVG.

До загрузки WASM пути пустые. `AutoLine` и `AutoLineArea` запрашивают перерисовку после `linePathWasmReady()`. Ошибка загрузки выводится в консоль.

После изменения `linePath.zig` пересобери и сохрани `linePath.wasm`:

```bash
sh src/shared/uiKit/chart/universalChart/plot/line/autoLine/linePath/build.sh
```

Для сборки используется Zig 0.16. Буферы принадлежат экземпляру `LinePath`; `release()` освобождает WASM-память, `dispose()` также удаляет исходные точки.
