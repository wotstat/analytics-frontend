

type AtlasInfo = {
  info: {
    index: number
    defaultItemSize: {
      width: number
      height: number
    }
  }
  data: {
    image: string
    x: number
    y: number
    width?: number
    height?: number
  }[]
}

type SharedOptions = {
  classPrefix: string,
  atlasFormat?: 'webp' | 'png',
}

type RootOptions = {
  atlasRoot: string
} & SharedOptions

type LocalOptions = {
  atlasesInfo: AtlasInfo[]
  atlasesImages: {
    [key: string]: string
  }
} & SharedOptions

type Options = RootOptions | LocalOptions

export class SpriteAtlas {

  private atlasInfo = new Map<string, { x: number, y: number, width: number, height: number, atlasIndex: number }>()
  private atlases = new Map<number, string>()
  private styleTag: HTMLStyleElement | null = null

  constructor(private options: Options) {
    this.load()
  }

  private async getAtlasInfo() {
    if ('atlasRoot' in this.options) {
      const response = await fetch(`${this.options.atlasRoot}/atlases.json`)
      return await response.json() as AtlasInfo[]
    }

    return this.options.atlasesInfo
  }

  private getAtlasUrl(atlasIndex: number) {
    if ('atlasRoot' in this.options) {
      return `${this.options.atlasRoot}/atlas_${atlasIndex}.${this.options.atlasFormat ?? 'webp'}`
    }

    return this.options.atlasesImages?.[atlasIndex] ?? null
  }

  private async load() {
    const data = await this.getAtlasInfo()
    this.atlasInfo.clear()

    for (const atlas of data) {
      for (const element of atlas.data) {

        const defaultHeight = atlas.info.defaultItemSize.height
        const defaultWidth = atlas.info.defaultItemSize.width

        this.atlasInfo.set(element.image, {
          x: element.x,
          y: element.y,
          width: element.width ?? defaultWidth,
          height: element.height ?? defaultHeight,
          atlasIndex: atlas.info.index
        })
      }
    }

    const atlasIndexes = new Set(data.map(atlas => atlas.info.index))
    for (const index of atlasIndexes) {
      this.atlases.set(index, this.getAtlasUrl(index))
    }

    if (!document.querySelector(`[data-sprite-atlas="${this.options.classPrefix}"]`)) {
      this.styleTag = document.createElement('style')

      this.styleTag.setAttribute('data-sprite-atlas', this.options.classPrefix)

      this.styleTag.textContent = ''
      for (const index of atlasIndexes) this.styleTag.textContent += `
      .${this.options.classPrefix}-atlas-${index} {
        background-image: url('${this.atlases.get(index)}');
      }`

      document.head.appendChild(this.styleTag)
    } else {
      console.warn(`Sprite atlas for class "${this.options.classPrefix}" is already loaded.`)
    }
  }

  public getSprite(key: string) {
    if (!this.atlasInfo.has(key)) return null

    const info = this.atlasInfo.get(key)!
    return {
      x: info.x,
      y: info.y,
      width: info.width,
      height: info.height,
      atlasUrl: this.getAtlasUrl(info.atlasIndex),
      atlasIndex: info.atlasIndex,
      atlasClass: `${this.options.classPrefix}-atlas-${info.atlasIndex}`,
      backgroundPosition: `${-info.x}px ${-info.y}px`
    }
  }

  public getAtlases() {
    return this.atlases
  }

  public dispose() {
    this.atlasInfo.clear()
    this.atlases.clear()
    if (this.styleTag) {
      this.styleTag.remove()
      this.styleTag = null
    }
  }
}