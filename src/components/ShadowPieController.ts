import { ArcElement, PieController } from 'chart.js'
import { createTypedChart } from 'vue-chartjs';

class ShadowPieController extends PieController {
  draw() {
    // super.draw()
    const ctx = this.chart.ctx;
    ctx.save();

    const meta = this.getMeta();

    const offset = 5
    ctx.strokeStyle = 'white'

    ctx.shadowBlur = 50;
    for (const arcElement of meta.data as ArcElement[]) {
      const { x, y, endAngle, startAngle, outerRadius } = arcElement.getProps(['x', 'y', 'endAngle', 'startAngle', 'outerRadius']);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, outerRadius - offset, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = arcElement.options.backgroundColor.toString();
      ctx.shadowColor = arcElement.options.borderColor.toString();
      ctx.fill();
    }

    ctx.shadowBlur = 0
    for (const arcElement of meta.data as ArcElement[]) {
      const { x, y, endAngle, startAngle, outerRadius } = arcElement.getProps(['x', 'y', 'endAngle', 'startAngle', 'outerRadius']);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, outerRadius - offset, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = arcElement.options.backgroundColor.toString();
      ctx.fill();
    }

    ctx.restore();
  }
}

ShadowPieController.id = 'ShadowPie';
ShadowPieController.defaults = PieController.defaults;

// @ts-ignore
export const ShadowPie = createTypedChart<'pie'>('ShadowPie', ShadowPieController)