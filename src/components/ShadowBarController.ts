import { BarController, BarElement } from 'chart.js'
import { createTypedChart } from 'vue-chartjs';

class ShadowBarController extends BarController {
  draw() {
    // super.draw()
    const ctx = this.chart.ctx;
    ctx.save();

    const meta = this.getMeta();

    // console.log(meta.data);

    ctx.shadowBlur = 30;
    for (const barElement of meta.data as BarElement[]) {

      ctx.shadowColor = barElement.options.borderColor.toString();
      ctx.strokeStyle = barElement.options.borderColor.toString();
      ctx.lineWidth = 2;

      const offset = 10

      const { x, y, height, width } = barElement.getProps(['x', 'y', 'base', 'height', 'width']);
      ctx.beginPath();
      ctx.moveTo(x - width / 2 + offset, y + height);
      ctx.lineTo(x - width / 2 + offset, y + offset);
      ctx.lineTo(x + width / 2 - offset, y + offset);
      ctx.lineTo(x + width / 2 - offset, y + height);
      ctx.stroke();

      ctx.fillStyle = barElement.options.backgroundColor.toString();
      ctx.fillRect(x - width / 2, y, width, height);
    }

    ctx.restore();

  }
}

ShadowBarController.id = 'ShadowBar';
ShadowBarController.defaults = BarController.defaults;

// @ts-ignore
export const ShadowBar = createTypedChart('ShadowBar', ShadowBarController)