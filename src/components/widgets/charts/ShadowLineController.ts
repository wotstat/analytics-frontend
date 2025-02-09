import { LineController } from 'chart.js'
import { createTypedChart } from 'vue-chartjs';

export class ShadowLineController extends LineController {
  draw() {
    // super.draw()
    const ctx = this.chart.ctx;
    ctx.save();

    const meta = this.getMeta();
    ctx.beginPath();

    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (const point of meta.data) {
      if ('skip' in point && point.skip) {
        ctx.stroke();
        ctx.beginPath();
        continue;
      }

      const { x, y } = point.getProps(['x', 'y']);
      if (Number.isNaN(x)) continue
      if (Number.isNaN(y)) continue

      ctx.lineTo(x, y);

      ctx.shadowColor = point.options.borderColor;
      ctx.strokeStyle = point.options.backgroundColor;
    }

    ctx.stroke();

    ctx.restore();
  }
}

ShadowLineController.id = 'ShadowLine';
ShadowLineController.defaults = LineController.defaults;

// @ts-ignore
export const ShadowLine = createTypedChart('ShadowLine', ShadowLineController)

export function setup() {
  return ShadowLine
}