import { LineController, PointElement } from 'chart.js'
import { createTypedChart } from 'vue-chartjs';

export class ShadowLineController extends LineController {
  draw() {
    // super.draw()
    const ctx = this.chart.ctx;
    ctx.save();

    const meta = this.getMeta();

    const drawCenterLine = () => {
      if (this.chart.config.options?.plugins && 'centerLine' in this.chart.config.options?.plugins && this.chart.config.options?.plugins.centerLine !== false) {

        const height = this.chart.chartArea.height;
        let left = this.chart.chartArea.left + this.chart.chartArea.width / 2 - 0.5;

        if (typeof this.chart.config.options?.plugins.centerLine === 'number') {
          const points = meta.data as PointElement[]

          const targetPoint = points[this.chart.config.options?.plugins.centerLine];
          if (!targetPoint) return

          left = targetPoint.x - 0.5;
        }

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(left, 0);
        ctx.lineTo(left, height + 50);

        ctx.strokeStyle = '#5d5d5d';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }
    }

    drawCenterLine()


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