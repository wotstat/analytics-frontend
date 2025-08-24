import './styles/index.scss'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './routes'
import { setup as setupYmMetrika } from './composition/ym/metrika'

import {
  Chart as ChartJS,
  Title, Tooltip, Legend, LineElement, PointElement, BarElement, CategoryScale, LinearScale, ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, BarElement, PointElement, CategoryScale, LinearScale, ArcElement)
ChartJS.defaults.color = 'rgba(255, 255, 255, 0.87)'
ChartJS.defaults.font.family = 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
ChartJS.defaults.font.weight = 500
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.2)'

// @ts-ignore
ChartJS.defaults.animation.duration = 400


console.log(`WotStat front start in **${import.meta.env.MODE}** mode`)

createApp(App)
  .use(router)
  .mount('#app')

setupYmMetrika({
  webvisor: false,
  clickmap: false,
  trackLinks: false,
  accurateTrackBounce: false
})
