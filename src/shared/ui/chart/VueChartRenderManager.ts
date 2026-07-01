import { ChartRenderManager } from '@/shared/uiKit/chart/ChartRenderManager'
import { nextTick } from 'vue'


export class VueChartRenderManager extends ChartRenderManager {

  protected requestMicroTask() {
    if (this.microTaskHandle) return
    this.microTaskHandle = 1
    nextTick(() => {
      this.microTaskHandle = null
      this.microTask()
    })
  }
}

export const globalChartRenderManager = new VueChartRenderManager(3)