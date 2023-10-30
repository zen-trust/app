import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
import type { Component } from 'vue'
import { createApp } from 'vue'
import timeAgo from 'vue-timeago3'
import App from './app.vue'
import './assets/main.css'
import { createApiContext } from './lib/http/plugin'
import { router } from './router'

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)

const app = createApp(App as Component)

app.use(pinia)
app.use(router)
app.use(timeAgo, {
  converterOptions: {
    addSuffix: true,
  },
})

const { vuePlugin, piniaPlugin } = createApiContext()
app.use(vuePlugin)
pinia.use(piniaPlugin)

app.mount('#app')
