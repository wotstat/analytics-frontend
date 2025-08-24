import { divWithClass } from './utils'


export class Section {
  readonly root: HTMLElement
  readonly headerContainer: HTMLElement
  readonly footerContainer: HTMLElement
  readonly contentContainer: HTMLElement

  readonly headerBackground: HTMLElement
  readonly footerBackground: HTMLElement

  index: number | null = null

  static readonly reusableKey = Symbol()

  constructor() {
    this.root = divWithClass('section')
    this.headerContainer = divWithClass('header-container', this.root)
    this.footerContainer = divWithClass('footer-container', this.root)
    this.contentContainer = divWithClass('content-container', this.root)
    this.root.appendChild(this.contentContainer)

    const stickyBackgroundFixer = divWithClass('sticky-background-fixer', this.root)
    this.headerBackground = divWithClass('header-background', stickyBackgroundFixer)
    this.footerBackground = divWithClass('footer-background', stickyBackgroundFixer)
  }

  setup(index: number,
    headerHeight: number,
    footerHeight: number,
    firstElementHeight: number,
    lastElementHeight: number,
    contentHeight: number) {
    const totalHeight = headerHeight + footerHeight + contentHeight

    this.root.style.height = `${totalHeight}px`
    this.root.style.paddingTop = `${headerHeight}px`

    this.headerContainer.style.height = `${totalHeight - footerHeight - firstElementHeight}px`
    this.footerContainer.style.height = `${totalHeight - headerHeight - lastElementHeight}px`

    this.headerBackground.style.height = `${headerHeight}px`
    this.footerBackground.style.height = `${footerHeight}px`

    if (this.index !== index) {
      this.index = index
      this.root.className = `section section-${index}`
    }
  }
}
