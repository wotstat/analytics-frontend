import { numberToRoman } from '@/utils'
import { getHighlightedTextParts, Highlighted, HighlightedString } from '../highlightString/highlightUtils'
import { vehicleTypeToImage } from '../vehicles/type/vehicleTypeToImage'
import { smallVehiclesAtlasMt, smallVehiclesAtlasWot, tagToImageName } from '../vehicles/vehicle/utils'

import { Ref, watch } from 'vue'
import { nationFlagAtlas } from '../vehicles/nation/utils'
import { TableCell } from '../tableView/tableView/TableView'

const vehicleTypes = ['MT', 'LT', 'HT', 'AT', 'SPG'] as const
export type VehicleLineData = {
  tag: string;
  level: number;
  nation: string;
  type: typeof vehicleTypes[number];
  shortName: string;
  name: string;
  highlighted: Highlighted;
}

const romanNumerals: Record<number, string> = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => [num, numberToRoman(num).toString()])
)

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


const vehicleAtlas = {
  'mt': smallVehiclesAtlasMt,
  'wot': smallVehiclesAtlasWot
} as const

export class VehicleLine implements TableCell {

  static readonly reusableKey = Symbol('VehicleLine')

  readonly root: HTMLElement

  private readonly flag: HTMLElement
  private readonly type: HTMLElement
  private readonly level: HTMLParagraphElement
  private readonly tank: HTMLElement
  private readonly name: HTMLParagraphElement
  private readonly highlightedName: HTMLParagraphElement

  private readonly typeElements = new Map<string, Node>()

  private currentTag: string | null = null
  private currentVehicleClass: string | null = null
  private currentFlagClass: string | null = null
  private unwatch: (() => void)

  constructor(private onClick: (tag: string) => void, private selected: Ref<Set<string>>) {

    this.root = document.createElement('div')
    this.root.classList.add('line')

    this.flag = document.createElement('div')
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

  private setClass(element: HTMLElement, oldClass: string | null, className: string | null): string | null {
    if (oldClass == className) return className
    if (oldClass) element.classList.remove(oldClass)
    if (className) element.classList.add(className)
    return className
  }

  private setVehicleImage(tag: string, game: 'mt' | 'wot'): void {
    const smallVehicle = vehicleAtlas[game].getSprite(tagToImageName(tag)) ?? vehicleAtlas[game].getSprite('no-image')
    if (!smallVehicle) return

    this.tank.style.backgroundPosition = smallVehicle.backgroundPosition
    this.currentVehicleClass = this.setClass(this.tank, this.currentVehicleClass, smallVehicle.atlasClass)
  }

  private setFlagImage(nation: string): void {
    const nationFlag = nationFlagAtlas.getSprite(nation) ?? nationFlagAtlas.getSprite('no-image')
    if (!nationFlag) return

    this.flag.style.backgroundPosition = `${-nationFlag.x / 2}px ${-nationFlag.y / 2}px`
    this.currentFlagClass = this.setClass(this.flag, this.currentFlagClass, nationFlag.atlasClass)
  }

  configure(data: VehicleLineData, game: 'mt' | 'wot'): void {
    this.currentTag = data.tag
    this.name.textContent = data.highlighted.text

    this.level.textContent = romanNumerals[data.level] || data.level.toString()
    this.setFlagImage(data.nation)

    const currentTypeElement = this.type.firstChild
    const targetTypeElement = this.getTypeElement(data.type)

    if (currentTypeElement !== targetTypeElement) {
      if (currentTypeElement !== null) this.type.replaceChild(targetTypeElement, currentTypeElement)
      else this.type.appendChild(targetTypeElement)
    }

    this.setHighlightedVisible(data.highlighted.intervals.length > 0)
    if (data.highlighted.intervals.length > 0) {
      const parts = getHighlightedTextParts(data.highlighted.highlightedString)
      this.highlightedName.innerHTML = parts.map(part => {
        if (part.highlight) {
          return `<span class="highlight">${part.text}</span>`
        }
        return part.text
      }).join('')
    }

    this.setVehicleImage(data.tag, game)
    this.updateSelectedState()

    this.root.setAttribute('data-tag', data.tag)
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