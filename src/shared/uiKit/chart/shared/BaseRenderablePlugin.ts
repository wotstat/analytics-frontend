import { ChartDelegate, ChartPlugin } from '../Chart'
import { BaseSpace } from './BaseSpace'


export class BaseRenderablePlugin extends BaseSpace implements ChartPlugin {
  protected chartDelegate: ChartDelegate | null = null

  public apply(delegate: ChartDelegate): void {
    this.chartDelegate = delegate
  }
}