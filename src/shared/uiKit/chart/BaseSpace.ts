import { ChartSpace } from './Chart'

export class BaseSpace implements ChartSpace {
  private _top = 0
  private _left = 0
  private _width = 0
  private _height = 0
  private _topPadding = 0
  private _leftPadding = 0
  private _rightPadding = 0
  private _bottomPadding = 0

  constructor() { }

  setup(params: {
    top: number
    left: number
    width: number
    height: number
    paddingTop: number
    paddingLeft: number
    paddingRight: number
    paddingBottom: number
  }): void {
    this._top = params.top
    this._left = params.left
    this._width = params.width
    this._height = params.height
    this._topPadding = params.paddingTop
    this._leftPadding = params.paddingLeft
    this._rightPadding = params.paddingRight
    this._bottomPadding = params.paddingBottom
  }

  get top() { return this._top }
  get left() { return this._left }
  get width() { return this._width }
  get height() { return this._height }
  get topPadding() { return this._topPadding }
  get leftPadding() { return this._leftPadding }
  get rightPadding() { return this._rightPadding }
  get bottomPadding() { return this._bottomPadding }
  get contentWidth() { return this._width - this._leftPadding - this._rightPadding }
  get contentHeight() { return this._height - this._topPadding - this._bottomPadding }

  /**
   * Transforms a point from chart space (0-1) to SVG space
   * @param x 0-1 x coordinate in chart space (without paddings)
   * @param y 0-1 y coordinate in chart space (without paddings)
   */
  transform(x: number, y: number): { x: number, y: number } {
    const transformedX = this._left + this._leftPadding + x * this.contentWidth
    const transformedY = this._top + this._topPadding + y * this.contentHeight
    return { x: transformedX, y: transformedY }
  }
}