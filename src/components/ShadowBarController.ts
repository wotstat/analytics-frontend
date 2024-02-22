import { BarController, BarElement } from 'chart.js'
import { createTypedChart } from 'vue-chartjs';

class ShadowBarController extends BarController {
  draw() {
    const ctx = this.chart.ctx;
    ctx.save();
    // super.draw()

    const meta = this.getMeta();

    if (this.chart.config.options?.plugins && 'centerLine' in this.chart.config.options?.plugins && this.chart.config.options?.plugins.centerLine)
      if (meta.xScale && meta.yScale) {
        const height = meta.yScale.height;
        const width = meta.xScale.width - meta.xScale.paddingRight;
        const left = Math.round(meta.xScale.paddingLeft + width / 2)

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(left, 0);
        ctx.lineTo(left, height);

        ctx.strokeStyle = '#5d5d5d';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

    for (const barElement of meta.data as BarElement[]) {

      ctx.shadowColor = barElement.options.borderColor.toString();
      ctx.strokeStyle = barElement.options.borderColor.toString();
      ctx.lineWidth = 2;

      const { x, y, width, base } = barElement.getProps(['x', 'y', 'base', 'height', 'width']);

      const offset = Math.min(10, width / 2);
      ctx.shadowBlur = width

      ctx.beginPath();
      ctx.moveTo(x - width / 2 + offset, y + base);
      ctx.lineTo(x - width / 2 + offset, y + offset);
      ctx.lineTo(x + width / 2 - offset, y + offset);
      ctx.lineTo(x + width / 2 - offset, y + base);
      ctx.stroke();

      ctx.fillStyle = barElement.options.backgroundColor.toString();
      ctx.fillRect(x - width / 2, y, width, base);
    }

    ctx.restore();

  }
}

ShadowBarController.id = 'ShadowBar';
ShadowBarController.defaults = BarController.defaults;

// @ts-ignore
export const ShadowBar = createTypedChart('ShadowBar', ShadowBarController)