import { numberToRoman } from '@/utils'
import { getHighlightedTextParts, HighlightedString } from '../highlightString/highlightUtils'
import { ReusableTableCellBase } from '../reusableTable/ReusableTableCell'
import { vehicleTypeToImage } from '../vehicles/type/vehicleTypeToImage'
import { tagToImageName, vehicleFallbackUrl, vehicleUrl } from '../vehicles/vehicle/utils'

import Atlases from './assets/atlases.json'
import { Ref, watch } from 'vue'

const vehicleTypes = ['MT', 'LT', 'HT', 'AT', 'SPG'] as const
export type VehicleLineData = {
  tag: string;
  level: number;
  nation: string;
  type: typeof vehicleTypes[number];
  short: string;
  highlightStrings: HighlightedString;
}

const romanNumerals: Record<number, string> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => [num, numberToRoman(num).toString()])
)

const nationFlags = import.meta.glob<{ default: string }>('/src/components/vehicles/nation/60x40/*.png', { eager: true })


const typeIconElements = new Map<string, Node>()
function getTypeElement(type: VehicleLineData['type']): Node {
  if (typeIconElements.has(type)) return typeIconElements.get(type)!

  const element = document.createElement('template')
  const img = vehicleTypeToImage(type, 'raw')
  element.innerHTML = img || ''
  const target = element.content.firstChild as Node
  typeIconElements.set(type, target)
  return target
}
for (const element of vehicleTypes) getTypeElement(element)


const atlasMap = new Map<string, { atlas: number, x: number, y: number }>(Atlases.flatMap(atlas => atlas.data.map((item) => {
  return [item.image, { atlas: atlas.info.index, x: item.x, y: item.y }]
})))

export class VehicleLine extends ReusableTableCellBase<VehicleLineData> {
  readonly root: HTMLElement

  private readonly flag: HTMLImageElement
  private readonly type: HTMLElement
  private readonly level: HTMLParagraphElement
  private readonly tank: HTMLElement
  private readonly name: HTMLParagraphElement
  private readonly highlightedName: HTMLParagraphElement

  private readonly typeElements = new Map<string, Node>()

  private currentTag: string | null = null
  private unwatch: (() => void)

  constructor(private onClick: (tag: string) => void, private selected: Ref<Set<string>>) {
    super()
    this.root = document.createElement('div')
    this.root.classList.add('line')

    this.flag = document.createElement('img')
    this.flag.classList.add('flag')
    this.root.appendChild(this.flag)

    this.type = document.createElement('div')
    this.type.classList.add('type')
    this.root.appendChild(this.type)

    this.level = document.createElement('p')
    this.level.classList.add('level', 'mt-font')
    this.root.appendChild(this.level)

    const nameLine = document.createElement('div')
    nameLine.classList.add('name')
    this.root.appendChild(nameLine)

    this.tank = document.createElement('div')
    this.tank.classList.add('tank')
    nameLine.appendChild(this.tank)

    this.name = document.createElement('p')
    this.name.classList.add('name-text')
    nameLine.appendChild(this.name)

    this.highlightedName = document.createElement('p')
    this.highlightedName.classList.add('highlighted-name-text')
    nameLine.appendChild(this.highlightedName)

    this.root.addEventListener('click', this.onClickListener)

    this.unwatch = watch(() => selected.value, () => this.updateSelectedState(), { immediate: true, deep: true })
  }

  private highlightedVisible: boolean | null = null
  private setHighlightedVisible(visible: boolean): void {
    if (this.highlightedVisible === visible) return
    this.highlightedVisible = visible
    this.name.style.display = visible ? 'none' : ''
    this.highlightedName.style.display = visible ? '' : 'none'
  }

  private getAtlasPosition(tag: string) {
    if (!atlasMap.has(tagToImageName(tag))) console.warn(`No atlas entry for tag: ${tag}`)
    const sprite = atlasMap.get(tagToImageName(tag)) ?? atlasMap.get('no-image')
    if (!sprite) return { x: 0, y: 0, index: 0 }
    return { x: sprite.x, y: sprite.y, index: sprite.atlas }
  }

  configure(data: VehicleLineData): void {
    this.currentTag = data.tag
    // this.name.textContent = tagToImageName(data.tag)
    this.name.textContent = data.highlightStrings.text

    this.level.textContent = romanNumerals[data.level] || data.level.toString()
    this.flag.src = nationFlags[`/src/components/vehicles/nation/60x40/${data.nation}.png`]?.default || ''

    const currentTypeElement = this.type.firstChild
    const targetTypeElement = this.getTypeElement(data.type)

    if (currentTypeElement !== targetTypeElement) {
      if (currentTypeElement !== null) this.type.replaceChild(targetTypeElement, currentTypeElement)
      else this.type.appendChild(targetTypeElement)
    }

    this.setHighlightedVisible(data.highlightStrings.highlight.length > 0)
    if (data.highlightStrings.highlight.length > 0) {
      const parts = getHighlightedTextParts(data.highlightStrings)
      this.highlightedName.innerHTML = parts.map(part => {
        if (part.highlight) {
          return `<span class="highlight">${part.text}</span>`
        }
        return part.text
      }).join('')
    }

    const sprite = this.getAtlasPosition(data.tag)
    this.tank.style.backgroundPosition = `${-(sprite?.x || 0)}px ${-(sprite?.y || 0)}px`

    const targetAtlas = `atlas-${sprite?.index || 0}`
    if (!this.tank.classList.contains(targetAtlas)) {
      this.tank.classList.remove(...[...this.tank.classList].filter(c => c.startsWith('atlas-')))
      this.tank.classList.add(targetAtlas)
    }

    this.updateSelectedState()
  }

  private getTypeElement(type: VehicleLineData['type']): Node {
    if (this.typeElements.has(type)) return this.typeElements.get(type)!

    const element = getTypeElement(type).cloneNode(true)
    this.typeElements.set(type, element)
    return element
  }

  private onClickListener = () => {
    if (this.currentTag) {
      this.onClick(this.currentTag)
    }
  }

  private updateSelectedState(): void {
    if (this.currentTag) {
      const isSelected = this.selected.value.has(this.currentTag)
      this.root.classList.toggle('selected', isSelected)
    }
  }

  dispose(): void {
    this.root.removeEventListener('click', this.onClickListener)
    this.currentTag = null
    this.typeElements.clear()
    this.highlightedVisible = null
    this.unwatch()
  }
}