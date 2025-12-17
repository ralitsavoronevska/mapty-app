import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import '@/assets/css/main.css' // TailwindCSS v4 import

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
