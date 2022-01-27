import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vueFeather from 'vue-feather';
import resize from 'vue-resize'


import iconBtn from '@/components/icon/index.vue';
import 'vue-resize/dist/vue-resize.css'

createApp(App)
    .use(store)
    .use(router)
    .use(resize)
    .component(vueFeather.name, vueFeather)
    .component('icon-btn', iconBtn)
    .mount('#app')
