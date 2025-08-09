
import Spline from 'typescript-cubic-spline'

const Y = [-1.0, -0.9797979798, -0.9595959596, -0.9393939394, -0.9191919192, -0.898989899, -0.8787878788, -0.8585858586, -0.8383838384, -0.8181818182, -0.797979798, -0.7777777778, -0.7575757576, -0.7373737374, -0.7171717172, -0.696969697, -0.6767676768, -0.6565656566, -0.6363636364, -0.6161616162, -0.595959596, -0.5757575758, -0.5555555556, -0.5353535354, -0.5151515152, -0.4949494949, -0.4747474747, -0.4545454545, -0.4343434343, -0.4141414141, -0.3939393939, -0.3737373737, -0.3535353535, -0.3333333333, -0.3131313131, -0.2929292929, -0.2727272727, -0.2525252525, -0.2323232323, -0.2121212121, -0.1919191919, -0.1717171717, -0.1515151515, -0.1313131313, -0.1111111111, -0.09090909091, -0.07070707071, -0.05050505051, -0.0303030303, -0.0101010101, 0.0101010101, 0.0303030303, 0.05050505051, 0.07070707071, 0.09090909091, 0.1111111111, 0.1313131313, 0.1515151515, 0.1717171717, 0.1919191919, 0.2121212121, 0.2323232323, 0.2525252525, 0.2727272727, 0.2929292929, 0.3131313131, 0.3333333333, 0.3535353535, 0.3737373737, 0.3939393939, 0.4141414141, 0.4343434343, 0.4545454545, 0.4747474747, 0.4949494949, 0.5151515152, 0.5353535354, 0.5555555556, 0.5757575758, 0.595959596, 0.6161616162, 0.6363636364, 0.6565656566, 0.6767676768, 0.696969697, 0.7171717172, 0.7373737374, 0.7575757576, 0.7777777778, 0.797979798, 0.8181818182, 0.8383838384, 0.8585858586, 0.8787878788, 0.898989899, 0.9191919192, 0.9393939394, 0.9595959596, 0.9797979798, 1.0]
const X = [0, 0.000312126961, 0.0006847139254, 0.001127840159, 0.001652926473, 0.002272848931, 0.003002050296, 0.003856646598, 0.004854525817, 0.006015435359, 0.007361054685, 0.008915049208, 0.01070310137, 0.01275291473, 0.01509418681, 0.0177585467, 0.02077945345, 0.02419205187, 0.02803298269, 0.03234014481, 0.03715240814, 0.04250927661, 0.04845050183, 0.05501564923, 0.06224361987, 0.07017213231, 0.07883717043, 0.08827240445, 0.09850859374, 0.1095729811, 0.1214886897, 0.1342741334, 0.1479424544, 0.1625009993, 0.1779508469, 0.1942864009, 0.2114950574, 0.2295569601, 0.248444851, 0.2681240249, 0.288552394, 0.3096806652, 0.331452632, 0.3538055794, 0.3766707983, 0.3999742022, 0.4236370384, 0.4475766811, 0.4717074947, 0.4959417512, 0.5201905856, 0.5443649725, 0.5683767053, 0.5921393608, 0.6155692305, 0.6385862035, 0.6611145842, 0.6830838315, 0.7044292078, 0.7250923271, 0.7450215969, 0.7641725469, 0.7825080442, 0.7999983939, 0.8166213299, 0.8323618979, 0.8472122416, 0.8611712973, 0.8742444102, 0.8864428816, 0.8977834612, 0.9082877952, 0.9179818445, 0.9268952848, 0.9350609004, 0.942513983, 0.9492917459, 0.9554327621, 0.9609764343, 0.9659625033, 0.9704305989, 0.9744198378, 0.9779684709, 0.9811135788, 0.9838908191, 0.9863342204, 0.9884760236, 0.9903465669, 0.9919742109, 0.9933853001, 0.9946041577, 0.9956531079, 0.9965525232, 0.9973208909, 0.9979748962, 0.9985295181, 0.9989981329, 0.9993926253, 0.9997235008, 1.0]

const spline = new Spline(X, Y)

let shouldCancel = false

self.onmessage = e => {
  if (e.data == 'cancel') {
    console.log('[Worker] Trying to cancel calculation')
    shouldCancel = true
  }
  else {
    console.log('[Worker] Calculation started')
    calculate(e.data.damage, e.data.shotCount, e.data.intervals, e.data.experimentsCount, e.data.key)
  }
}

self.postMessage({ progress: 0, result: null })

function finish() {
  self.postMessage('end')
  console.log('[Worker] Canceled calculation')
}

async function calculate(damage: number, shotCount: number, intervals: [number, number][], experimentsCount: number, key: string) {
  shouldCancel = false

  const damageIndexMap = getDamageIndexMap(damage, shotCount, intervals)
  console.log('[Worker] damageIndexMap', damageIndexMap)

  const results = Array.from({ length: intervals.length }, () => Array.from({ length: experimentsCount }, () => 0))

  const progressStep = Math.floor(experimentsCount / 100)

  for (let i = 0; i < experimentsCount; i++) {
    for (let j = 0; j < shotCount; j++) {
      if (shouldCancel) return finish()

      const rand = Math.random()
      const dmg = Math.round(damage * (spline.at(rand) * 0.25 + 1))
      const index = damageIndexMap.get(dmg)!
      results[index][i] += 1
    }

    if (shouldCancel) return finish()
    if (i % progressStep == 0) {
      self.postMessage({ progress: i / experimentsCount * 0.95, result: null })
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  if (shouldCancel) return finish()
  for (let i = 0; i < results.length; i++) {
    results[i].sort((a, b) => a - b)
    for (let j = 0; j < results[i].length; j++) {
      results[i][j] /= shotCount
    }
  }

  if (shouldCancel) return finish()
  console.log('[Worker] Calculation finished')

  self.postMessage({ result: results, progress: 1, key })
  self.postMessage('end')
}

function getDamageIndexMap(damage: number, shotCount: number, intervals: [number, number][]) {
  const min = Math.round(damage * 0.75)
  const max = Math.round(damage * 1.25)

  const damageIndexMap = new Map<number, number>()

  for (let damage = min; damage <= max; damage++) {
    const intervalIndex = intervals.findIndex(([min, max]) => damage >= min && damage <= max)
    damageIndexMap.set(damage, intervalIndex)
  }

  return damageIndexMap
}