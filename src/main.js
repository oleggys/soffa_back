import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import "@/assets/main.css"
import { TroisJSVuePlugin } from 'troisjs'
import { library } from '@fortawesome/fontawesome-svg-core';
import {fas} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas)
createApp(App)
    .component('font-awesome-icon', FontAwesomeIcon)
    .use(TroisJSVuePlugin)
    .mount('#app')
