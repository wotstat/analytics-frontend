import './styles/index.scss'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './routes'
import { setup as setupYmMetrika } from './shared/external/ym/metrika'
import { vTextTooltip } from './shared/ui/tooltip/textTooltip'

console.log(`WotStat front start in **${import.meta.env.MODE}** mode`)

createApp(App)
  .use(router)
  .directive('tooltip', vTextTooltip)
  .mount('#app')

setupYmMetrika({
  webvisor: false,
  clickmap: false,
  trackLinks: false,
  accurateTrackBounce: false
})
