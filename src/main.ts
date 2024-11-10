// import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import './assets/typograph.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState())
app.use(pinia)
app.use(router)
app.use(
  createVuetify({
    theme: {
      defaultTheme: 'light',
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    defaults: {
      VBtn: {
        variant: 'tonal',
      },
      VStepper: {
        nextText: '下一步',
        prevText: '上一步',
      },
      VDialog: {
        width: 'auto',
      },
    },
  }),
)

app.mount('#app')
