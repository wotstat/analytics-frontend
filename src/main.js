import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueFeather from 'vue-feather';


import iconBtn from '@/components/icon/index.vue';

createApp(App)
    .use(store)
    .use(router)
    .component(VueFeather.name, VueFeather)
    .component('icon-btn', iconBtn)
    .mount('#app')
