<template>
  <div class="modal-content">
    <div class="section" v-for="group in filtered">
      <h2 class="header">{{ group.header }}</h2>
      <div class="arenas">
        <div class="arena" v-for="arena in group.data" :key="arena.tag" :tag="arena.tag">
          <MinimapBackground :tag="arena.imageName" :game="game" :gameplay="group.gameplay"
            class="minimap-background" />
          <MinimapBases :arenaTag="arena.tag" class="minimap-bases" :gameplay="group.gameplay" />
          <div class="name mt-font">
            <HighlightString :text="arena.highlighted.highlightedString" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { tagToImageName } from '@/shared/game/arenas2/arenas'
import MinimapBackground from '@/shared/game/arenas2/minimap/MinimapBackground.vue'
import MinimapBases from '@/shared/game/arenas2/minimap/minimapBases/MinimapBases.vue'
import { GameVendor } from '@/shared/game/wot'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { compareIntervals, Highlighted } from '@/shared/uiKit/highlightString/highlightUtils'
import { computed } from 'vue'


const props = defineProps<{
  game: GameVendor
  arenas: { region: string, battleMode: string, battleGameplay: string, tag: string, name: string }[]
  search: string
}>()

const prepared = computed(() => props.arenas.map(arena => ({
  ...arena,
  imageName: tagToImageName(arena.tag),
  highlighted: new Highlighted(arena.name)
})))

const groups = computed(() => {

  type Arena = typeof prepared.value[number]

  const cft: Arena[] = []
  const ctf30x30: Arena[] = []
  const domination: Arena[] = []
  const assault: Arena[] = []
  const battleRoyale: Arena[] = []
  const comp7: Arena[] = []
  const epic: Arena[] = []

  for (const arena of prepared.value) {
    if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'ctf') cft.push(arena)
    else if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'domination') domination.push(arena)
    else if (arena.battleMode === 'REGULAR' && arena.battleGameplay === 'assault') assault.push(arena)
    else if (arena.battleMode === 'EPIC_RANDOM' && arena.battleGameplay === 'ctf30x30') ctf30x30.push(arena)
    else if (arena.battleMode === 'BATTLE_ROYALE_SOLO') battleRoyale.push(arena)
    else if (arena.battleMode === 'COMP7') comp7.push(arena)
    else if (arena.battleGameplay === 'epic') epic.push(arena)
  }

  return [
    { header: 'Стандартный бой', items: cft },
    { header: 'Штурм', gameplay: 'assault', items: assault },
    { header: 'Встречный бой', gameplay: 'domination', items: domination },
    { header: 'Генеральное сражение', gameplay: 'ctf30x30', items: ctf30x30 },
    { header: 'Линия Фронта', gameplay: 'epic', items: epic },
    { header: 'Стальной Охотник', items: battleRoyale },
    { header: 'Натиск', gameplay: 'comp7', items: comp7 }
  ]
})

const filtered = computed(() => {

  const search = props.search.trim().toLowerCase()
  const targetRegion = props.game == 'mt' ? 'RU' : 'EU'

  const filteredGroups = groups.value.map(arenas => {

    const data = arenas.items

    const prefiltered = data.filter(t => t.region == targetRegion)

    for (const arena of prefiltered) {
      arena.highlighted.setSubstring(search)
    }

    const filtered = prefiltered.filter(arena => !search || arena.highlighted.intervals.length > 0)

    function sorted() {
      if (search) return filtered.sort((a, b) => {
        const comp = compareIntervals(a.highlighted.intervals, b.highlighted.intervals)
        if (comp !== 0) return comp
        return a.highlighted.text.localeCompare(b.highlighted.text)
      })

      return filtered.sort((a, b) => a.highlighted.text.localeCompare(b.highlighted.text))
    }

    return {
      header: arenas.header,
      gameplay: arenas.gameplay,
      data: sorted()
    }
  })

  return filteredGroups.filter(g => g.data.length > 0)
})

</script>


<style lang="scss" scoped>
h2 {
  margin: 10px 0;
  font-size: 1em;
}

.section {
  &:not(:first-child) {
    margin-top: 50px;
  }
}

.arenas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;


  .arena {
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
    aspect-ratio: 1 / 1;
    cursor: pointer;

    .minimap-background,
    .minimap-bases {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .name {
      user-select: none;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 15px;
      color: rgb(255, 252, 241);
      padding-bottom: 6px;
      padding-top: 20px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 20%, rgba(0, 0, 0, 0));

      :deep(.highlight) {
        color: var(--blue-thin-color-hover);
      }
    }
  }
}
</style>