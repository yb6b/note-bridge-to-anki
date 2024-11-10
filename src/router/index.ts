import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/mubuopml',
      name: 'mubuopml',
      component: () => import('@/views/mubu-opml.vue'),
    },
  ],
})

export default router
